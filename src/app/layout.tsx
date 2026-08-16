import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";
import { SiteNav } from "@/components/site/SiteNav";
import { AddSheet } from "@/components/forms/AddSheet";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "משפחת האפרתי",
    template: "%s · משפחת האפרתי",
  },
  description: "האתר של משפחת האפרתי",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getSessionUser();
  const people = user
    ? await prisma.person.findMany({
        where: { isPlaceholder: false },
        select: { id: true, firstName: true, lastName: true, slug: true },
        orderBy: { firstName: "asc" },
      })
    : [];
  const albums = user
    ? await prisma.album.findMany({ select: { id: true, title: true } })
    : [];

  return (
    <html lang="he" dir="rtl" className={`${rubik.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-paper text-ink">
        {user ? (
          <>
            <SiteNav />
            <main className="flex-1">{children}</main>
            <AddSheet people={people} albums={albums} role={user.role} />
          </>
        ) : (
          <main className="flex-1">{children}</main>
        )}
      </body>
    </html>
  );
}
