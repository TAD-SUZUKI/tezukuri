import prisma from "@/lib/prisma";
import EventCard from "@/components/EventCard";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await getServerSession(authOptions);

  // 日本時間(JST)基準での「今日の0時0分0秒」をUTCのDateオブジェクトとして取得
  const jstTodayStart = fromZonedTime(
    formatInTimeZone(new Date(), "Asia/Tokyo", "yyyy-MM-dd 00:00:00"),
    "Asia/Tokyo"
  );

  // 重複カウント防止用のクッキー判定とアクセスカウント処理
  const cookieStore = await cookies();
  const hasVisited = cookieStore.get("has_visited");

  let currentViews = 0;
  try {
    if (!hasVisited) {
      // 24時間以内に未訪問の場合：カウントアップ
      const counter = await prisma.counter.upsert({
        where: { id: 1 },
        update: { views: { increment: 1 } },
        create: { id: 1, views: 1 },
      });
      currentViews = counter.views;
      // 訪問済みクッキーを24時間（86400秒）有効で設定
      cookieStore.set("has_visited", "true", { maxAge: 60 * 60 * 24, path: "/" });
    } else {
      // 訪問済みの場合：現在のカウント値のみ取得
      const counter = await prisma.counter.findUnique({
        where: { id: 1 },
      });
      currentViews = counter ? counter.views : 0;
    }
  } catch (error) {
    console.error("Counter database error:", error);
  }

  // 今日以降のイベントを昇順で取得
  const events = await prisma.event.findMany({
    where: {
      date: {
        gte: jstTodayStart,
      },
      status: "APPROVED",
    },
    orderBy: {
      date: 'asc',
    },
    include: {
      author: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return (
    <div className="space-y-8">
      {/* ヒーローセクション */}
      <header className="text-center space-y-4 py-12 bg-white/60 rounded-3xl shadow-sm backdrop-blur-sm border border-white/60">
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight">
          Upcoming Handmade Markets
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto px-4">
          Discover unique crafts and meet local artisans at these upcoming events.
        </p>
      </header>

      {/* アクセスカウンター */}
      <div className="flex justify-center items-center py-2.5 bg-white rounded-2xl border border-slate-100 max-w-xs mx-auto text-xs font-semibold text-slate-500 gap-2 shadow-sm">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>累計訪問者数:</span>
        <span className="font-mono bg-slate-50 px-2 py-0.5 rounded text-indigo-600 font-bold tracking-wider border border-slate-100">
          {currentViews.toLocaleString()}
        </span>
        <span>人</span>
      </div>

      {/* Event List Section */}
      <section>
        {events.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-dashed border-slate-300">
            <p className="text-xl text-slate-500 mb-4">No upcoming events found.</p>
            {session ? (
              <Link href="/events/new" className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-full font-medium hover:bg-indigo-700 transition-colors">
                Host an Event
              </Link>
            ) : (
              <p className="text-slate-400">Log in to create an event.</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={{
                  ...event,
                  author: {
                    name: event.author.name || "Anonymous",
                    email: event.author.email || ""
                  }
                }}
                currentUserId={session?.user?.id}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
