"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { saveUploadedImage } from "@/lib/upload";
import type { ActionState } from "@/actions/booking-actions";

export async function updateAvatarAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "请先登录" };
  }

  const photo = formData.get("photo");
  const uploaded = await saveUploadedImage(
    photo instanceof File ? photo : null,
    "avatars",
  );
  if (!uploaded) {
    return { error: "请选择一张图片" };
  }
  if (uploaded.error) {
    return { error: uploaded.error };
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { avatarUrl: uploaded.url },
  });

  revalidatePath("/member/profile");
  revalidatePath("/member");
  revalidatePath("/admin/members");
  revalidatePath("/admin/checkins");
  return { success: true };
}
