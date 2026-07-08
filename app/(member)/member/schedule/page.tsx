import Link from "next/link";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { countActiveBookings } from "@/lib/capacity";
import { formatDateTime, formatTimeRange } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ScheduleListPage() {
  const schedules = await db.schedule.findMany({
    where: {
      isCancelled: false,
      startTime: { gte: new Date() },
    },
    include: { courseType: true, coach: true },
    orderBy: { startTime: "asc" },
    take: 50,
  });

  const bookedCounts = await Promise.all(
    schedules.map((s) => countActiveBookings(db, s.id)),
  );

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-zinc-50">课程表</h1>
      {schedules.length === 0 ? (
        <EmptyState
          title="近期暂无排课"
          description="请稍后再来查看，或联系前台了解排课安排"
        />
      ) : (
        <div className="space-y-3">
          {schedules.map((schedule, i) => {
            const remaining = Math.max(schedule.capacity - bookedCounts[i], 0);
            const isFull = remaining === 0;
            return (
              <Link key={schedule.id} href={`/member/schedule/${schedule.id}`}>
                <Card className="flex items-center gap-3 transition-colors hover:border-fuchsia-500/40">
                  <Avatar
                    src={schedule.coach.photoUrl}
                    name={schedule.coach.name}
                  />
                  <div className="flex flex-1 items-center justify-between">
                    <div>
                      <p className="font-medium text-zinc-50">
                        {schedule.courseType.name}
                      </p>
                      <p className="mt-0.5 text-sm text-zinc-500">
                        {formatDateTime(schedule.startTime)} ·{" "}
                        {formatTimeRange(schedule.startTime, schedule.endTime)}
                      </p>
                      <p className="mt-0.5 text-sm text-zinc-500">
                        教练：{schedule.coach.name} · {schedule.room}
                      </p>
                    </div>
                    <Badge tone={isFull ? "danger" : "success"}>
                      {isFull ? "已满" : `剩余 ${remaining} 位`}
                    </Badge>
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
