import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { updateScheduleAction } from "@/actions/admin/schedule-actions";
import { ScheduleForm } from "../../schedule-form";

export const dynamic = "force-dynamic";

export default async function EditSchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [schedule, courseTypes, coaches] = await Promise.all([
    db.schedule.findUnique({ where: { id } }),
    db.courseType.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.coach.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  if (!schedule) {
    notFound();
  }

  const boundUpdate = updateScheduleAction.bind(null, id);

  return (
    <div className="max-w-md">
      <Link href="/admin/schedules" className="text-sm text-fuchsia-400">
        ← 返回排课管理
      </Link>
      <h1 className="mb-4 mt-3 text-xl font-semibold text-zinc-50">
        编辑排课
      </h1>
      <Card>
        <ScheduleForm
          action={boundUpdate}
          courseTypes={courseTypes}
          coaches={coaches}
          submitLabel="保存"
          defaultValues={{
            courseTypeId: schedule.courseTypeId,
            coachId: schedule.coachId,
            room: schedule.room,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            capacity: schedule.capacity,
          }}
        />
      </Card>
    </div>
  );
}
