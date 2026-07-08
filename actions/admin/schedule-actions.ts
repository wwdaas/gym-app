"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { scheduleSchema } from "@/lib/validation";
import type { ActionState } from "@/actions/booking-actions";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("UNAUTHORIZED");
  }
}

function parseSchedule(formData: FormData) {
  return scheduleSchema.safeParse({
    courseTypeId: formData.get("courseTypeId"),
    coachId: formData.get("coachId"),
    room: formData.get("room"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    capacity: formData.get("capacity"),
  });
}

export async function createScheduleAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = parseSchedule(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "输入有误" };
  }

  await db.schedule.create({
    data: {
      courseTypeId: parsed.data.courseTypeId,
      coachId: parsed.data.coachId,
      room: parsed.data.room,
      startTime: new Date(parsed.data.startTime),
      endTime: new Date(parsed.data.endTime),
      capacity: parsed.data.capacity,
    },
  });

  revalidatePath("/admin/schedules");
  revalidatePath("/member/schedule");
  redirect("/admin/schedules");
}

export async function updateScheduleAction(
  id: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = parseSchedule(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "输入有误" };
  }

  await db.schedule.update({
    where: { id },
    data: {
      courseTypeId: parsed.data.courseTypeId,
      coachId: parsed.data.coachId,
      room: parsed.data.room,
      startTime: new Date(parsed.data.startTime),
      endTime: new Date(parsed.data.endTime),
      capacity: parsed.data.capacity,
    },
  });

  revalidatePath("/admin/schedules");
  revalidatePath("/member/schedule");
  revalidatePath(`/member/schedule/${id}`);
  redirect("/admin/schedules");
}

export async function toggleScheduleCancelledAction(
  id: string,
  _prevState: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const schedule = await db.schedule.findUnique({ where: { id } });
  if (!schedule) {
    return { error: "排课不存在" };
  }

  await db.schedule.update({
    where: { id },
    data: { isCancelled: !schedule.isCancelled },
  });

  revalidatePath("/admin/schedules");
  revalidatePath("/member/schedule");
  revalidatePath(`/member/schedule/${id}`);
  return { success: true };
}

export async function deleteScheduleAction(
  id: string,
  _prevState: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const bookingCount = await db.booking.count({ where: { scheduleId: id } });
  if (bookingCount > 0) {
    return { error: "该排课已有预约记录，无法删除，可改为「取消排课」" };
  }

  await db.schedule.delete({ where: { id } });
  revalidatePath("/admin/schedules");
  revalidatePath("/member/schedule");
  return { success: true };
}
