"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const NAME_KEY = "haephrati:name";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const nameRef = useRef<HTMLInputElement>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Remember the name between visits without re-rendering on mount.
  useEffect(() => {
    const saved = window.localStorage.getItem(NAME_KEY);
    if (saved && nameRef.current && !nameRef.current.value) nameRef.current.value = saved;
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = nameRef.current?.value.trim() ?? "";
    setBusy(true);
    setError(null);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, name }),
    }).catch(() => null);

    if (!res || !res.ok) {
      const json = res ? await res.json().catch(() => null) : null;
      setError(json?.error ?? "לא הצלחנו להתחבר כרגע. נסו שוב.");
      setBusy(false);
      return;
    }

    window.localStorage.setItem(NAME_KEY, name);
    router.push(params.get("next") || "/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-7 text-right">
      <label className="block">
        <span className="text-sm text-cream/70">מי אתם?</span>
        <input
          ref={nameRef}
          name="visitorName"
          required
          minLength={2}
          autoComplete="name"
          placeholder="השם שלכם"
          className="mt-2 border-0 border-b border-white/30 bg-transparent px-0 py-2 text-xl text-cream placeholder:text-white/30"
        />
        <span className="mt-2 block text-xs text-cream/45">
          כדי שנדע מי הוסיף כל תמונה וכל סיפור
        </span>
      </label>

      <label className="block">
        <span className="text-sm text-cream/70">סיסמת המשפחה</span>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          required
          placeholder="••"
          className="mt-2 border-0 border-b border-white/30 bg-transparent px-0 py-2 text-xl tracking-[0.4em] text-cream placeholder:tracking-normal placeholder:text-white/30"
        />
      </label>

      {error ? <p className="text-sm text-[#e8c4b4]">{error}</p> : null}

      <button
        type="submit"
        disabled={busy}
        className="w-full cursor-pointer border border-cream/40 py-3 text-cream transition-colors hover:bg-cream hover:text-night disabled:opacity-50"
      >
        {busy ? "נכנסים..." : "כניסה"}
      </button>
    </form>
  );
}
