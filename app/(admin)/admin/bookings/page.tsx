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

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const validStatus =
    status === "BOOKED" || status === "CHECKED_IN" || status === "CANCELLED"
      ? status
      : undefined;

  const bookings = await db.booking.findMany({
    where: validStatus ? { status: validStatus } : undefined,
    include: {
      member: true,
      schedule: { include: { courseType: true } },
    },
    orderBy: { schedule: { startTime: "desc" } },
    take: 100,
  });

  const filters: { label: string; value?: string }[] = [
    { label: "全部", value: undefined },
    { label: "已预约", value: "BOOKED" },
    { label: "已签到", value: "CHECKED_IN" },
    { label: "已取消", value: "CANCELLED" },
  ];

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-zinc-50">预约总览</h1>
      <div className="mb-4 flex gap-2">
        {filters.map((f) => (
          <a
            key={f.label}
            href={f.value ? `/admin/bookings?status=${f.value}` : "/admin/bookings"}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              validStatus === f.value
                ? "bg-gradient-to-r from-violet-600 via-fuchsia-600 to-orange-500 text-white shadow-md shadow-fuchsia-900/30"
                : "bg-zinc-900 text-zinc-400 border border-zinc-700 hover:border-fuchsia-500/40"
            }`}
          >
            {f.label}
          </a>
        ))}
      </div>

      {bookings.length === 0 ? (
        <EmptyState title="没有符合条件的预约" />
      ) : (
        <div className="space-y-2">
          {bookings.map((booking) => {
            const status = STATUS_LABEL[booking.status];
            return (
              <Card key={booking.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-zinc-50">
                    {booking.schedule.courseType.name} · {booking.member.name}
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
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
