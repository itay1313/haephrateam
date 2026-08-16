import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/");

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-night px-6">
      <div className="absolute inset-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/family/hills-memory.jpg"
          alt=""
          className="h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-night/70" />
      </div>
      <div className="relative z-10 w-full max-w-sm text-center text-cream">
        <p className="text-sm text-cream/60">ארכיון משפחתי</p>
        <h1 className="mt-4 text-5xl font-medium leading-none">משפחת האפרתי</h1>
        <p className="mt-5 text-cream/70">הסיפור המשפחתי שלנו</p>
        <div className="mt-12">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
