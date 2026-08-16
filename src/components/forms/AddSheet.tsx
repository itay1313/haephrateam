"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@/lib/auth";
import { canEdit } from "@/lib/auth-client";

const KINDS = [
  { id: "person", label: "בן משפחה" },
  { id: "photo", label: "תמונה" },
  { id: "album", label: "אלבום" },
  { id: "story", label: "סיפור" },
  { id: "memory", label: "זיכרון" },
  { id: "document", label: "מסמך" },
  { id: "event", label: "אירוע" },
  { id: "audio", label: "הקלטת קול" },
] as const;

type Kind = (typeof KINDS)[number]["id"];

type PersonOpt = { id: string; firstName: string; lastName: string | null; slug: string };

export function AddSheet({
  people,
  albums,
  role,
}: {
  people: PersonOpt[];
  albums: { id: string; title: string }[];
  role: Role;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind>("person");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const on = () => setOpen(true);
    window.addEventListener("haephrati:add", on);
    return () => window.removeEventListener("haephrati:add", on);
  }, []);

  if (!open) return null;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canEdit(role)) {
      setError("אין הרשאת עריכה");
      return;
    }
    setBusy(true);
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    try {
      if (kind === "person") {
        const relationPerson = String(fd.get("relationPerson") || "");
        const relationType = String(fd.get("relationType") || "");
        const res = await fetch("/api/people", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: fd.get("firstName"),
            lastName: fd.get("lastName") || null,
            maidenName: fd.get("maidenName") || null,
            gender: fd.get("gender") || "UNKNOWN",
            birthDate: fd.get("birthDate") || null,
            deathDate: fd.get("deathDate") || null,
            biography: fd.get("biography") || null,
            relation:
              relationPerson && relationType
                ? { type: relationType, personId: relationPerson }
                : undefined,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setOpen(false);
        router.push(`/people/${json.person.slug}`);
        router.refresh();
      } else if (kind === "photo" || kind === "document" || kind === "audio") {
        const file = fd.get("file");
        if (!(file instanceof File) || !file.size) throw new Error("בחרו קובץ");
        const payload = new FormData();
        payload.set("file", file);
        payload.set("title", String(fd.get("title") || file.name));
        payload.set("caption", String(fd.get("caption") || ""));
        payload.set("narrative", String(fd.get("narrative") || ""));
        payload.set("year", String(fd.get("year") || ""));
        payload.set("personIds", String(fd.getAll("personIds").join(",")));
        payload.set("albumId", String(fd.get("albumId") || ""));
        payload.set("isHistorical", fd.get("isHistorical") === "on" ? "true" : "false");
        payload.set("type", kind === "photo" ? "PHOTO" : kind === "audio" ? "AUDIO" : "DOCUMENT");
        payload.set("asPortrait", fd.get("asPortrait") === "on" ? "true" : "false");
        const res = await fetch("/api/media", { method: "POST", body: payload });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setOpen(false);
        router.push(`/archive/${json.media.id}`);
        router.refresh();
      } else if (kind === "story") {
        const res = await fetch("/api/stories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: fd.get("title"),
            body: fd.get("body"),
            excerpt: fd.get("excerpt"),
            year: fd.get("year") || null,
            personIds: fd.getAll("personIds"),
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setOpen(false);
        router.push(`/stories/${json.story.slug}`);
        router.refresh();
      } else if (kind === "album") {
        const res = await fetch("/api/albums", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: fd.get("title"),
            description: fd.get("description"),
            category: fd.get("category"),
            year: fd.get("year") || null,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setOpen(false);
        router.push(`/archive?album=${json.album.slug}`);
        router.refresh();
      } else if (kind === "event" || kind === "memory") {
        const res = await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: fd.get("title"),
            description: fd.get("body") || fd.get("description"),
            year: fd.get("year") || null,
            type: kind === "memory" ? "HISTORIC" : fd.get("type"),
            personIds: fd.getAll("personIds"),
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        setOpen(false);
        router.push("/timeline");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 md:items-center md:p-8">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto bg-paper shadow-[var(--shadow)]">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-4">
          <div>
            <div className="kicker">הוספה לארכיון</div>
            <h2 className="font-display mt-1 text-3xl">מה תרצו להוסיף?</h2>
          </div>
          <button type="button" className="cursor-pointer text-sm" onClick={() => setOpen(false)}>
            סגירה
          </button>
        </div>
        <div className="flex flex-wrap gap-2 px-6 py-4">
          {KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => setKind(k.id)}
              className={`cursor-pointer px-3 py-1.5 text-sm ${
                kind === k.id ? "bg-ink text-cream" : "border border-[var(--line-strong)]"
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="space-y-4 px-6 pb-8">
          {kind === "person" ? (
            <>
              <Field name="firstName" label="שם" required />
              <Field name="lastName" label="שם משפחה" />
              <Field name="maidenName" label="שם קודם / שם נעורים" />
              <div className="grid gap-4 md:grid-cols-2">
                <Field name="birthDate" label="תאריך לידה" type="date" />
                <Field name="deathDate" label="תאריך פטירה" type="date" />
              </div>
              <label className="block text-sm">
                מגדר
                <select name="gender" className="mt-1">
                  <option value="UNKNOWN">לא צוין</option>
                  <option value="FEMALE">נקבה</option>
                  <option value="MALE">זכר</option>
                </select>
              </label>
              <label className="block text-sm">
                קשר משפחתי
                <select name="relationType" className="mt-1">
                  <option value="">ללא — אוסיף אחר כך</option>
                  <option value="PARENT">הורה של...</option>
                  <option value="CHILD">ילד/ה של...</option>
                  <option value="PARTNER">בן/בת זוג של...</option>
                </select>
              </label>
              <PeopleSelect people={people} name="relationPerson" multiple={false} />
              <label className="block text-sm">
                כמה מילים
                <textarea name="biography" rows={4} className="mt-1" />
              </label>
            </>
          ) : null}

          {kind === "photo" || kind === "document" || kind === "audio" ? (
            <>
              <label className="block text-sm">
                קובץ
                <input name="file" type="file" required className="mt-1" accept={kind === "photo" ? "image/*" : undefined} />
              </label>
              <Field name="title" label="כותרת" />
              <Field name="year" label="שנה" type="number" />
              <Field name="caption" label="כיתוב" />
              <label className="block text-sm">
                הסיפור מאחורי
                <textarea name="narrative" rows={4} className="mt-1" />
              </label>
              <PeopleSelect people={people} name="personIds" />
              {kind === "photo" ? (
                <>
                  <label className="block text-sm">
                    אלבום
                    <select name="albumId" className="mt-1">
                      <option value="">ללא</option>
                      {albums.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="isHistorical" className="w-auto" />
                    תמונה ישנה
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="asPortrait" className="w-auto" />
                    השתמשו כדיוקן של האדם הראשון שסומן
                  </label>
                </>
              ) : null}
            </>
          ) : null}

          {kind === "story" ? (
            <>
              <Field name="title" label="כותרת" required />
              <Field name="year" label="שנה" type="number" />
              <Field name="excerpt" label="תקציר" />
              <label className="block text-sm">
                הסיפור
                <textarea name="body" rows={10} required className="mt-1" />
              </label>
              <PeopleSelect people={people} name="personIds" />
            </>
          ) : null}

          {kind === "album" ? (
            <>
              <Field name="title" label="שם האלבום" required />
              <Field name="category" label="קטגוריה" />
              <Field name="year" label="שנה" type="number" />
              <label className="block text-sm">
                תיאור
                <textarea name="description" rows={3} className="mt-1" />
              </label>
            </>
          ) : null}

          {kind === "event" || kind === "memory" ? (
            <>
              <Field name="title" label="כותרת" required />
              <Field name="year" label="שנה" type="number" />
              {kind === "event" ? (
                <label className="block text-sm">
                  סוג
                  <select name="type" className="mt-1">
                    <option value="HISTORIC">היסטורי</option>
                    <option value="WEDDING">חתונה</option>
                    <option value="BIRTHDAY">יום הולדת</option>
                    <option value="HOLIDAY">חג</option>
                    <option value="MILITARY">צבא</option>
                    <option value="TRAVEL">טיול</option>
                  </select>
                </label>
              ) : null}
              <label className="block text-sm">
                תיאור
                <textarea name="body" rows={4} className="mt-1" />
              </label>
              <PeopleSelect people={people} name="personIds" />
            </>
          ) : null}

          {error ? <p className="text-sm text-wine">{error}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="cursor-pointer bg-ink px-6 py-3 text-cream disabled:opacity-50"
          >
            {busy ? "שומרים..." : "שמירה בארכיון"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      {label}
      <input name={name} type={type} required={required} className="mt-1" />
    </label>
  );
}

function PeopleSelect({
  people,
  name,
  multiple = true,
}: {
  people: PersonOpt[];
  name: string;
  multiple?: boolean;
}) {
  return (
    <label className="block text-sm">
      {multiple ? "קשור לבני משפחה" : "בן משפחה"}
      <select name={name} multiple={multiple} className="mt-1 min-h-24">
        {!multiple ? <option value="">בחירה</option> : null}
        {people.map((p) => (
          <option key={p.id} value={p.id}>
            {[p.firstName, p.lastName].filter(Boolean).join(" ")}
          </option>
        ))}
      </select>
    </label>
  );
}
