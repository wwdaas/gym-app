"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Label } from "@/components/ui/field";
import { updateAvatarAction } from "@/actions/profile-actions";

export function AvatarUploadForm({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl: string | null;
}) {
  const [state, formAction, pending] = useActionState(updateAvatarAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar src={avatarUrl} name={name} size="lg" />
        <div className="flex-1">
          <Label htmlFor="photo">上传新头像</Label>
          <input
            id="photo"
            type="file"
            name="photo"
            accept="image/png,image/jpeg,image/webp,image/gif"
            required
            className="mt-1 block w-full text-sm text-zinc-400 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-800 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-100 hover:file:bg-zinc-700"
          />
        </div>
      </div>
      {state?.error && <p className="text-sm text-rose-400">{state.error}</p>}
      {state?.success && (
        <p className="text-sm text-emerald-400">头像已更新</p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "上传中..." : "保存头像"}
      </Button>
    </form>
  );
}
