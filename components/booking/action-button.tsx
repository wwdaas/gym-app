"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/actions/booking-actions";

type BoundAction = (
  prevState: ActionState,
  formData: FormData,
) => Promise<ActionState>;

export function ActionButton({
  action,
  label,
  pendingLabel,
  variant = "primary",
  disabled,
  confirmMessage,
}: {
  action: BoundAction;
  label: string;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  disabled?: boolean;
  confirmMessage?: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (confirmMessage && !confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
    >
      <Button type="submit" variant={variant} disabled={pending || disabled}>
        {pending ? (pendingLabel ?? "处理中...") : label}
      </Button>
      {state?.error && (
        <p className="mt-1 text-xs text-rose-400">{state.error}</p>
      )}
    </form>
  );
}
