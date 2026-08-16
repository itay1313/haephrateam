"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    }).catch(() => null);

    if (!res || !res.ok) {
      const json = res ? await res.json().catch(() => null) : null;
      setError(json?.error ?? "לא הצלחנו להתחבר כרגע. נסו שוב.");
      setBusy(false);
      return;
    }

    router.push(params.get("next") || "/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <label className="block">
        <span className="sr-only">סיסמה</span>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          required
          placeholder="סיסמה"
          className="border-0 border-b border-white/30 bg-transparent px-0 py-3 text-center text-3xl tracking-[0.4em] text-cream placeholder:tracking-normal placeholder:text-white/35"
        />
      </label>
      {error ? <p className="text-center text-sm text-[#e8c4b4]">{error}</p> : null}
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
