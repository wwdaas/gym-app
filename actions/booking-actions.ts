"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { countActiveBookings } from "@/lib/capacity";

export type ActionState = { error?: string; success?: boolean } | null;

const ACTIVE_STATUSES = ["BOOKED", "CHECKED_IN"] as const;

export async function bookScheduleAction(
  scheduleId: string,
  _prevState: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "请先登录" };
  }
  const memberId = session.user.id;

  const schedule = await db.schedule.findUnique({ where: { id: scheduleId } });
  if (!schedule || schedule.isCancelled) {
    return { error: "课程不存在或已取消" };
  }

  try {
    await db.$transaction(async (tx) => {
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

      await tx.booking.create({
        data: { scheduleId, memberId, status: "BOOKED" },
      });
    });
  } catch (err) {
    if (err instanceof Error && err.message === "DUPLICATE") {
      return { error: "您已预约过该课程" };
    }
    if (err instanceof Error && err.message === "FULL") {
      return { error: "该课程已满员" };
    }
    throw err;
  }

  revalidatePath("/member/schedule");
  revalidatePath(`/member/schedule/${scheduleId}`);
  revalidatePath("/member/bookings");
  return { success: true };
}

export async function cancelBookingAction(
  bookingId: string,
  _prevState: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "请先登录" };
  }

  const booking = await db.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.memberId !== session.user.id) {
    return { error: "预约不存在" };
  }
  if (booking.status !== "BOOKED") {
    return { error: "该预约无法取消" };
  }

  await db.booking.update({
    where: { id: bookingId },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });

  revalidatePath("/member/schedule");
  revalidatePath("/member/bookings");
  revalidatePath(`/member/bookings/${bookingId}`);
  return { success: true };
}
