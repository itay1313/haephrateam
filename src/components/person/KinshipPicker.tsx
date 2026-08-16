"use client";

import { useRouter } from "next/navigation";

export function KinshipPicker({
  currentSlug,
  people,
}: {
  currentSlug: string;
  people: { slug: string; name: string }[];
}) {
  const router = useRouter();
  return (
    <select
      className="mt-6 max-w-sm"
      defaultValue=""
      onChange={(e) => {
        if (e.target.value) router.push(`/people/${currentSlug}?related=${e.target.value}`);
      }}
    >
      <option value="">בחרו בן משפחה כדי לראות את הקשר</option>
      {people.map((p) => (
        <option key={p.slug} value={p.slug}>
          {p.name}
        </option>
      ))}
    </select>
  );
}
