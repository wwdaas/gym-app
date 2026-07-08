import Link from "next/link";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const [todaySchedules, todayBookings, todayCheckIns, memberCount] =
    await Promise.all([
      db.schedule.count({
        where: { startTime: { gte: startOfToday, lt: endOfToday } },
      }),
      db.booking.count({
        where: {
          schedule: { startTime: { gte: startOfToday, lt: endOfToday } },
          status: { in: ["BOOKED", "CHECKED_IN"] },
        },
      }),
      db.checkIn.count({
        where: { checkedInAt: { gte: startOfToday, lt: endOfToday } },
      }),
      db.user.count({ where: { role: "MEMBER" } }),
    ]);

  const stats = [
    { label: "今日课程", value: todaySchedules },
    { label: "今日预约", value: todayBookings },
    { label: "今日签到", value: todayCheckIns },
    { label: "会员总数", value: memberCount },
  ];

  return (
    <div>
      <h1 className="gradient-text mb-4 text-2xl font-extrabold tracking-tight">
        管理端首页
      </h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <Card
            key={s.label}
            className="hover:border-fuchsia-500/40"
          >
            <p className="text-sm text-zinc-500">{s.label}</p>
            <p className="gradient-text mt-1 text-3xl font-extrabold">
              {s.value}
            </p>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/admin/schedules/new"
          className="text-sm font-medium text-fuchsia-400"
        >
          + 新建排课
        </Link>
        <Link
          href="/admin/checkins"
          className="text-sm font-medium text-fuchsia-400"
        >
          查看今日签到花名册
        </Link>
      </div>
    </div>
  );
}
