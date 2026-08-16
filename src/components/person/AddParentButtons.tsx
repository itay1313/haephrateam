"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddParentButtons({ personId, missing }: { personId: string; missing: boolean }) {
  const [open, setOpen] = useState<"MALE" | "FEMALE" | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  if (!missing && !open) {
    return (
      <div className="mt-8 flex gap-3">
        <button type="button" className="cursor-pointer text-sm text-bronze" onClick={() => setOpen("MALE")}>
          הוספת אבא
        </button>
        <button type="button" className="cursor-pointer text-sm text-bronze" onClick={() => setOpen("FEMALE")}>
          הוספת אמא
        </button>
      </div>
    );
  }

  async function save() {
    if (!open || !firstName.trim()) return;
    setBusy(true);
    const res = await fetch(`/api/people/${personId}/parent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, gender: open }),
    });
    const json = await res.json();
    setBusy(false);
    if (res.ok) {
      setOpen(null);
      router.push(`/people/${json.person.slug}`);
      router.refresh();
    }
  }

  return (
    <div className="mt-8">
      <div className="flex gap-3">
        <button
          type="button"
          className="cursor-pointer border border-[var(--line-strong)] px-4 py-2 text-sm"
          onClick={() => setOpen("MALE")}
        >
          הוספת אבא
        </button>
        <button
          type="button"
          className="cursor-pointer border border-[var(--line-strong)] px-4 py-2 text-sm"
          onClick={() => setOpen("FEMALE")}
        >
          הוספת אמא
        </button>
      </div>
      {open ? (
        <div className="mt-4 space-y-3 border border-[var(--line)] p-4">
          <p className="text-sm text-muted">{open === "FEMALE" ? "אמא חדשה" : "אבא חדש"}</p>
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="שם" />
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="שם משפחה" />
          <button
            type="button"
            disabled={busy}
            onClick={save}
            className="cursor-pointer bg-ink px-4 py-2 text-cream"
          >
            שמירה והוספה לעץ
          </button>
        </div>
      ) : null}
    </div>
  );
}
