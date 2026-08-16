export function displayName(person: { firstName: string; lastName?: string | null }) {
  return [person.firstName, person.lastName].filter(Boolean).join(" ");
}

export function yearOf(date?: Date | string | null) {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return null;
  return d.getFullYear();
}

export function lifeLabel(person: { birthDate?: Date | string | null; deathDate?: Date | string | null }) {
  const from = yearOf(person.birthDate);
  if (!from && !person.deathDate) return null;
  const to = person.deathDate ? yearOf(person.deathDate) : "היום";
  return from ? `${from} – ${to}` : null;
}

export function decadeLabel(year: number) {
  const d = Math.floor(year / 10) * 10;
  const map: Record<number, string> = {
    1940: "שנות הארבעים",
    1950: "שנות החמישים",
    1960: "שנות השישים",
    1970: "שנות השבעים",
    1980: "שנות השמונים",
    1990: "שנות התשעים",
    2000: "שנות האלפיים",
    2010: "שנות העשרה",
    2020: "השנים האלה",
  };
  return map[d] ?? `שנות ה-${String(d).slice(2)}`;
}
