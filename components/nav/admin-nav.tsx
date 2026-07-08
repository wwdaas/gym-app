import Link from "next/link";
import { logoutAction } from "@/actions/auth-actions";
import { Avatar } from "@/components/ui/avatar";

const links = [
  { href: "/admin", label: "首页" },
  { href: "/admin/course-types", label: "课程类型" },
  { href: "/admin/coaches", label: "教练管理" },
  { href: "/admin/schedules", label: "排课管理" },
  { href: "/admin/bookings", label: "预约总览" },
  { href: "/admin/checkins", label: "签到花名册" },
  { href: "/admin/members", label: "会员列表" },
];

export function AdminNav({
  userName,
  avatarUrl,
}: {
  userName: string;
  avatarUrl?: string | null;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <nav className="flex flex-wrap items-center gap-5">
          <span className="gradient-text text-sm font-extrabold tracking-wide">
            健身房 · 管理端
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
          <Avatar src={avatarUrl} name={userName} size="sm" />
          <span className="text-sm text-zinc-500">{userName}</span>
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
