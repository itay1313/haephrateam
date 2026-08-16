import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-6 py-32 text-center">
      <p className="kicker">לא נמצא</p>
      <h1 className="font-display mt-3 text-5xl">הדף הזה עדיין לא בארכיון</h1>
      <Link href="/" className="mt-8 inline-block border-b border-ink pb-1">
        חזרה הביתה
      </Link>
    </div>
  );
}
