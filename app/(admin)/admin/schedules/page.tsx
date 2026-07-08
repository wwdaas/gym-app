import Link from "next/link";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { ActionButton } from "@/components/booking/action-button";
import {
  deleteScheduleAction,
  toggleScheduleCancelledAction,
} from "@/actions/admin/schedule-actions";
import { countActiveBookings } from "@/lib/capacity";
import { formatDateTime, formatTimeRange } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SchedulesPage() {
  const schedules = await db.schedule.findMany({
    include: { courseType: true, coach: true },
    orderBy: { startTime: "desc" },
    take: 100,
  });

  const bookedCounts = await Promise.all(
    schedules.map((s) => countActiveBookings(db, s.id)),
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-50">排课管理</h1>
        <Link href="/admin/schedules/new">
          <Button>新建排课</Button>
        </Link>
      </div>

      {schedules.length === 0 ? (
        <EmptyState title="还没有排课" description="点击右上角新建一个" />
      ) : (
        <div className="space-y-3">
          {schedules.map((schedule, i) => {
            const boundToggle = toggleScheduleCancelledAction.bind(
              null,
              schedule.id,
            );
            const boundDelete = deleteScheduleAction.bind(null, schedule.id);
            const remaining = Math.max(
              schedule.capacity - bookedCounts[i],
              0,
            );
            return (
              <Card key={schedule.id} className="flex items-start gap-3">
                <Avatar
                  src={schedule.coach.photoUrl}
                  name={schedule.coach.name}
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-zinc-50">
                        {schedule.courseType.name}
                      </p>
                      <p className="mt-0.5 text-sm text-zinc-500">
                        {formatDateTime(schedule.startTime)} ·{" "}
                        {formatTimeRange(schedule.startTime, schedule.endTime)}
                      </p>
                      <p className="mt-0.5 text-sm text-zinc-500">
                        教练：{schedule.coach.name} · {schedule.room} · 容量{" "}
                        {schedule.capacity}（剩余 {remaining}）
                      </p>
                    </div>
                    {schedule.isCancelled && (
                      <Badge tone="danger">已取消</Badge>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <Link
                      href={`/admin/schedules/${schedule.id}/edit`}
                      className="text-sm text-fuchsia-400"
                    >
                      编辑
                    </Link>
                    <ActionButton
                      action={boundToggle}
                      label={schedule.isCancelled ? "恢复排课" : "取消排课"}
                      pendingLabel="处理中..."
                      variant="ghost"
                    />
                    <ActionButton
                      action={boundDelete}
                      label="删除"
                      pendingLabel="删除中..."
                      variant="ghost"
                      confirmMessage="确定要删除这个排课吗？（已有预约的排课无法删除）"
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
