import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ActionButton } from "@/components/booking/action-button";
import { cancelBookingAction } from "@/actions/booking-actions";
import { checkInSelfAction } from "@/actions/checkin-actions";
import { isWithinCheckInWindow } from "@/lib/checkin";
import { formatDateTime, formatTimeRange } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, { label: string; tone: "info" | "success" | "neutral" }> = {
  BOOKED: { label: "已预约", tone: "info" },
  CHECKED_IN: { label: "已签到", tone: "success" },
  CANCELLED: { label: "已取消", tone: "neutral" },
};

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const session = await auth();
  if (!session?.user) return null;

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      schedule: { include: { courseType: true, coach: true } },
      checkIn: true,
    },
  });
  if (!booking || booking.memberId !== session.user.id) {
    notFound();
  }

  const status = STATUS_LABEL[booking.status];
  const canCheckIn =
    booking.status === "BOOKED" && isWithinCheckInWindow(booking.schedule);

  const boundCheckIn = checkInSelfAction.bind(null, bookingId);
  const boundCancel = cancelBookingAction.bind(null, bookingId);

  return (
    <div className="max-w-lg">
      <Link href="/member/bookings" className="text-sm text-fuchsia-400">
        ← 返回我的预约
      </Link>
      <Card className="mt-3">
        <div className="flex items-start justify-between">
          <h1 className="text-lg font-semibold text-zinc-50">
            {booking.schedule.courseType.name}
          </h1>
          <Badge tone={status.tone}>{status.label}</Badge>
        </div>

        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-zinc-500">时间</dt>
            <dd className="text-zinc-50">
              {formatDateTime(booking.schedule.startTime)} ·{" "}
              {formatTimeRange(
                booking.schedule.startTime,
                booking.schedule.endTime,
              )}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-zinc-500">教练</dt>
            <dd className="flex items-center gap-2 text-zinc-50">
              <Avatar
                src={booking.schedule.coach.photoUrl}
                name={booking.schedule.coach.name}
                size="sm"
              />
              {booking.schedule.coach.name}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-500">场地</dt>
            <dd className="text-zinc-50">{booking.schedule.room}</dd>
          </div>
          {booking.checkIn && (
            <div className="flex justify-between">
              <dt className="text-zinc-500">签到时间</dt>
              <dd className="text-zinc-50">
                {formatDateTime(booking.checkIn.checkedInAt)}
              </dd>
            </div>
          )}
        </dl>

        {booking.status === "BOOKED" && (
          <div className="mt-5 flex flex-wrap items-start gap-3">
            <ActionButton
              action={boundCheckIn}
              label="签到"
              pendingLabel="签到中..."
              disabled={!canCheckIn}
            />
            <ActionButton
              action={boundCancel}
              label="取消预约"
              pendingLabel="取消中..."
              variant="secondary"
              confirmMessage="确定要取消这个预约吗？"
            />
          </div>
        )}
        {booking.status === "BOOKED" && !canCheckIn && (
          <p className="mt-2 text-xs text-zinc-600">
            签到时间为课程开始前 15 分钟至课程结束
          </p>
        )}
      </Card>
    </div>
  );
}
