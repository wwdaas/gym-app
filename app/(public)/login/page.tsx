import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  if (session?.user) {
    redirect(session.user.role === "ADMIN" ? "/admin" : "/member");
  }

  const { callbackUrl } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="gradient-text mb-1 text-center text-3xl font-extrabold tracking-tight">
          健身房预约系统
        </h1>
        <p className="mb-6 text-center text-sm text-zinc-400">
          登录以预约课程或管理排课
        </p>
        <Card>
          <LoginForm callbackUrl={callbackUrl} />
        </Card>
        <p className="mt-4 text-center text-xs text-zinc-500">
          演示账号：admin@gym.local / member1@gym.local（密码 Passw0rd!）
        </p>
      </div>
    </div>
  );
}
