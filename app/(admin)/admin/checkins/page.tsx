import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { ActionButton } from "@/components/booking/action-button";
import { checkInByAdminAction } from "@/actions/checkin-actions";
import { formatTimeRange } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, { label: string; tone: "info" | "success" | "neutral" }> = {
  BOOKED: { label: "已预约", tone: "info" },
  CHECKED_IN: { label: "已签到", tone: "success" },
  CANCELLED: { label: "已取消", tone: "neutral" },
};

export default async function CheckinsPage() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const schedules = await db.schedule.findMany({
    where: {
      startTime: { gte: startOfToday, lt: endOfToday },
    },
    include: {
      courseType: true,
      coach: true,
      bookings: {
        where: { status: { in: ["BOOKED", "CHECKED_IN"] } },
        include: { member: true },
        orderBy: { bookedAt: "asc" },
      },
    },
    orderBy: { startTime: "asc" },
  });

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-zinc-50">
        今日签到花名册
      </h1>
      {schedules.length === 0 ? (
        <EmptyState title="今天没有排课" />
      ) : (
        <div className="space-y-4">
          {schedules.map((schedule) => (
            <Card key={schedule.id}>
              <div className="flex items-center justify-between">
                <p className="font-medium text-zinc-50">
                  {schedule.courseType.name} ·{" "}
                  {formatTimeRange(schedule.startTime, schedule.endTime)}
                </p>
                <span className="flex items-center gap-2 text-sm text-zinc-500">
                  <Avatar
                    src={schedule.coach.photoUrl}
                    name={schedule.coach.name}
                    size="sm"
                  />
                  {schedule.coach.name} · {schedule.room}
                </span>
              </div>
              {schedule.bookings.length === 0 ? (
                <p className="mt-2 text-sm text-zinc-600">暂无预约</p>
              ) : (
                <ul className="mt-3 divide-y divide-zinc-800">
                  {schedule.bookings.map((booking) => {
                    const status = STATUS_LABEL[booking.status];
                    const boundCheckIn = checkInByAdminAction.bind(
                      null,
                      booking.id,
                    );
                    return (
                      <li
                        key={booking.id}
                        className="flex items-center justify-between py-2"
                      >
                        <span className="flex items-center gap-2 text-sm text-zinc-50">
                          <Avatar
                            src={booking.member.avatarUrl}
                            name={booking.member.name}
                            size="sm"
                          />
                          {booking.member.name}
                        </span>
                        <div className="flex items-center gap-3">
                          <Badge tone={status.tone}>{status.label}</Badge>
                          {booking.status === "BOOKED" && (
                            <ActionButton
                              action={boundCheckIn}
                              label="手动签到"
                              pendingLabel="签到中..."
                              variant="secondary"
                            />
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
