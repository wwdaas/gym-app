import Link from "next/link";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { ActionButton } from "@/components/booking/action-button";
import { createCoachAction, deleteCoachAction } from "@/actions/admin/coach-actions";
import { CoachForm } from "./coach-form";

export const dynamic = "force-dynamic";

export default async function CoachesPage() {
  const coaches = await db.coach.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { schedules: true } } },
  });

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <h1 className="mb-4 text-xl font-semibold text-zinc-50">教练管理</h1>
        {coaches.length === 0 ? (
          <EmptyState title="还没有教练" description="在右侧新建一个" />
        ) : (
          <div className="space-y-3">
            {coaches.map((coach) => {
              const boundDelete = deleteCoachAction.bind(null, coach.id);
              return (
                <Card key={coach.id} className="flex items-start gap-3">
                  <Avatar src={coach.photoUrl} name={coach.name} />
                  <div className="flex-1">
                    <p className="font-medium text-zinc-50">{coach.name}</p>
                    <p className="mt-0.5 text-sm text-zinc-500">
                      带课 {coach._count.schedules} 次
                    </p>
                    {coach.bio && (
                      <p className="mt-1 text-sm text-zinc-500">{coach.bio}</p>
                    )}
                    <div className="mt-3 flex items-center gap-3">
                      <Link
                        href={`/admin/coaches/${coach.id}/edit`}
                        className="text-sm text-fuchsia-400"
                      >
                        编辑
                      </Link>
                      <ActionButton
                        action={boundDelete}
                        label="删除"
                        pendingLabel="删除中..."
                        variant="ghost"
                        confirmMessage={`确定要删除教练「${coach.name}」吗？`}
                      />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold text-zinc-50">新建教练</h2>
        <Card>
          <CoachForm action={createCoachAction} submitLabel="创建" />
        </Card>
      </div>
    </div>
  );
}
