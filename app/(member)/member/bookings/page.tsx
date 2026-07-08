import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime, formatTimeRange } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, { label: string; tone: "info" | "success" | "neutral" }> = {
  BOOKED: { label: "已预约", tone: "info" },
  CHECKED_IN: { label: "已签到", tone: "success" },
  CANCELLED: { label: "已取消", tone: "neutral" },
};

export default async function MyBookingsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const bookings = await db.booking.findMany({
    where: { memberId: session.user.id },
    include: { schedule: { include: { courseType: true } } },
    orderBy: { schedule: { startTime: "desc" } },
    take: 50,
  });

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-zinc-50">我的预约</h1>
      {bookings.length === 0 ? (
        <EmptyState title="还没有预约" description="去课程表看看有哪些课程吧" />
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const status = STATUS_LABEL[booking.status];
            return (
              <Link key={booking.id} href={`/member/bookings/${booking.id}`}>
                <Card className="transition-colors hover:border-fuchsia-500/40">
                  <div className="flex items-center justify-between">
                    <div>
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
                    </div>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
