"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Portrait } from "@/components/person/Portrait";
import type { TreePersonDTO } from "./FamilyTree";

export type CompassPerson = TreePersonDTO & {
  parentIds: string[];
  childIds: string[];
  partnerIds: string[];
  siblingIds: string[];
};

function nameOf(p: TreePersonDTO) {
  return [p.firstName, p.lastName].filter(Boolean).join(" ");
}

export function MobileTree({
  people,
  centerId,
}: {
  people: CompassPerson[];
  centerId: string;
}) {
  const byId = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);
  const center = byId.get(centerId) ?? people.find((p) => !p.isPlaceholder);
  if (!center) return null;

  const row = (ids: string[]) =>
    ids
      .map((id) => byId.get(id))
      .filter((p): p is CompassPerson => Boolean(p));

  const parents = row(center.parentIds);
  const partners = row(center.partnerIds);
  const kids = row(center.childIds);
  const siblings = row(center.siblingIds);

  return (
    <div className="px-5 py-16">
      <p className="kicker mb-8">ניווט משפחתי</p>
      {parents.length ? (
        <Section title="הורים">
          <div className="flex justify-center gap-4">
            {parents.map((p) => (
              <Mini key={p.id} person={p} />
            ))}
          </div>
        </Section>
      ) : (
        <Section title="הורים">
          <p className="text-center text-sm text-muted">עדיין לא ידועים · אפשר להוסיף אבא או אמא</p>
        </Section>
      )}

      <div className="my-8 flex items-end justify-center gap-4">
        <div className="w-40">
          <Portrait name={nameOf(center)} storageKey={center.portraitUrl} />
          <h1 className="font-display mt-3 text-center text-3xl">{nameOf(center)}</h1>
        </div>
        {partners.map((p) => (
          <Mini key={p.id} person={p} />
        ))}
      </div>

      {kids.length ? (
        <Section title="ילדים">
          <div className="flex flex-wrap justify-center gap-4">
            {kids.map((p) => (
              <Mini key={p.id} person={p} />
            ))}
          </div>
        </Section>
      ) : null}

      {siblings.length ? (
        <Section title="אחים ואחיות">
          <div className="flex flex-wrap justify-center gap-4">
            {siblings.map((p) => (
              <Mini key={p.id} person={p} />
            ))}
          </div>
        </Section>
      ) : null}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 text-center text-xs tracking-[0.25em] text-bronze">{title}</h2>
      {children}
    </section>
  );
}

function Mini({ person }: { person: CompassPerson }) {
  const href = person.isPlaceholder ? "#" : `/tree?person=${person.slug}`;
  const inner = (
    <>
      <div className="w-24 overflow-hidden">
        <Portrait name={person.firstName} storageKey={person.portraitUrl} />
      </div>
      <div className="mt-2 text-center font-display text-base">
        {nameOf(person) || person.firstName}
      </div>
    </>
  );
  if (person.isPlaceholder) {
    return (
      <button type="button" className="opacity-60" onClick={() => window.dispatchEvent(new Event("haephrati:add"))}>
        {inner}
      </button>
    );
  }
  return (
    <Link href={href} className="cursor-pointer">
      {inner}
    </Link>
  );
}
