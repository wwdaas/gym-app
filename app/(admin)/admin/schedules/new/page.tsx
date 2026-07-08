import Link from "next/link";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { createScheduleAction } from "@/actions/admin/schedule-actions";
import { ScheduleForm } from "../schedule-form";

export const dynamic = "force-dynamic";

export default async function NewSchedulePage() {
  const [courseTypes, coaches] = await Promise.all([
    db.courseType.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.coach.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="max-w-md">
      <Link href="/admin/schedules" className="text-sm text-fuchsia-400">
        ← 返回排课管理
      </Link>
      <h1 className="mb-4 mt-3 text-xl font-semibold text-zinc-50">
        新建排课
      </h1>
      {coaches.length === 0 && (
        <p className="mb-3 text-sm text-amber-400">
          还没有教练，请先去{" "}
          <Link href="/admin/coaches" className="underline">
            教练管理
          </Link>{" "}
          创建一个
        </p>
      )}
      <Card>
        <ScheduleForm
          action={createScheduleAction}
          courseTypes={courseTypes}
          coaches={coaches}
          submitLabel="创建"
        />
      </Card>
    </div>
  );
}
