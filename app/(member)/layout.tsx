import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { MemberNav } from "@/components/nav/member-nav";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { avatarUrl: true },
  });

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <MemberNav
        userName={session.user.name ?? session.user.email ?? "会员"}
        avatarUrl={user?.avatarUrl}
      />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
