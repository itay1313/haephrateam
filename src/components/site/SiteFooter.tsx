import Link from "next/link";

const COLUMNS = [
  {
    title: "המשפחה",
    links: [
      { href: "/tree", label: "עץ המשפחה" },
      { href: "/generations", label: "דורות" },
      { href: "/search", label: "חיפוש אנשים" },
    ],
  },
  {
    title: "הארכיון",
    links: [
      { href: "/archive", label: "תמונות ומסמכים" },
      { href: "/stories", label: "סיפורים" },
      { href: "/timeline", label: "ציר הזמן" },
    ],
  },
  {
    title: "להשתתף",
    links: [
      { href: "/contribute", label: "להוסיף תמונה או סיפור" },
      { href: "/contribute#help", label: "מה חסר לנו" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--line)] bg-paper-deep/40">
      <div className="mx-auto max-w-[1400px] px-5 py-14 md:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <div className="text-2xl font-medium">משפחת האפרתי</div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-soft">
              הבית הדיגיטלי של המשפחה. נשמר כאן מי היינו, איך היינו קשורים, ומה סיפרנו זה לזה.
              כל אחד יכול להוסיף תמונה, מכתב או זיכרון.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="text-xs tracking-[0.2em] text-bronze">{col.title}</div>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-ink-soft hover:text-ink">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-col gap-2 border-t border-[var(--line)] pt-6 text-xs text-muted md:flex-row md:items-center md:justify-between">
          <span>אתר פנימי למשפחה בלבד</span>
          <span className="tracking-[0.2em]">מדור לדור</span>
        </div>
      </div>
    </footer>
  );
}
