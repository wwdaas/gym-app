"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { courseTypeSchema } from "@/lib/validation";
import type { ActionState } from "@/actions/booking-actions";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("UNAUTHORIZED");
  }
}

export async function createCourseTypeAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = courseTypeSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    durationMinutes: formData.get("durationMinutes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "输入有误" };
  }

  await db.courseType.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      durationMinutes: parsed.data.durationMinutes,
    },
  });

  revalidatePath("/admin/course-types");
  redirect("/admin/course-types");
}

export async function updateCourseTypeAction(
  id: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = courseTypeSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    durationMinutes: formData.get("durationMinutes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "输入有误" };
  }

  await db.courseType.update({
    where: { id },
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      durationMinutes: parsed.data.durationMinutes,
      isActive: formData.get("isActive") === "on",
    },
  });

  revalidatePath("/admin/course-types");
  redirect("/admin/course-types");
}

export async function deleteCourseTypeAction(
  id: string,
  _prevState: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const scheduleCount = await db.schedule.count({
    where: { courseTypeId: id },
  });
  if (scheduleCount > 0) {
    return { error: "该课程类型下还有排课，无法删除" };
  }

  await db.courseType.delete({ where: { id } });
  revalidatePath("/admin/course-types");
  return { success: true };
}
