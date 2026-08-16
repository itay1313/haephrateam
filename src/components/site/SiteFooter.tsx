export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-[var(--line)]">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-2 px-5 py-10 md:flex-row md:items-end md:justify-between md:px-8">
        <div>
          <div className="text-2xl font-medium">משפחת האפרתי</div>
          <p className="mt-2 max-w-md text-sm text-ink-soft">
            הבית הדיגיטלי של המשפחה. נשמר כאן מי היינו, איך היינו קשורים, ומה סיפרנו זה לזה.
          </p>
        </div>
        <p className="text-xs tracking-[0.2em] text-muted">מדור לדור</p>
      </div>
    </footer>
  );
}
