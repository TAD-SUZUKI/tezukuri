import prisma from "@/lib/prisma";
import EventCard from "@/components/EventCard";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await getServerSession(authOptions);

  // Fetch future events sorted by date
  const events = await prisma.event.findMany({
    where: {
      date: {
        gte: new Date(),
      },
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
      <header className="text-center space-y-4 py-12 bg-white/60 rounded-3xl shadow-sm backdrop-blur-sm border border-white/60">
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight">
          Upcoming Handmade Markets
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto px-4">
          Discover unique crafts and meet local artisans at these upcoming events.
        </p>
      </header>

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
