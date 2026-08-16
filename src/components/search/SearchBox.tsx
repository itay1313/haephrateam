"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SearchBox({ initial }: { initial: string }) {
  const [q, setQ] = useState(initial);
  const router = useRouter();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`/search?q=${encodeURIComponent(q)}`);
      }}
    >
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="עפר, משפחת ברג, שנות השישים..."
        className="text-xl"
      />
    </form>
  );
}
