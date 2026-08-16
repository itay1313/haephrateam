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
      {session?.visitorName ? (
        <p className="mt-6 border-r-2 border-bronze pr-4 text-sm text-ink-soft">
          מה שתוסיפו ירשם על שם <strong className="font-medium">{session.visitorName}</strong>.
          כדי לשנות, צאו וכנסו מחדש.
        </p>
      ) : null}
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
