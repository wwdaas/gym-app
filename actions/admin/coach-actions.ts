"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { coachSchema } from "@/lib/validation";
import { saveUploadedImage } from "@/lib/upload";
import type { ActionState } from "@/actions/booking-actions";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("UNAUTHORIZED");
  }
}

export async function createCoachAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = coachSchema.safeParse({
    name: formData.get("name"),
    bio: formData.get("bio"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "输入有误" };
  }

  const photo = formData.get("photo");
  const uploaded = await saveUploadedImage(
    photo instanceof File ? photo : null,
    "coaches",
  );
  if (uploaded?.error) {
    return { error: uploaded.error };
  }

  await db.coach.create({
    data: {
      name: parsed.data.name,
      bio: parsed.data.bio || null,
      photoUrl: uploaded?.url,
    },
  });

  revalidatePath("/admin/coaches");
  redirect("/admin/coaches");
}

export async function updateCoachAction(
  id: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = coachSchema.safeParse({
    name: formData.get("name"),
    bio: formData.get("bio"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "输入有误" };
  }

  const photo = formData.get("photo");
  const uploaded = await saveUploadedImage(
    photo instanceof File ? photo : null,
    "coaches",
  );
  if (uploaded?.error) {
    return { error: uploaded.error };
  }

  await db.coach.update({
    where: { id },
    data: {
      name: parsed.data.name,
      bio: parsed.data.bio || null,
      ...(uploaded?.url ? { photoUrl: uploaded.url } : {}),
    },
  });

  revalidatePath("/admin/coaches");
  revalidatePath("/admin/schedules");
  revalidatePath("/member/schedule");
  redirect("/admin/coaches");
}

export async function deleteCoachAction(
  id: string,
  _prevState: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const scheduleCount = await db.schedule.count({ where: { coachId: id } });
  if (scheduleCount > 0) {
    return { error: "该教练下还有排课，无法删除" };
  }

  await db.coach.delete({ where: { id } });
  revalidatePath("/admin/coaches");
  return { success: true };
}
