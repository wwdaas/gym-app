import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { AvatarUploadForm } from "./avatar-upload-form";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) return null;

  const user = await db.user.findUniqueOrThrow({
    where: { id: session.user.id },
  });

  return (
    <div className="max-w-md">
      <h1 className="mb-4 text-xl font-semibold text-zinc-50">个人资料</h1>
      <Card className="space-y-4">
        <div>
          <p className="text-sm text-zinc-500">姓名</p>
          <p className="text-zinc-50">{user.name}</p>
        </div>
        <div>
          <p className="text-sm text-zinc-500">邮箱</p>
          <p className="text-zinc-50">{user.email}</p>
        </div>
        <div className="border-t border-zinc-800 pt-4">
          <AvatarUploadForm name={user.name} avatarUrl={user.avatarUrl} />
        </div>
      </Card>
    </div>
  );
}
