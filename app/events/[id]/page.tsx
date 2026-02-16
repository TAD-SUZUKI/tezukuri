import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { FaCalendarAlt, FaMapMarkerAlt, FaUser } from "react-icons/fa";

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    const event = await prisma.event.findUnique({
        where: { id },
        include: {
            author: {
                select: { name: true, email: true },
            },
        },
    });

    if (!event) {
        notFound();
    }

    const isOwner = session?.user?.id === event.authorId;

    const formatTime = (timeStr?: string | null) => {
        if (!timeStr) return "";
        const padded = timeStr.padStart(4, '0');
        return `${padded.substring(0, 2)}:${padded.substring(2, 4)}`;
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <Link href="/" className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
                    ← Back to Events
                </Link>
            </div>

            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
                <div className="p-8 md:p-12">
                    <div className="bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider inline-flex items-center gap-2 mb-6">
                        <FaCalendarAlt />
                        {formatInTimeZone(new Date(event.date), "Asia/Tokyo", "EEEE, MMMM d, yyyy")}
                        {event.startTime && (
                            <span className="ml-2 border-l border-indigo-200 pl-2">
                                {formatTime(event.startTime)} - {formatTime(event.endTime)}
                            </span>
                        )}
                        {!event.startTime && (
                            <span className="ml-2 border-l border-indigo-200 pl-2">
                                {formatInTimeZone(new Date(event.date), "Asia/Tokyo", "h:mm a")}
                            </span>
                        )}
                    </div>

                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
                        {event.title}
                    </h1>

                    <div className="flex items-center text-slate-600 text-lg mb-8">
                        <FaMapMarkerAlt className="mr-2 text-indigo-500" />
                        {event.location}
                    </div>

                    <div className="prose prose-indigo max-w-none text-slate-700 mb-12">
                        <p className="whitespace-pre-line text-lg leading-relaxed">
                            {event.description || "No description provided."}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-slate-100 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                                <FaUser />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 font-medium">Organizer</p>
                                <p className="text-slate-800 font-semibold">{event.author.name || "Anonymous"}</p>
                            </div>
                        </div>

                        {isOwner && (
                            <div className="flex gap-4">
                                <Link
                                    href={`/events/${event.id}/edit`}
                                    className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                                >
                                    Edit Event
                                </Link>
                                {/* Delete button logic usually needs client component, or just redirect to home to delete from card */}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
