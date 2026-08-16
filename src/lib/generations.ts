import type { Person } from "@prisma/client";
import { buildGraph, partners, type Graph } from "./genealogy";

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

  // Everyone starts at the top and is pushed down: a child sits one below its
  // deepest parent, and a partner who married in joins the generation of the
  // person they are with — otherwise a spouse with no recorded parents would
  // pull the whole couple up to the oldest row.
  for (const person of people) gen.set(person.id, 0);

  for (let i = 0; i < 32; i++) {
    let changed = false;
    for (const person of people) {
      let want = gen.get(person.id) ?? 0;

      for (const parentId of graph.parentsOf.get(person.id) ?? []) {
        const parent = graph.byId.get(parentId);
        if (!parent || parent.isPlaceholder) continue;
        want = Math.max(want, (gen.get(parentId) ?? 0) + 1);
      }

      for (const partner of partners(graph, person.id)) {
        if (partner.isPlaceholder) continue;
        want = Math.max(want, gen.get(partner.id) ?? 0);
      }

      if (want !== gen.get(person.id)) {
        gen.set(person.id, want);
        changed = true;
      }
    }
    if (!changed) break;
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
