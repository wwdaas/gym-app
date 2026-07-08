"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isWithinCheckInWindow } from "@/lib/checkin";
import type { ActionState } from "@/actions/booking-actions";

export async function checkInSelfAction(
  bookingId: string,
  _prevState: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "请先登录" };
  }

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { schedule: true },
  });
  if (!booking || booking.memberId !== session.user.id) {
    return { error: "预约不存在" };
  }
  if (booking.status !== "BOOKED") {
    return { error: "该预约当前无法签到" };
  }
  if (!isWithinCheckInWindow(booking.schedule)) {
    return { error: "不在签到时间范围内" };
  }

  await db.$transaction([
    db.checkIn.create({
      data: {
        bookingId,
        method: "SELF",
        recordedById: session.user.id,
      },
    }),
    db.booking.update({
      where: { id: bookingId },
      data: { status: "CHECKED_IN" },
    }),
  ]);

  revalidatePath("/member/bookings");
  revalidatePath(`/member/bookings/${bookingId}`);
  revalidatePath("/admin/checkins");
  revalidatePath("/admin/bookings");
  return { success: true };
}

export async function checkInByAdminAction(
  bookingId: string,
  _prevState: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "无权限执行此操作" };
  }

  const booking = await db.booking.findUnique({ where: { id: bookingId } });
  if (!booking) {
    return { error: "预约不存在" };
  }
  if (booking.status !== "BOOKED") {
    return { error: "该预约当前无法签到" };
  }

  await db.$transaction([
    db.checkIn.create({
      data: {
        bookingId,
        method: "ADMIN_OVERRIDE",
        recordedById: session.user.id,
      },
    }),
    db.booking.update({
      where: { id: bookingId },
      data: { status: "CHECKED_IN" },
    }),
  ]);

  revalidatePath("/admin/checkins");
  revalidatePath("/admin/bookings");
  revalidatePath("/member/bookings");
  return { success: true };
}
