import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { loadGraph } from "@/lib/queries";
import { children, displayName, partners } from "@/lib/genealogy";
import { PersonChip } from "@/components/person/PersonChip";

export default async function BranchPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const family = await prisma.family.findUnique({
    where: { slug },
    include: { people: { include: { person: { include: { portrait: true } } } } },
  });
  if (!family) notFound();
  const { graph } = await loadGraph();

  const members = family.people.map((p) => p.person).filter((p) => !p.isPlaceholder);
  const roots = members.filter((p) => {
    const parentIds = graph.parentsOf.get(p.id) ?? [];
    return parentIds.every((id) => !members.some((m) => m.id === id));
  });

  return (
    <div className="mx-auto max-w-[1100px] px-5 py-16 md:px-8">
      <p className="kicker">ענף משפחתי</p>
      <h1 className="font-display mt-3 text-6xl">{family.name}</h1>
      {family.description ? <p className="mt-5 max-w-xl text-lg text-ink-soft">{family.description}</p> : null}

      <div className="mt-16 space-y-16">
        {roots.map((root) => {
          const partner = partners(graph, root.id).filter((p) => members.some((m) => m.id === p.id));
          const kids = children(graph, root.id).filter((p) => !p.isPlaceholder);
          return (
            <section key={root.id}>
              <div className="grid grid-cols-2 gap-6 md:max-w-lg">
                <PersonChip
                  href={`/people/${root.slug}`}
                  name={displayName(root)}
                  storageKey={root.portrait?.storageKey}
                />
                {partner[0] ? (
                  <PersonChip
                    href={`/people/${partner[0].slug}`}
                    name={displayName(partner[0])}
                    storageKey={members.find((m) => m.id === partner[0].id)?.portrait?.storageKey}
                  />
                ) : null}
              </div>
              {kids.length ? (
                <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-3">
                  {kids.map((k) => (
                    <PersonChip
                      key={k.id}
                      href={`/people/${k.slug}`}
                      name={displayName(k)}
                      storageKey={members.find((m) => m.id === k.id)?.portrait?.storageKey}
                    />
                  ))}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}
