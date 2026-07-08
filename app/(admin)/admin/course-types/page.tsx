import Link from "next/link";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ActionButton } from "@/components/booking/action-button";
import { createCourseTypeAction, deleteCourseTypeAction } from "@/actions/admin/course-type-actions";
import { CourseTypeForm } from "./course-type-form";

export const dynamic = "force-dynamic";

export default async function CourseTypesPage() {
  const courseTypes = await db.courseType.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { schedules: true } } },
  });

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <h1 className="mb-4 text-xl font-semibold text-zinc-50">课程类型</h1>
        {courseTypes.length === 0 ? (
          <EmptyState title="还没有课程类型" description="在右侧新建一个" />
        ) : (
          <div className="space-y-3">
            {courseTypes.map((ct) => {
              const boundDelete = deleteCourseTypeAction.bind(null, ct.id);
              return (
                <Card key={ct.id}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-zinc-50">{ct.name}</p>
                      <p className="mt-0.5 text-sm text-zinc-500">
                        {ct.durationMinutes} 分钟 · 已排课 {ct._count.schedules} 次
                      </p>
                      {ct.description && (
                        <p className="mt-1 text-sm text-zinc-500">
                          {ct.description}
                        </p>
                      )}
                    </div>
                    {!ct.isActive && <Badge tone="neutral">已停用</Badge>}
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <Link
                      href={`/admin/course-types/${ct.id}/edit`}
                      className="text-sm text-fuchsia-400"
                    >
                      编辑
                    </Link>
                    <ActionButton
                      action={boundDelete}
                      label="删除"
                      pendingLabel="删除中..."
                      variant="ghost"
                      confirmMessage={`确定要删除课程类型「${ct.name}」吗？`}
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold text-zinc-50">新建课程类型</h2>
        <Card>
          <CourseTypeForm action={createCourseTypeAction} submitLabel="创建" />
        </Card>
      </div>
    </div>
  );
}
