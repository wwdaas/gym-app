"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/field";
import type { ActionState } from "@/actions/booking-actions";

type BoundAction = (
  prevState: ActionState,
  formData: FormData,
) => Promise<ActionState>;

export function CourseTypeForm({
  action,
  defaultValues,
  submitLabel,
  showActiveToggle,
}: {
  action: BoundAction;
  defaultValues?: {
    name: string;
    description: string | null;
    durationMinutes: number;
    isActive?: boolean;
  };
  submitLabel: string;
  showActiveToggle?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label>课程名称</Label>
        <Input name="name" required defaultValue={defaultValues?.name} />
      </div>
      <div>
        <Label>描述（可选）</Label>
        <Textarea
          name="description"
          defaultValue={defaultValues?.description ?? ""}
          rows={2}
        />
      </div>
      <div>
        <Label>时长（分钟）</Label>
        <Input
          type="number"
          name="durationMinutes"
          min={1}
          required
          defaultValue={defaultValues?.durationMinutes ?? 60}
          className="w-32"
        />
      </div>
      {showActiveToggle && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            name="isActive"
            defaultChecked={defaultValues?.isActive ?? true}
            className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-fuchsia-500 focus:ring-fuchsia-500/50"
          />
          <label htmlFor="isActive" className="text-sm text-zinc-300">
            启用中
          </label>
        </div>
      )}
      {state?.error && <p className="text-sm text-rose-400">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "保存中..." : submitLabel}
      </Button>
    </form>
  );
}
