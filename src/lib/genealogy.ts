import type { ParentChild, Partnership, Person } from "@prisma/client";

export type PersonNode = Person;

export type Graph = {
  people: Person[];
  byId: Map<string, Person>;
  parentsOf: Map<string, string[]>;
  childrenOf: Map<string, string[]>;
  partnersOf: Map<string, string[]>;
};

export function buildGraph(
  people: Person[],
  parentChild: ParentChild[],
  partnerships: Partnership[],
): Graph {
  const byId = new Map(people.map((p) => [p.id, p]));
  const parentsOf = new Map<string, string[]>();
  const childrenOf = new Map<string, string[]>();
  const partnersOf = new Map<string, string[]>();

  const push = (map: Map<string, string[]>, key: string, value: string) => {
    const list = map.get(key) ?? [];
    if (!list.includes(value)) list.push(value);
    map.set(key, list);
  };

  for (const rel of parentChild) {
    push(parentsOf, rel.childId, rel.parentId);
    push(childrenOf, rel.parentId, rel.childId);
  }

  for (const rel of partnerships) {
    push(partnersOf, rel.personAId, rel.personBId);
    push(partnersOf, rel.personBId, rel.personAId);
  }

  return { people, byId, parentsOf, childrenOf, partnersOf };
}

export function parents(graph: Graph, id: string) {
  return (graph.parentsOf.get(id) ?? [])
    .map((pid) => graph.byId.get(pid))
    .filter((p): p is Person => Boolean(p));
}

export function children(graph: Graph, id: string) {
  return (graph.childrenOf.get(id) ?? [])
    .map((cid) => graph.byId.get(cid))
    .filter((p): p is Person => Boolean(p))
    .sort((a, b) => {
      const da = a.birthDate?.getTime() ?? 0;
      const db = b.birthDate?.getTime() ?? 0;
      if (da !== db) return da - db;
      return a.firstName.localeCompare(b.firstName, "he");
    });
}

export function partners(graph: Graph, id: string) {
  return (graph.partnersOf.get(id) ?? [])
    .map((pid) => graph.byId.get(pid))
    .filter((p): p is Person => Boolean(p));
}

export function siblings(graph: Graph, id: string) {
  const parentIds = graph.parentsOf.get(id) ?? [];
  const found = new Map<string, Person>();
  for (const pid of parentIds) {
    for (const sib of children(graph, pid)) {
      if (sib.id !== id) found.set(sib.id, sib);
    }
  }
  return [...found.values()];
}

export function grandparents(graph: Graph, id: string) {
  const found = new Map<string, Person>();
  for (const parent of parents(graph, id)) {
    for (const gp of parents(graph, parent.id)) found.set(gp.id, gp);
  }
  return [...found.values()];
}

export function grandchildren(graph: Graph, id: string) {
  const found = new Map<string, Person>();
  for (const child of children(graph, id)) {
    for (const gc of children(graph, child.id)) found.set(gc.id, gc);
  }
  return [...found.values()];
}

export function ancestors(graph: Graph, id: string, depth = Infinity) {
  const result: Person[] = [];
  const seen = new Set<string>([id]);
  let frontier = parents(graph, id);
  let d = 0;
  while (frontier.length && d < depth) {
    const next: Person[] = [];
    for (const person of frontier) {
      if (seen.has(person.id)) continue;
      seen.add(person.id);
      result.push(person);
      next.push(...parents(graph, person.id));
    }
    frontier = next;
    d += 1;
  }
  return result;
}

export function descendants(graph: Graph, id: string, depth = Infinity) {
  const result: Person[] = [];
  const seen = new Set<string>([id]);
  let frontier = children(graph, id);
  let d = 0;
  while (frontier.length && d < depth) {
    const next: Person[] = [];
    for (const person of frontier) {
      if (seen.has(person.id)) continue;
      seen.add(person.id);
      result.push(person);
      next.push(...children(graph, person.id));
    }
    frontier = next;
    d += 1;
  }
  return result;
}

export function greatGrandparents(graph: Graph, id: string) {
  return ancestors(graph, id, 3).filter(
    (p) => !grandparents(graph, id).some((g) => g.id === p.id) && !parents(graph, id).some((x) => x.id === p.id),
  );
}

export function displayName(person: Pick<Person, "firstName" | "lastName">) {
  return [person.firstName, person.lastName].filter(Boolean).join(" ");
}

export function birthYear(person: Pick<Person, "birthDate">) {
  return person.birthDate ? person.birthDate.getFullYear() : null;
}

export function lifeSpan(person: Pick<Person, "birthDate" | "deathDate">) {
  const from = birthYear(person);
  if (!from && !person.deathDate) return null;
  const to = person.deathDate ? person.deathDate.getFullYear() : "היום";
  return from ? `${from} – ${to}` : null;
}

export function coupleKey(a: string, b: string) {
  return [a, b].sort().join("::");
}
