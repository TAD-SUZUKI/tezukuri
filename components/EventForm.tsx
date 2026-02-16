"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

const eventSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().optional(),
    location: z.string().min(3, "Location is required"),
    date: z.string().min(1, "Date is required"),
    startTime: z.string().regex(/^\d+$/, "Start time must be numbers only").min(1, "Required"),
    endTime: z.string().regex(/^\d+$/, "End time must be numbers only").min(1, "Required"),
});

type EventFormData = z.infer<typeof eventSchema>;

interface EventFormProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialData?: any;
    isEditing?: boolean;
}

export default function EventForm({ initialData, isEditing = false }: EventFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [serverError, setServerError] = useState("");

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<EventFormData>({
        resolver: zodResolver(eventSchema),
        defaultValues: initialData
            ? {
                ...initialData,
                date: initialData.date ? formatInTimeZone(new Date(initialData.date), "Asia/Tokyo", "yyyy-MM-dd") : "",
                startTime: initialData.startTime || "",
                endTime: initialData.endTime || "",
            }
            : {
                title: "",
                description: "",
                location: "",
                date: "",
                startTime: "",
                endTime: "",
            },
    });

    const onSubmit = async (data: EventFormData) => {
        setIsLoading(true);
        setServerError("");
        try {
            const url = isEditing && initialData?.id
                ? `/api/events/${initialData.id}`
                : "/api/events";

            const method = isEditing ? "PUT" : "POST";

            // For the 'date' field (DateTime), we combine date and startTime for better sorting/indexing
            // Extract HH and MM from startTime (e.g., "1000" -> 10:00)
            const st = data.startTime.padStart(4, '0');
            const hour = parseInt(st.substring(0, 2));
            const minute = parseInt(st.substring(2, 4)) || 0;

            const [year, month, day] = data.date.split("-").map(Number);
            const utcTime = Date.UTC(year, month - 1, day, hour - 9, minute);
            const finalIsoDate = new Date(utcTime).toISOString();

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    date: finalIsoDate,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Failed to save event");
            }

            router.push("/");
            router.refresh();
        } catch (error: any) {
            setServerError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">{isEditing ? "Edit Event" : "Create New Event"}</h2>

            {serverError && (
                <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm border border-rose-100">
                    {serverError}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Event Title</label>
                <input
                    {...register("title")}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="e.g. Summer Handcraft Fair"
                />
                {errors.title && <p className="text-rose-500 text-xs mt-1">{errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                    <input
                        {...register("location")}
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        placeholder="e.g. Central Park, Tokyo"
                    />
                    {errors.location && <p className="text-rose-500 text-xs mt-1">{errors.location.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                    <input
                        type="date"
                        {...register("date")}
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                    {errors.date && <p className="text-rose-500 text-xs mt-1">{errors.date.message}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Start Time (e.g. 1000)</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        {...register("startTime")}
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white font-mono"
                        placeholder="1000"
                        onInput={(e) => {
                            e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '');
                        }}
                    />
                    {errors.startTime && <p className="text-rose-500 text-xs mt-1">{errors.startTime.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">End Time (e.g. 1800)</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        {...register("endTime")}
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white font-mono"
                        placeholder="1800"
                        onInput={(e) => {
                            e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '');
                        }}
                    />
                    {errors.endTime && <p className="text-rose-500 text-xs mt-1">{errors.endTime.message}</p>}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                    {...register("description")}
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Describe your event..."
                />
                {errors.description && <p className="text-rose-500 text-xs mt-1">{errors.description.message}</p>}
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-lg transition-colors shadow-lg shadow-indigo-200"
                >
                    {isLoading ? "Saving..." : isEditing ? "Update Event" : "Create Event"}
                </button>
            </div>
        </form>
    );
}
