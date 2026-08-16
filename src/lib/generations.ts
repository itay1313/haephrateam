import type { Person } from "@prisma/client";
import { buildGraph, children, partners, type Graph } from "./genealogy";

export type GenerationBucket = {
  /** 0-based from the oldest currently documented generation. Shifts when ancestors are added. */
  index: number;
  label: string;
  people: Person[];
};

/**
 * Generation numbers are never stored. Partners share a generation.
 * Children are one generation after their parents. When earlier ancestors
 * are added later, display numbers shift automatically.
 */
export function computeGenerations(graph: Graph): Map<string, number> {
  const gen = new Map<string, number>();
  const people = graph.people.filter((p) => !p.isPlaceholder);

  const assign = (id: string, value: number) => {
    const current = gen.get(id);
    if (current === undefined || value < current) gen.set(id, value);
  };

  // Seed: people with no recorded parents.
  for (const person of people) {
    const hasParents = (graph.parentsOf.get(person.id) ?? []).some((id) => {
      const p = graph.byId.get(id);
      return p && !p.isPlaceholder;
    });
    if (!hasParents) assign(person.id, 0);
  }

  // Relax constraints until stable (handles both family sides + partners).
  for (let i = 0; i < 24; i++) {
    let changed = false;
    for (const person of people) {
      const g = gen.get(person.id);
      if (g === undefined) continue;

      for (const partner of partners(graph, person.id)) {
        if (partner.isPlaceholder) continue;
        const pg = gen.get(partner.id);
        const next = pg === undefined ? g : Math.min(pg, g);
        if (pg !== next) {
          gen.set(partner.id, next);
          gen.set(person.id, next);
          changed = true;
        }
      }

      for (const child of children(graph, person.id)) {
        if (child.isPlaceholder) continue;
        const cg = gen.get(child.id);
        const next = g + 1;
        if (cg === undefined || next < cg) {
          gen.set(child.id, next);
          changed = true;
        }
      }
    }
    if (!changed) break;
  }

  for (const person of people) {
    if (!gen.has(person.id)) gen.set(person.id, 0);
  }

  for (const placeholder of graph.people.filter((p) => p.isPlaceholder)) {
    const hostId = placeholder.attachedToId;
    const hostGen = hostId ? gen.get(hostId) : undefined;
    if (hostGen === undefined) continue;
    if (placeholder.placeholderKind === "PARTNER") gen.set(placeholder.id, hostGen);
    else gen.set(placeholder.id, hostGen + 1);
  }

  const min = Math.min(...[...gen.values(), 0]);
  if (min !== 0) {
    for (const [id, value] of gen) gen.set(id, value - min);
  }

  return gen;
}

export function generationBuckets(graph: Graph): GenerationBucket[] {
  const gen = computeGenerations(graph);
  const realValues = graph.people
    .filter((p) => !p.isPlaceholder)
    .map((p) => gen.get(p.id) ?? 0);
  const max = Math.max(0, ...realValues);
  const buckets: GenerationBucket[] = [];

  for (let i = 0; i <= max; i++) {
    const people = graph.people.filter((p) => !p.isPlaceholder && gen.get(p.id) === i);
    buckets.push({
      index: i,
      label: generationLabel(i, max),
      people,
    });
  }
  return buckets;
}

export function generationLabel(index: number, max: number) {
  if (index === 0) return "הדור הקדום ביותר המתועד";
  if (index === max && max > 0) return "הדור הצעיר";
  return `דור ${index + 1}`;
}

export function relativeGeneration(graph: Graph, fromId: string, toId: string) {
  const gen = computeGenerations(graph);
  const a = gen.get(fromId);
  const b = gen.get(toId);
  if (a === undefined || b === undefined) return null;
  return b - a;
}

export function buildGraphFrom(
  people: Person[],
  parentChild: Parameters<typeof buildGraph>[1],
  partnerships: Parameters<typeof buildGraph>[2],
) {
  return buildGraph(people, parentChild, partnerships);
}
