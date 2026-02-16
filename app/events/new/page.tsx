import EventForm from "@/components/EventForm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function NewEventPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/auth/login?callbackUrl=/events/new");
    }

    return (
        <div className="py-12 px-4 sm:px-6 lg:px-8">
            <EventForm />
        </div>
    );
}
