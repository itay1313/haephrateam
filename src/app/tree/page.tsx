import { loadGraph } from "@/lib/queries";
import { layoutTree } from "@/lib/tree-layout";
import { FamilyTree, type TreeLayoutDTO, type TreePersonDTO } from "@/components/tree/FamilyTree";
import { MobileTree, type CompassPerson } from "@/components/tree/MobileTree";
import { children, parents, partners, siblings } from "@/lib/genealogy";
import { yearOf } from "@/lib/format";

function toDTO(
  person: {
    id: string;
    slug: string;
    firstName: string;
    lastName: string | null;
    gender: string;
    birthDate: Date | null;
    isPlaceholder: boolean;
    placeholderKind: string | null;
  },
  portraits: Map<string, string | null>,
  withParents: Set<string>,
): TreePersonDTO {
  return {
    id: person.id,
    slug: person.slug,
    firstName: person.firstName,
    lastName: person.lastName,
    gender: person.gender,
    birthYear: yearOf(person.birthDate),
    isPlaceholder: person.isPlaceholder,
    placeholderKind: person.placeholderKind,
    portraitUrl: portraits.get(person.id) ?? null,
    hasParents: withParents.has(person.id),
  };
}

export default async function TreePage({
  searchParams,
}: {
  searchParams: Promise<{ person?: string }>;
}) {
  const { person: slug } = await searchParams;
  const { people, graph } = await loadGraph();
  const portraits = new Map(people.map((p) => [p.id, p.portrait?.storageKey ?? null]));
  // Who already has at least one parent in the archive — the rest get an
  // "add parents" prompt on their card.
  const withParents = new Set(
    people.filter((p) => parents(graph, p.id).length > 0).map((p) => p.id),
  );
  const layout = layoutTree(graph);
  const dto: TreeLayoutDTO = {
    width: layout.width,
    height: layout.height,
    parentEdges: layout.parentEdges,
    couples: layout.couples.map((c) => ({
      key: c.key,
      a: toDTO(c.a, portraits, withParents),
      b: c.b ? toDTO(c.b, portraits, withParents) : null,
      x: c.x,
      y: c.y,
      gen: c.gen,
      childKeys: c.childKeys,
    })),
  };

  const compass: CompassPerson[] = graph.people.map((p) => ({
    ...toDTO(p, portraits, withParents),
    parentIds: parents(graph, p.id).map((x) => x.id),
    childIds: children(graph, p.id).map((x) => x.id),
    partnerIds: partners(graph, p.id).map((x) => x.id),
    siblingIds: siblings(graph, p.id).map((x) => x.id),
  }));

  const focus =
    people.find((p) => p.slug === slug)?.id ??
    people.find((p) => p.slug === "ofer-haephrati")?.id;

  return (
    <div>
      <div className="hidden md:block">
        <FamilyTree layout={dto} focusId={focus} />
      </div>
      <div className="md:hidden">
        <MobileTree people={compass} centerId={focus ?? compass[0]?.id} />
      </div>
    </div>
  );
}
