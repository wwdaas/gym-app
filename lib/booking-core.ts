import { db } from "@/lib/db";
import { countActiveBookings } from "@/lib/capacity";

export type BookingResult =
  | { ok: true; bookingId: string }
  | { ok: false; error: string };

const ACTIVE_STATUSES = ["BOOKED", "CHECKED_IN"] as const;

export async function bookScheduleForMember(
  scheduleId: string,
  memberId: string,
): Promise<BookingResult> {
  const schedule = await db.schedule.findUnique({ where: { id: scheduleId } });
  if (!schedule || schedule.isCancelled) {
    return { ok: false, error: "课程不存在或已取消" };
  }

  try {
    const booking = await db.$transaction(async (tx) => {
      const existing = await tx.booking.findFirst({
        where: {
          scheduleId,
          memberId,
          status: { in: [...ACTIVE_STATUSES] },
        },
      });
      if (existing) {
        throw new Error("DUPLICATE");
      }

      const activeCount = await countActiveBookings(tx, scheduleId);
      if (activeCount >= schedule.capacity) {
        throw new Error("FULL");
      }

      return tx.booking.create({
        data: { scheduleId, memberId, status: "BOOKED" },
      });
    });
    return { ok: true, bookingId: booking.id };
  } catch (err) {
    if (err instanceof Error && err.message === "DUPLICATE") {
      return { ok: false, error: "您已预约过该课程" };
    }
    if (err instanceof Error && err.message === "FULL") {
      return { ok: false, error: "该课程已满员" };
    }
    throw err;
  }
}

export async function cancelBookingForMember(
  bookingId: string,
  memberId: string,
): Promise<BookingResult> {
  const booking = await db.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.memberId !== memberId) {
    return { ok: false, error: "预约不存在" };
  }
  if (booking.status !== "BOOKED") {
    return { ok: false, error: "该预约无法取消" };
  }

  await db.booking.update({
    where: { id: bookingId },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });

  return { ok: true, bookingId };
}
