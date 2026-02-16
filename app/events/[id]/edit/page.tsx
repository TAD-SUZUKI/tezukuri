import prisma from "@/lib/prisma";
import EventForm from "@/components/EventForm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
        redirect("/auth/login");
    }

    const { id } = await params;
    const event = await prisma.event.findUnique({
        where: { id },
    });

    if (!event) {
        notFound();
    }

    if (event.authorId !== session.user.id) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <h1 className="text-4xl font-bold text-rose-500">403</h1>
                <p className="text-xl text-slate-600">You are not authorized to edit this event.</p>
                <Link href="/" className="text-indigo-600 hover:underline">Return Home</Link>
            </div>
        );
    }

    return (
        <div className="py-12 px-4 sm:px-6 lg:px-8">
            <EventForm initialData={event} isEditing={true} />
        </div>
    );
}
