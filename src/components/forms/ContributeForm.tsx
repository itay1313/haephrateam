"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type PersonOpt = { id: string; firstName: string; lastName: string | null };

const ERRORS: Record<string, string> = {
  config: "גוגל תמונות עדיין לא מחובר בשרת. צריך GOOGLE_CLIENT_ID ו־GOOGLE_CLIENT_SECRET.",
  google: "החיבור לגוגל לא הושלם.",
  picker: "גוגל תמונות לא פתח את חלון הבחירה.",
};

export function ContributeForm({
  people,
  googleReady,
  googleConnected,
}: {
  people: PersonOpt[];
  googleReady: boolean;
  googleConnected: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [tab, setTab] = useState<"photo" | "google" | "text">(
    params.get("google") ? "google" : "photo",
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(ERRORS[params.get("error") ?? ""] ?? null);
  const [polling, setPolling] = useState(params.get("google") === "picking");
  const [pickerUri, setPickerUri] = useState<string | null>(null);

  useEffect(() => {
    if (!polling) return;
    let stop = false;
    let opened = false;
    async function tick() {
      const res = await fetch("/api/google/picker/status");
      const json = await res.json();
      if (stop) return;
      if (json.pickerUri) {
        setPickerUri(json.pickerUri);
        if (!opened) {
          opened = true;
          window.open(json.pickerUri, "_blank", "noopener");
        }
      }
      if (json.done) {
        setBusy(true);
        const imported = await fetch("/api/google/picker/import", { method: "POST" });
        const data = await imported.json();
        setBusy(false);
        setPolling(false);
        if (!imported.ok) {
          setError(data.error ?? "לא הצלחנו לייבא");
          return;
        }
        setMessage(data.count ? `נשמרו ${data.count} תמונות בארכיון` : "לא נבחרו תמונות");
        router.refresh();
        if (data.count) router.push("/");
        return;
      }
      setTimeout(tick, json.pollMs ?? 2500);
    }
    tick();
    return () => {
      stop = true;
    };
  }, [polling, router]);

  async function uploadPhotos(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/media", { method: "POST", body: fd });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(json.error ?? "ההעלאה נכשלה");
      return;
    }
    setMessage("התמונות נשמרו");
    router.refresh();
    router.push("/");
  }

  async function uploadText(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/stories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: fd.get("title"),
        body: fd.get("body"),
        year: fd.get("year") || null,
        personIds: fd.getAll("personIds"),
      }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(json.error ?? "השמירה נכשלה");
      return;
    }
    setMessage("הטקסט נשמר");
    router.push(`/stories/${json.story.slug}`);
  }

  return (
    <div className="mt-14">
      <div className="flex flex-wrap gap-x-8 gap-y-3 border-b border-[var(--line)]">
        <Tab active={tab === "photo"} onClick={() => setTab("photo")}>
          תמונות מהמכשיר
        </Tab>
        <Tab active={tab === "google"} onClick={() => setTab("google")}>
          גוגל תמונות
        </Tab>
        <Tab active={tab === "text"} onClick={() => setTab("text")}>
          טקסט
        </Tab>
      </div>

      {tab === "photo" ? (
        <form onSubmit={uploadPhotos} className="mt-10 space-y-5">
          <label className="block text-sm">
            בחרו תמונות
            <input name="files" type="file" accept="image/*" multiple required className="mt-2" />
          </label>
          <label className="block text-sm">
            כמה מילים, אם יש
            <textarea name="narrative" rows={4} className="mt-1" />
          </label>
          <PeopleField people={people} />
          <button
            type="submit"
            disabled={busy}
            className="cursor-pointer bg-ink px-6 py-3 text-cream disabled:opacity-50"
          >
            {busy ? "מעלים..." : "שמירה"}
          </button>
        </form>
      ) : null}

      {tab === "google" ? (
        <div className="mt-10 space-y-5">
          <p className="text-ink-soft">
            מחברים את גוגל תמונות ובוחרים ידנית אילו תמונות ייכנסו לאתר. לא מייבאים את כל האלבום.
          </p>
          {!googleReady ? (
            <p className="text-sm text-wine">
              כדי לחבר גוגל תמונות צריך להוסיף בקובץ הסביבה GOOGLE_CLIENT_ID ו־GOOGLE_CLIENT_SECRET,
              עם Photos Picker API וכתובת חזרה
              {" "}
              http://127.0.0.1:3000/api/google/callback
            </p>
          ) : (
            <a
              href="/api/google/connect"
              className="inline-block cursor-pointer bg-ink px-6 py-3 text-cream"
            >
              {googleConnected ? "בחירת תמונות מגוגל" : "חיבור לגוגל תמונות"}
            </a>
          )}
          {polling ? (
            <div className="space-y-3 text-sm text-ink-soft">
              <p>ממתינים לבחירה בגוגל תמונות...</p>
              {pickerUri ? (
                <a href={pickerUri} target="_blank" rel="noreferrer" className="underline">
                  אם החלון לא נפתח, לחצו כאן
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === "text" ? (
        <form onSubmit={uploadText} className="mt-10 space-y-5">
          <label className="block text-sm">
            כותרת
            <input name="title" required className="mt-1" />
          </label>
          <label className="block text-sm">
            הטקסט
            <textarea name="body" rows={10} required className="mt-1" />
          </label>
          <PeopleField people={people} />
          <button
            type="submit"
            disabled={busy}
            className="cursor-pointer bg-ink px-6 py-3 text-cream disabled:opacity-50"
          >
            {busy ? "שומרים..." : "שמירה"}
          </button>
        </form>
      ) : null}

      {error ? <p className="mt-8 text-sm text-wine">{error}</p> : null}
      {message ? <p className="mt-8 text-sm">{message}</p> : null}
    </div>
  );
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer pb-3 text-sm ${active ? "border-b-2 border-ink text-ink" : "text-muted"}`}
    >
      {children}
    </button>
  );
}

function PeopleField({ people }: { people: PersonOpt[] }) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm">קשור לבני משפחה, אם רוצים</legend>
      <div className="max-h-40 overflow-y-auto border border-[var(--line)] p-3">
        {people.map((p) => (
          <label key={p.id} className="flex items-center gap-2 py-1 text-sm">
            <input type="checkbox" name="personIds" value={p.id} className="w-auto" />
            {[p.firstName, p.lastName].filter(Boolean).join(" ")}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
