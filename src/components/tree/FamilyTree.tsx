"use client";

import { TransformComponent, TransformWrapper, type ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  hasParents: boolean;
};

export type TreeLayoutDTO = {
  width: number;
  height: number;
  couples: {
    key: string;
    partnerType: string | null;
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

function coupleWidth(couple: TreeLayoutDTO["couples"][number]) {
  return couple.b ? TREE_CARD.w * 2 + TREE_CARD.gap : TREE_CARD.w;
}

export function FamilyTree({
  layout,
  focusId,
}: {
  layout: TreeLayoutDTO;
  focusId?: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
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

  const query = q.trim();
  const jump = query
    ? layout.couples.find(
        (c) => nameOf(c.a).includes(query) || (c.b && nameOf(c.b).includes(query)),
      )
    : undefined;

  const frameRef = useRef<HTMLDivElement>(null);

  // Fill whatever is left under the header, whatever height the header happens to be.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const fit = () => {
      const top = frame.getBoundingClientRect().top + window.scrollY;
      frame.style.height = `${Math.max(420, window.innerHeight - top)}px`;
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  /** Put a couple in the middle of the canvas — the tree is far wider than the screen. */
  const centerOn = useCallback(
    (util: ReactZoomPanPinchRef, target?: TreeLayoutDTO["couples"][number], animate = true) => {
      const frame = frameRef.current;
      if (!frame) return;
      const vw = frame.clientWidth;
      const vh = frame.clientHeight;
      const scale = Math.min(0.9, Math.max(0.62, (vw - 120) / layout.width));
      const fits = layout.width * scale <= vw && layout.height * scale <= vh;

      const cx = target && !fits ? target.x + coupleWidth(target) / 2 : layout.width / 2;
      const cy = target && !fits ? target.y + TREE_CARD.h / 2 : layout.height / 2;

      util.setTransform(vw / 2 - cx * scale, vh / 2 - cy * scale, scale, animate ? 200 : 0);
    },
    [layout],
  );

  const landingCouple = useMemo(
    () =>
      layout.couples.find((c) => c.a.id === focusId || c.b?.id === focusId) ??
      layout.couples.find((c) => !c.a.isPlaceholder) ??
      layout.couples[0],
    [layout, focusId],
  );

  // The canvas positions cards with plain left/top, so it has to be laid out LTR;
  // the cards themselves put their text back to RTL.
  return (
    <div ref={frameRef} dir="ltr" className="relative h-[70vh] overflow-hidden bg-paper-deep">
      <TransformWrapper
        minScale={0.35}
        maxScale={2.2}
        initialScale={0.85}
        wheel={{ step: 0.12 }}
        onInit={(util) => centerOn(util, landingCouple, false)}
      >
        {(util) => (
          <>
            <div dir="rtl" className="absolute top-4 right-4 z-10 flex flex-wrap items-center gap-2">
              <IconBtn onClick={() => util.zoomIn()}>+</IconBtn>
              <IconBtn onClick={() => util.zoomOut()}>−</IconBtn>
              <IconBtn
                onClick={() => {
                  if (jump) {
                    centerOn(util, jump);
                    setSelected(jump.a.id);
                  } else {
                    centerOn(util, landingCouple);
                  }
                }}
              >
                {jump ? `לקפוץ אל ${jump.a.firstName}` : "מרכוז"}
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
                    {c.b && !c.b.isPlaceholder && !c.a.isPlaceholder ? (
                      <PartnerBond former={c.partnerType === "FORMER"} />
                    ) : null}
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
                      onAddParents={() => router.push(`/people/${c.a.slug}#parents`)}
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
                        onAddParents={() => c.b && router.push(`/people/${c.b.slug}#parents`)}
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
        <aside dir="rtl" className="absolute bottom-0 right-0 top-0 z-20 w-full max-w-md overflow-y-auto border-l border-[var(--line)] bg-paper p-6 md:w-[380px]">
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
  onAddParents,
}: {
  person: TreePersonDTO;
  selected: boolean;
  collapsed: boolean;
  hasChildren: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onOpen: () => void;
  onAddParents: () => void;
}) {
  return (
    <div dir="rtl" className={`w-[168px] text-right ${person.isPlaceholder ? "opacity-55" : ""}`}>
      {!person.hasParents && !person.isPlaceholder ? (
        <button
          type="button"
          onClick={onAddParents}
          className="mb-2 w-full cursor-pointer border border-dashed border-[var(--line-strong)] py-1 text-[11px] text-bronze transition-colors hover:border-bronze hover:text-ink"
        >
          ＋ ההורים של {person.firstName}
        </button>
      ) : null}
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

/**
 * The short line between two cards. A bond that ended is drawn dashed and named
 * plainly — it stays part of the family record without being singled out.
 */
function PartnerBond({ former }: { former: boolean }) {
  return (
    <div
      className="pointer-events-none absolute z-0 flex flex-col items-center"
      style={{ left: TREE_CARD.w, top: TREE_CARD.h / 2 - 24, width: TREE_CARD.gap + 28 }}
    >
      <div
        className={`w-full border-t ${
          former ? "border-dashed border-ink/25" : "border-ink/40"
        }`}
      />
      {former ? (
        <span dir="rtl" className="mt-1 text-[10px] leading-none text-muted">
          לשעבר
        </span>
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
