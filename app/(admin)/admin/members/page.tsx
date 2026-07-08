import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const members = await db.user.findMany({
    where: { role: "MEMBER" },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { bookings: true } } },
  });

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-zinc-50">会员列表</h1>
      {members.length === 0 ? (
        <EmptyState title="还没有会员" />
      ) : (
        <div className="space-y-2">
          {members.map((member) => (
            <Card
              key={member.id}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <Avatar src={member.avatarUrl} name={member.name} />
                <div>
                  <p className="font-medium text-zinc-50">{member.name}</p>
                  <p className="mt-0.5 text-sm text-zinc-500">
                    {member.email}
                    {member.phone ? ` · ${member.phone}` : ""}
                  </p>
                </div>
              </div>
              <div className="text-right text-sm text-zinc-500">
                <p>累计预约 {member._count.bookings} 次</p>
                <p>注册于 {formatDateTime(member.createdAt)}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
