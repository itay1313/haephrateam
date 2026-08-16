import { prisma } from "@/lib/prisma";
import { ContributeForm } from "@/components/forms/ContributeForm";
import { googleConfigured } from "@/lib/google";
import { getSessionRecord } from "@/lib/auth";
import { Suspense } from "react";

export default async function ContributePage() {
  const people = await prisma.person.findMany({
    where: { isPlaceholder: false },
    select: { id: true, firstName: true, lastName: true },
    orderBy: { firstName: "asc" },
  });
  const session = await getSessionRecord();

  return (
    <div className="mx-auto max-w-xl px-6 py-24">
      <h1 className="text-4xl font-medium md:text-5xl">הוספה לארכיון</h1>
      <p className="mt-4 text-lg text-ink-soft">
        כל אחד במשפחה יכול להעלות תמונות מהמכשיר, לבחור תמונות מגוגל תמונות, או לכתוב כמה מילים.
        מה שנשמר כאן נראה לכולם, אחרי כניסה עם הסיסמה.
      </p>
      <Suspense>
        <ContributeForm
          people={people}
          googleReady={googleConfigured()}
          googleConnected={Boolean(session?.googleAccessToken)}
        />
      </Suspense>
    </div>
  );
}
