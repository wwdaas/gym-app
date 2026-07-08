import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ActionButton } from "@/components/booking/action-button";
import { bookScheduleAction } from "@/actions/booking-actions";
import { countActiveBookings } from "@/lib/capacity";
import { formatDateTime, formatTimeRange } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ScheduleDetailPage({
  params,
}: {
  params: Promise<{ scheduleId: string }>;
}) {
  const { scheduleId } = await params;
  const session = await auth();

  const schedule = await db.schedule.findUnique({
    where: { id: scheduleId },
    include: { courseType: true, coach: true },
  });
  if (!schedule) {
    notFound();
  }

  const bookedCount = await countActiveBookings(db, scheduleId);
  const remaining = Math.max(schedule.capacity - bookedCount, 0);
  const isFull = remaining === 0;

  const existingBooking = session?.user
    ? await db.booking.findFirst({
        where: {
          scheduleId,
          memberId: session.user.id,
          status: { in: ["BOOKED", "CHECKED_IN"] },
        },
      })
    : null;

  const boundBookAction = bookScheduleAction.bind(null, scheduleId);

  return (
    <div className="max-w-lg">
      <Link href="/member/schedule" className="text-sm text-fuchsia-400">
        ← 返回课程表
      </Link>
      <Card className="mt-3">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-zinc-50">
              {schedule.courseType.name}
            </h1>
            {schedule.courseType.description && (
              <p className="mt-1 text-sm text-zinc-500">
                {schedule.courseType.description}
              </p>
            )}
          </div>
          {schedule.isCancelled ? (
            <Badge tone="danger">已取消</Badge>
          ) : (
            <Badge tone={isFull ? "danger" : "success"}>
              {isFull ? "已满" : `剩余 ${remaining} 位`}
            </Badge>
          )}
        </div>

        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-zinc-500">时间</dt>
            <dd className="text-zinc-50">
              {formatDateTime(schedule.startTime)} ·{" "}
              {formatTimeRange(schedule.startTime, schedule.endTime)}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-zinc-500">教练</dt>
            <dd className="flex items-center gap-2 text-zinc-50">
              <Avatar
                src={schedule.coach.photoUrl}
                name={schedule.coach.name}
                size="sm"
              />
              {schedule.coach.name}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-500">场地</dt>
            <dd className="text-zinc-50">{schedule.room}</dd>
          </div>
        </dl>

        <div className="mt-5">
          {schedule.isCancelled ? (
            <p className="text-sm text-zinc-500">该课程已取消，无法预约</p>
          ) : existingBooking ? (
            <div className="flex items-center gap-2">
              <Badge tone="info">
                {existingBooking.status === "CHECKED_IN"
                  ? "已签到"
                  : "已预约"}
              </Badge>
              <Link
                href={`/member/bookings/${existingBooking.id}`}
                className="text-sm text-fuchsia-400"
              >
                查看我的预约 →
              </Link>
            </div>
          ) : (
            <ActionButton
              action={boundBookAction}
              label="预约"
              pendingLabel="预约中..."
              disabled={isFull}
            />
          )}
        </div>
      </Card>
    </div>
  );
}
