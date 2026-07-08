import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { updateCoachAction } from "@/actions/admin/coach-actions";
import { CoachForm } from "../../coach-form";

export const dynamic = "force-dynamic";

export default async function EditCoachPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const coach = await db.coach.findUnique({ where: { id } });
  if (!coach) {
    notFound();
  }

  const boundUpdate = updateCoachAction.bind(null, id);

  return (
    <div className="max-w-md">
      <Link href="/admin/coaches" className="text-sm text-fuchsia-400">
        ← 返回教练管理
      </Link>
      <h1 className="mb-4 mt-3 text-xl font-semibold text-zinc-50">
        编辑教练
      </h1>
      <Card>
        <CoachForm
          action={boundUpdate}
          submitLabel="保存"
          defaultValues={{
            name: coach.name,
            bio: coach.bio,
            photoUrl: coach.photoUrl,
          }}
        />
      </Card>
    </div>
  );
}
