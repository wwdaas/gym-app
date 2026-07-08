import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime, formatTimeRange } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MemberHomePage() {
  const session = await auth();
  if (!session?.user) return null;

  const upcomingBookings = await db.booking.findMany({
    where: {
      memberId: session.user.id,
      status: { in: ["BOOKED", "CHECKED_IN"] },
      schedule: { startTime: { gte: new Date() } },
    },
    include: { schedule: { include: { courseType: true } } },
    orderBy: { schedule: { startTime: "asc" } },
    take: 5,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="gradient-text text-2xl font-extrabold tracking-tight">
          你好，{session.user.name ?? session.user.email}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          <Link href="/member/schedule" className="text-fuchsia-400">
            浏览课程表
          </Link>{" "}
          并预约你感兴趣的课程
        </p>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-zinc-300">
          即将开始的预约
        </h2>
        {upcomingBookings.length === 0 ? (
          <EmptyState title="暂无即将开始的预约" />
        ) : (
          <div className="space-y-3">
            {upcomingBookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/member/bookings/${booking.id}`}
              >
                <Card className="transition-colors hover:border-fuchsia-500/40">
                  <p className="font-medium text-zinc-50">
                    {booking.schedule.courseType.name}
                  </p>
                  <p className="mt-0.5 text-sm text-zinc-500">
                    {formatDateTime(booking.schedule.startTime)} ·{" "}
                    {formatTimeRange(
                      booking.schedule.startTime,
                      booking.schedule.endTime,
                    )}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
