"use client";

import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TREE_CARD } from "@/lib/tree-layout";
import { Portrait } from "@/components/person/Portrait";

export type TreePersonDTO = {
  id: string;
  slug: string;
  firstName: string;
  lastName: string | null;
  gender: string;
  birthYear: number | null;
  isPlaceholder: boolean;
  placeholderKind: string | null;
  portraitUrl: string | null;
};

export type TreeLayoutDTO = {
  width: number;
  height: number;
  couples: {
    key: string;
    a: TreePersonDTO;
    b: TreePersonDTO | null;
    x: number;
    y: number;
    gen: number;
    childKeys: string[];
  }[];
  parentEdges: { from: string; to: string }[];
};

function nameOf(p: TreePersonDTO) {
  return [p.firstName, p.lastName].filter(Boolean).join(" ");
}

export function FamilyTree({
  layout,
  focusId,
}: {
  layout: TreeLayoutDTO;
  focusId?: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(focusId ?? null);
  const [q, setQ] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const coupleByKey = useMemo(
    () => new Map(layout.couples.map((c) => [c.key, c])),
    [layout],
  );

  const hiddenKeys = useMemo(() => {
    const hidden = new Set<string>();
    const walk = (key: string) => {
      const c = coupleByKey.get(key);
      if (!c) return;
      for (const ck of c.childKeys) {
        hidden.add(ck);
        walk(ck);
      }
    };
    for (const couple of layout.couples) {
      if (collapsed.has(couple.a.id) || (couple.b && collapsed.has(couple.b.id))) {
        walk(couple.key);
      }
    }
    return hidden;
  }, [collapsed, coupleByKey, layout.couples]);

  const selectedPerson = useMemo(() => {
    for (const c of layout.couples) {
      if (c.a.id === selected) return c.a;
      if (c.b?.id === selected) return c.b;
    }
    return null;
  }, [layout, selected]);

  const jump = layout.couples.find(
    (c) =>
      nameOf(c.a).includes(q) || (c.b && nameOf(c.b).includes(q)) || c.a.firstName === q,
  );

  return (
    <div className="relative h-[calc(100dvh-3.6rem)] overflow-hidden bg-paper-deep">
      <TransformWrapper
        minScale={0.35}
        maxScale={2.2}
        initialScale={0.85}
        centerOnInit
        wheel={{ step: 0.12 }}
      >
        {({ zoomIn, zoomOut, centerView, setTransform }) => (
          <>
            <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
              <IconBtn onClick={() => zoomIn()}>+</IconBtn>
              <IconBtn onClick={() => zoomOut()}>−</IconBtn>
              <IconBtn
                onClick={() => {
                  centerView(0.85);
                  if (jump) {
                    setTransform(
                      -jump.x * 0.85 + 400,
                      -jump.y * 0.85 + 200,
                      0.85,
                    );
                    setSelected(jump.a.id);
                  }
                }}
              >
                מרכוז
              </IconBtn>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="קפיצה לאדם"
                className="w-44 bg-paper/90 text-sm"
              />
            </div>
            <TransformComponent
              wrapperClass="tree-canvas !h-full !w-full"
              contentClass="!p-0"
            >
              <div style={{ width: layout.width, height: layout.height }} className="relative">
                <svg
                  width={layout.width}
                  height={layout.height}
                  className="absolute inset-0"
                >
                  {layout.parentEdges
                    .filter((e) => !hiddenKeys.has(e.from) && !hiddenKeys.has(e.to))
                    .map((e) => {
                    const from = coupleByKey.get(e.from);
                    const to = coupleByKey.get(e.to);
                    if (!from || !to) return null;
                    const fromW = from.b ? TREE_CARD.w * 2 + TREE_CARD.gap : TREE_CARD.w;
                    const toW = to.b ? TREE_CARD.w * 2 + TREE_CARD.gap : TREE_CARD.w;
                    const x1 = from.x + fromW / 2;
                    const y1 = from.y + TREE_CARD.h;
                    const x2 = to.x + toW / 2;
                    const y2 = to.y;
                    const mid = (y1 + y2) / 2;
                    return (
                      <path
                        key={`${e.from}-${e.to}`}
                        d={`M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`}
                        fill="none"
                        stroke="rgba(26,22,18,0.28)"
                        strokeWidth="1.25"
                      />
                    );
                  })}
                </svg>
                {layout.couples
                  .filter((c) => !hiddenKeys.has(c.key))
                  .map((c) => (
                  <div
                    key={c.key}
                    className="absolute flex gap-7"
                    style={{ left: c.x, top: c.y }}
                  >
                    <PersonCard
                      person={c.a}
                      selected={selected === c.a.id}
                      collapsed={collapsed.has(c.a.id)}
                      hasChildren={c.childKeys.length > 0}
                      onToggle={() => {
                        setCollapsed((prev) => {
                          const next = new Set(prev);
                          if (next.has(c.a.id)) next.delete(c.a.id);
                          else next.add(c.a.id);
                          return next;
                        });
                      }}
                      onSelect={() => {
                        if (c.a.isPlaceholder) {
                          window.dispatchEvent(new Event("haephrati:add"));
                          return;
                        }
                        setSelected(c.a.id);
                      }}
                      onOpen={() => !c.a.isPlaceholder && router.push(`/people/${c.a.slug}`)}
                    />
                    {c.b ? (
                      <PersonCard
                        person={c.b}
                        selected={selected === c.b.id}
                        collapsed={collapsed.has(c.b.id)}
                        hasChildren={false}
                        onToggle={() => {}}
                        onSelect={() => {
                          if (c.b?.isPlaceholder) {
                            window.dispatchEvent(new Event("haephrati:add"));
                            return;
                          }
                          setSelected(c.b!.id);
                        }}
                        onOpen={() => c.b && !c.b.isPlaceholder && router.push(`/people/${c.b.slug}`)}
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>

      {selectedPerson && !selectedPerson.isPlaceholder ? (
        <aside className="absolute bottom-0 left-0 top-0 z-20 w-full max-w-md overflow-y-auto border-r border-[var(--line)] bg-paper p-6 md:w-[380px]">
          <button className="mb-6 cursor-pointer text-sm text-muted" onClick={() => setSelected(null)}>
            סגירה
          </button>
          <Portrait name={nameOf(selectedPerson)} storageKey={selectedPerson.portraitUrl} />
          <h2 className="font-display mt-5 text-4xl">{nameOf(selectedPerson)}</h2>
          {selectedPerson.birthYear ? (
            <p className="mt-2 text-muted">{selectedPerson.birthYear}</p>
          ) : null}
          <button
            className="mt-8 w-full cursor-pointer bg-ink py-3 text-cream"
            onClick={() => router.push(`/people/${selectedPerson.slug}`)}
          >
            לעמוד של {selectedPerson.firstName}
          </button>
        </aside>
      ) : null}
    </div>
  );
}

function PersonCard({
  person,
  selected,
  collapsed,
  hasChildren,
  onToggle,
  onSelect,
  onOpen,
}: {
  person: TreePersonDTO;
  selected: boolean;
  collapsed: boolean;
  hasChildren: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onOpen: () => void;
}) {
  return (
    <div className={`w-[168px] text-right ${person.isPlaceholder ? "opacity-55" : ""}`}>
      <button
        type="button"
        onClick={onSelect}
        onDoubleClick={onOpen}
        className="w-full cursor-pointer text-right"
      >
        <div className={`overflow-hidden ${selected ? "ring-1 ring-ink" : ""}`}>
          <Portrait
            name={person.firstName}
            storageKey={person.portraitUrl}
            className="h-[168px] !aspect-auto"
          />
        </div>
        <div className="mt-2 font-display text-lg leading-tight">{nameOf(person) || person.firstName}</div>
        {person.birthYear ? <div className="text-xs text-muted">{person.birthYear}</div> : null}
        {person.isPlaceholder ? <div className="text-[11px] text-bronze">להשלים</div> : null}
      </button>
      {hasChildren && !person.isPlaceholder ? (
        <button
          type="button"
          onClick={onToggle}
          className="mt-1 cursor-pointer text-[11px] text-bronze"
        >
          {collapsed ? "פתיחת ענף" : "סגירת ענף"}
        </button>
      ) : null}
    </div>
  );
}

function IconBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer bg-paper/90 px-3 py-1.5 text-sm shadow-sm"
    >
      {children}
    </button>
  );
}
