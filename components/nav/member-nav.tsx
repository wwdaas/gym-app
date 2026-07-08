import Link from "next/link";
import { logoutAction } from "@/actions/auth-actions";
import { Avatar } from "@/components/ui/avatar";

const links = [
  { href: "/member", label: "首页" },
  { href: "/member/schedule", label: "课程表" },
  { href: "/member/bookings", label: "我的预约" },
];

export function MemberNav({
  userName,
  avatarUrl,
}: {
  userName: string;
  avatarUrl?: string | null;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <nav className="flex items-center gap-5">
          <span className="gradient-text text-sm font-extrabold tracking-wide">
            健身房
          </span>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-zinc-400 transition-colors hover:text-fuchsia-400"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/member/profile" className="flex items-center gap-2">
            <Avatar src={avatarUrl} name={userName} size="sm" />
            <span className="text-sm text-zinc-500">{userName}</span>
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-sm text-zinc-500 transition-colors hover:text-rose-400"
            >
              退出登录
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
