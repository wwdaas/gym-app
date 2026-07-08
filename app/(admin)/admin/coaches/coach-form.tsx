"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/field";
import { Avatar } from "@/components/ui/avatar";
import type { ActionState } from "@/actions/booking-actions";

type BoundAction = (
  prevState: ActionState,
  formData: FormData,
) => Promise<ActionState>;

export function CoachForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: BoundAction;
  defaultValues?: {
    name: string;
    bio: string | null;
    photoUrl: string | null;
  };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar
          src={defaultValues?.photoUrl}
          name={defaultValues?.name ?? "教练"}
          size="lg"
        />
        <div className="flex-1">
          <Label htmlFor="photo">照片</Label>
          <input
            id="photo"
            type="file"
            name="photo"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="mt-1 block w-full text-sm text-zinc-400 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-800 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-100 hover:file:bg-zinc-700"
          />
        </div>
      </div>
      <div>
        <Label>姓名</Label>
        <Input name="name" required defaultValue={defaultValues?.name} />
      </div>
      <div>
        <Label>简介（可选）</Label>
        <Textarea
          name="bio"
          rows={2}
          defaultValue={defaultValues?.bio ?? ""}
        />
      </div>
      {state?.error && <p className="text-sm text-rose-400">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "保存中..." : submitLabel}
      </Button>
    </form>
  );
}
