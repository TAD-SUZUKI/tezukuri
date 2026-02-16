"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { FaMapMarkerAlt, FaCalendarAlt, FaUser, FaEdit, FaTrash } from "react-icons/fa";

interface EventProps {
    event: {
        id: string;
        title: string;
        description: string | null;
        location: string;
        date: Date;
        authorId: string;
        author: {
            name: string | null;
            email: string | null;
        };
        startTime?: string | null;
        endTime?: string | null;
    };
    currentUserId?: string;
}

export default function EventCard({ event, currentUserId }: EventProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const isOwner = currentUserId === event.authorId;

    const formatTime = (timeStr?: string | null) => {
        if (!timeStr) return "";
        const padded = timeStr.padStart(4, '0');
        return `${padded.substring(0, 2)}:${padded.substring(2, 4)}`;
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to cancel this event?")) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/events/${event.id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                router.refresh();
            } else {
                alert("Failed to delete event");
            }
        } catch (error) {
            alert("Error deleting event");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-slate-100 flex flex-col h-full group">
            <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                        <FaCalendarAlt />
                        {formatInTimeZone(new Date(event.date), "Asia/Tokyo", "MMM d, yyyy")}
                    </div>
                    {isOwner && (
                        <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link
                                href={`/events/${event.id}/edit`}
                                className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                                title="Edit"
                            >
                                <FaEdit />
                            </Link>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                                title="Delete"
                            >
                                <FaTrash />
                            </button>
                        </div>
                    )}
                </div>

                <Link href={`/events/${event.id}`} className="block">
                    <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                        {event.title}
                    </h3>
                </Link>

                <div className="flex items-center text-slate-500 text-sm mb-4">
                    <FaMapMarkerAlt className="mr-1.5 flex-shrink-0" />
                    <span className="truncate">{event.location}</span>
                </div>

                <p className="text-slate-600 text-sm line-clamp-3 mb-6 flex-1">
                    {event.description || "No description provided."}
                </p>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-100 mt-auto">
                    <div className="flex items-center gap-1.5">
                        <FaUser className="text-slate-300" />
                        <span className="truncate max-w-[150px]">{event.author.name || "Anonymous"}</span>
                    </div>
                    <div className="font-mono bg-slate-50 px-2 py-0.5 rounded text-slate-600">
                        {event.startTime ? (
                            `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`
                        ) : (
                            formatInTimeZone(new Date(event.date), "Asia/Tokyo", "h:mm a")
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
