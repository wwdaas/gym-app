import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { updateCourseTypeAction } from "@/actions/admin/course-type-actions";
import { CourseTypeForm } from "../../course-type-form";

export const dynamic = "force-dynamic";

export default async function EditCourseTypePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const courseType = await db.courseType.findUnique({ where: { id } });
  if (!courseType) {
    notFound();
  }

  const boundUpdate = updateCourseTypeAction.bind(null, id);

  return (
    <div className="max-w-md">
      <Link href="/admin/course-types" className="text-sm text-fuchsia-400">
        ← 返回课程类型列表
      </Link>
      <h1 className="mb-4 mt-3 text-xl font-semibold text-zinc-50">
        编辑课程类型
      </h1>
      <Card>
        <CourseTypeForm
          action={boundUpdate}
          submitLabel="保存"
          showActiveToggle
          defaultValues={{
            name: courseType.name,
            description: courseType.description,
            durationMinutes: courseType.durationMinutes,
            isActive: courseType.isActive,
          }}
        />
      </Card>
    </div>
  );
}
