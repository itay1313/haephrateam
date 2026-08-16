import type { Person } from "@prisma/client";
import {
  children,
  displayName,
  parents,
  partners,
  siblings,
  type Graph,
} from "./genealogy";

export type KinshipStep = {
  person: Person;
  via: "self" | "parent" | "child" | "partner" | "sibling";
};

/**
 * Shortest path through parent, child, partner and sibling edges.
 * Used for "הקשר המשפחתי" — how two people are related.
 */
export function kinshipPath(graph: Graph, fromId: string, toId: string): KinshipStep[] | null {
  if (fromId === toId) {
    const person = graph.byId.get(fromId);
    return person ? [{ person, via: "self" }] : null;
  }

  const seen = new Set<string>([fromId]);
  const queue: { id: string; path: KinshipStep[] }[] = [];
  const start = graph.byId.get(fromId);
  if (!start) return null;
  queue.push({ id: fromId, path: [{ person: start, via: "self" }] });

  while (queue.length) {
    const { id, path } = queue.shift()!;
    const edges: { person: Person; via: KinshipStep["via"] }[] = [
      ...parents(graph, id).map((person) => ({ person, via: "parent" as const })),
      ...children(graph, id).map((person) => ({ person, via: "child" as const })),
      ...partners(graph, id).map((person) => ({ person, via: "partner" as const })),
      ...siblings(graph, id).map((person) => ({ person, via: "sibling" as const })),
    ];

    for (const edge of edges) {
      if (edge.person.isPlaceholder || seen.has(edge.person.id)) continue;
      const next = [...path, { person: edge.person, via: edge.via }];
      if (edge.person.id === toId) return next;
      seen.add(edge.person.id);
      queue.push({ id: edge.person.id, path: next });
    }
  }

  return null;
}

export function describeKinship(path: KinshipStep[] | null) {
  if (!path || path.length < 2) return "אותו אדם";
  const names = path.map((s) => displayName(s.person));
  return names.join(" ← ");
}

export function hebrewRelation(from: Person, to: Person, graph: Graph) {
  const path = kinshipPath(graph, from.id, to.id);
  if (!path || path.length < 2) return null;
  if (path.length === 2) {
    const via = path[1].via;
    if (via === "parent") return to.gender === "FEMALE" ? "אמא" : "אבא";
    if (via === "child") return to.gender === "FEMALE" ? "בת" : "בן";
    if (via === "partner") return to.gender === "FEMALE" ? "בת זוג" : "בן זוג";
    if (via === "sibling") return to.gender === "FEMALE" ? "אחות" : "אח";
  }
  return `קרוב משפחה · ${path.length - 1} צעדים`;
}
