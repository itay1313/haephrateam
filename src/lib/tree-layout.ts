import { children, coupleKey, displayName, type Graph } from "./genealogy";
import { computeGenerations } from "./generations";
import type { Person } from "@prisma/client";

export type LaidPerson = {
  person: Person;
  x: number;
  y: number;
  gen: number;
};

export type LaidCouple = {
  key: string;
  a: Person;
  b: Person | null;
  /** MARRIED | PARTNER | FORMER | ENGAGED — null when the person stands alone. */
  partnerType: string | null;
  x: number;
  y: number;
  gen: number;
  childKeys: string[];
};

export type TreeLayout = {
  width: number;
  height: number;
  couples: LaidCouple[];
  people: LaidPerson[];
  parentEdges: { from: string; to: string }[];
  partnerEdges: { from: string; to: string }[];
};

const CARD_W = 168;
const CARD_H = 210;
const COUPLE_GAP = 28;
const GEN_H = 320;
const PAD = 80;

function unitWidth(hasPartner: boolean) {
  return hasPartner ? CARD_W * 2 + COUPLE_GAP : CARD_W;
}

export function layoutTree(graph: Graph, collapsed = new Set<string>()): TreeLayout {
  const genMap = computeGenerations(graph);
  const visible = new Set<string>();

  const hiddenDescendants = new Set<string>();
  const walkHide = (id: string) => {
    for (const child of children(graph, id)) {
      hiddenDescendants.add(child.id);
      walkHide(child.id);
    }
  };
  for (const id of collapsed) walkHide(id);

  const realPeople = graph.people.filter((p) => !hiddenDescendants.has(p.id));
  for (const p of realPeople) visible.add(p.id);

  const used = new Set<string>();
  const units: { a: Person; b: Person | null; gen: number; childIds: string[] }[] = [];

  const consider = graph.people
    .filter((p) => visible.has(p.id))
    .sort((a, b) => (genMap.get(a.id) ?? 0) - (genMap.get(b.id) ?? 0));

  for (const person of consider) {
    if (used.has(person.id)) continue;
    const gen = genMap.get(person.id) ?? 0;
    const partnerList = (graph.partnersOf.get(person.id) ?? [])
      .map((id) => graph.byId.get(id))
      .filter((p): p is Person => {
        if (!p) return false;
        return visible.has(p.id);
      });
    const partner = partnerList[0] ?? null;
    if (partner) used.add(partner.id);
    used.add(person.id);

    const childIds = [
      ...new Set([
        ...(graph.childrenOf.get(person.id) ?? []),
        ...(partner ? graph.childrenOf.get(partner.id) ?? [] : []),
      ]),
    ].filter((id) => visible.has(id));

    const a = person.gender === "FEMALE" || !partner ? person : partner.gender === "FEMALE" ? partner : person;
    const b = partner ? (a.id === person.id ? partner : person) : null;
    // Prefer female on the right in RTL visual (first in RTL couple)
    const femaleFirst = orderCouple(a, b);

    units.push({
      a: femaleFirst.a,
      b: femaleFirst.b,
      gen: partner ? Math.max(gen, genMap.get(partner.id) ?? gen) : gen,
      childIds: childIds.filter((id) => visible.has(id)),
    });
  }

  const byGen = new Map<number, typeof units>();
  for (const unit of units) {
    const list = byGen.get(unit.gen) ?? [];
    list.push(unit);
    byGen.set(unit.gen, list);
  }

  const maxGen = Math.max(0, ...units.map((u) => u.gen));

  // Bottom-up widths so parents center over children.
  const widths = new Map<string, number>();
  const keyOf = (u: (typeof units)[0]) => coupleKey(u.a.id, u.b?.id ?? u.a.id);

  for (let g = maxGen; g >= 0; g--) {
    for (const unit of byGen.get(g) ?? []) {
      const own = unitWidth(Boolean(unit.b));
      const childUnits = (byGen.get(g + 1) ?? []).filter((c) =>
        unit.childIds.includes(c.a.id) || (c.b && unit.childIds.includes(c.b.id)),
      );
      const childW = childUnits.reduce((sum, c) => sum + (widths.get(keyOf(c)) ?? unitWidth(Boolean(c.b))) + 48, -48);
      widths.set(keyOf(unit), Math.max(own, childW, 0));
    }
  }

  const positions = new Map<string, { x: number; y: number }>();
  let maxX = 0;

  // Place oldest generation left-to-right, then center children under parents.
  const rootRow = byGen.get(0) ?? [];
  let cursor = PAD;
  for (const unit of rootRow) {
    const w = widths.get(keyOf(unit)) ?? unitWidth(Boolean(unit.b));
    const own = unitWidth(Boolean(unit.b));
    positions.set(keyOf(unit), { x: cursor + (w - own) / 2, y: PAD });
    placeChildren(unit, cursor, 0);
    cursor += w + 80;
    maxX = Math.max(maxX, cursor);
  }

  function placeChildren(parent: (typeof units)[0], subtreeX: number, parentGen: number) {
    const childUnits = (byGen.get(parentGen + 1) ?? []).filter(
      (c) => parent.childIds.includes(c.a.id) || (c.b && parent.childIds.includes(c.b.id)),
    );
    if (!childUnits.length) return;
    const parentW = widths.get(keyOf(parent)) ?? unitWidth(Boolean(parent.b));
    const totalChild = childUnits.reduce((s, c) => s + (widths.get(keyOf(c)) ?? unitWidth(Boolean(c.b))) + 48, -48);
    let x = subtreeX + Math.max(0, (parentW - totalChild) / 2);
    for (const child of childUnits) {
      const w = widths.get(keyOf(child)) ?? unitWidth(Boolean(child.b));
      const own = unitWidth(Boolean(child.b));
      const y = PAD + (parentGen + 1) * GEN_H;
      positions.set(keyOf(child), { x: x + (w - own) / 2, y });
      maxX = Math.max(maxX, x + w);
      placeChildren(child, x, parentGen + 1);
      x += w + 48;
    }
  }

  const couples: LaidCouple[] = [];
  const people: LaidPerson[] = [];
  const parentEdges: { from: string; to: string }[] = [];
  const partnerEdges: { from: string; to: string }[] = [];

  for (const unit of units) {
    const pos = positions.get(keyOf(unit));
    if (!pos) continue;
    couples.push({
      key: keyOf(unit),
      a: unit.a,
      b: unit.b,
      partnerType: unit.b ? graph.partnerTypeOf.get(coupleKey(unit.a.id, unit.b.id)) ?? "PARTNER" : null,
      x: pos.x,
      y: pos.y,
      gen: unit.gen,
      childKeys: (byGen.get(unit.gen + 1) ?? [])
        .filter((c) => unit.childIds.includes(c.a.id) || (c.b && unit.childIds.includes(c.b.id)))
        .map(keyOf),
    });

    people.push({ person: unit.a, x: pos.x, y: pos.y, gen: unit.gen });
    if (unit.b) {
      people.push({ person: unit.b, x: pos.x + CARD_W + COUPLE_GAP, y: pos.y, gen: unit.gen });
      partnerEdges.push({ from: unit.a.id, to: unit.b.id });
    }
  }

  for (const couple of couples) {
    for (const ck of couple.childKeys) {
      parentEdges.push({ from: couple.key, to: ck });
    }
  }

  const height = PAD * 2 + (maxGen + 1) * GEN_H;
  const width = Math.max(maxX + PAD, 1200);

  return { width, height, couples, people, parentEdges, partnerEdges };
}

function orderCouple(a: Person, b: Person | null) {
  if (!b) return { a, b: null };
  if (a.gender === "FEMALE" && b.gender !== "FEMALE") return { a, b };
  if (b.gender === "FEMALE" && a.gender !== "FEMALE") return { a: b, b: a };
  return displayName(a).localeCompare(displayName(b), "he") <= 0 ? { a, b } : { a: b, b: a };
}

export const TREE_CARD = { w: CARD_W, h: CARD_H, gap: COUPLE_GAP };
