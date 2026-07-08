import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";

const ACTIVE_BOOKING_STATUSES = ["BOOKED", "CHECKED_IN"] as const;

export async function countActiveBookings(
  tx: Prisma.TransactionClient | typeof db,
  scheduleId: string,
): Promise<number> {
  return tx.booking.count({
    where: {
      scheduleId,
      status: { in: [...ACTIVE_BOOKING_STATUSES] },
    },
  });
}

export async function getRemainingCapacity(scheduleId: string): Promise<{
  capacity: number;
  booked: number;
  remaining: number;
}> {
  const schedule = await db.schedule.findUniqueOrThrow({
    where: { id: scheduleId },
    select: { capacity: true },
  });
  const booked = await countActiveBookings(db, scheduleId);
  return {
    capacity: schedule.capacity,
    booked,
    remaining: Math.max(schedule.capacity - booked, 0),
  };
}
