"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";
import type { ActionState } from "@/actions/booking-actions";

type BoundAction = (
  prevState: ActionState,
  formData: FormData,
) => Promise<ActionState>;

function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function ScheduleForm({
  action,
  courseTypes,
  coaches,
  defaultValues,
  submitLabel,
}: {
  action: BoundAction;
  courseTypes: { id: string; name: string }[];
  coaches: { id: string; name: string }[];
  defaultValues?: {
    courseTypeId: string;
    coachId: string;
    room: string;
    startTime: Date;
    endTime: Date;
    capacity: number;
  };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label>课程类型</Label>
        <Select
          name="courseTypeId"
          required
          defaultValue={defaultValues?.courseTypeId}
        >
          <option value="" disabled>
            请选择
          </option>
          {courseTypes.map((ct) => (
            <option key={ct.id} value={ct.id}>
              {ct.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>教练</Label>
          <Select
            name="coachId"
            required
            defaultValue={defaultValues?.coachId}
          >
            <option value="" disabled>
              请选择
            </option>
            {coaches.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>场地</Label>
          <Input name="room" required defaultValue={defaultValues?.room} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>开始时间</Label>
          <Input
            type="datetime-local"
            name="startTime"
            required
            defaultValue={
              defaultValues && toDatetimeLocalValue(defaultValues.startTime)
            }
          />
        </div>
        <div>
          <Label>结束时间</Label>
          <Input
            type="datetime-local"
            name="endTime"
            required
            defaultValue={
              defaultValues && toDatetimeLocalValue(defaultValues.endTime)
            }
          />
        </div>
      </div>
      <div>
        <Label>容量</Label>
        <Input
          type="number"
          name="capacity"
          min={1}
          required
          defaultValue={defaultValues?.capacity ?? 10}
          className="w-32"
        />
      </div>
      {state?.error && <p className="text-sm text-rose-400">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "保存中..." : submitLabel}
      </Button>
    </form>
  );
}
