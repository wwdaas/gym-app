"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { bookScheduleForMember, cancelBookingForMember } from "@/lib/booking-core";

export type ActionState = { error?: string; success?: boolean } | null;

export async function bookScheduleAction(
  scheduleId: string,
  _prevState: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "请先登录" };
  }

  const result = await bookScheduleForMember(scheduleId, session.user.id);
  if (!result.ok) {
    return { error: result.error };
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

  const result = await cancelBookingForMember(bookingId, session.user.id);
  if (!result.ok) {
    return { error: result.error };
  }

  revalidatePath("/member/schedule");
  revalidatePath("/member/bookings");
  revalidatePath(`/member/bookings/${bookingId}`);
  return { success: true };
}
