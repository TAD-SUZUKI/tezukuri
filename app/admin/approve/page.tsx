import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ApproveList from "./ApproveList";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminApprovePage() {
  const session = await getServerSession(authOptions);
  const adminEmail = process.env.ADMIN_EMAIL;

  // 1. 未ログインまたは管理者メールアドレスと不一致の場合は弾く
  if (!session?.user?.email || !adminEmail || session.user.email !== adminEmail) {
    // ログインページへリダイレクト
    redirect(`/auth/login?callbackUrl=/admin/approve`);
  }

  // 2. 承認待ち（PENDING）のイベント一覧を取得
  const pendingEvents = await prisma.event.findMany({
    where: {
      status: "PENDING",
    },
    orderBy: {
      date: "asc",
    },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            管理者用イベント承認
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            AIクローラーが収集したイベント情報を確認・編集し、公開を承認してください。
          </p>
        </div>
        <div>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 border border-slate-200 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-xl shadow-sm transition-colors"
          >
            🏠 トップページへ
          </Link>
        </div>
      </div>

      {/* 承認リストコンポーネント */}
      <ApproveList initialEvents={pendingEvents} />
    </div>
  );
}
