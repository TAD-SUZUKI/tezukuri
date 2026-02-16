import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { title, description, location, date, startTime, endTime } = await req.json();

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
        return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    if (event.authorId !== session.user.id) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const updatedEvent = await prisma.event.update({
        where: { id },
        data: {
            title,
            description,
            location,
            date: new Date(date),
            startTime,
            endTime,
        },
    });

    return NextResponse.json(updatedEvent);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const event = await prisma.event.findUnique({ where: { id } });

    if (!event) {
        return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    if (event.authorId !== session.user.id) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await prisma.event.delete({ where: { id } });

    return NextResponse.json({ message: "Event deleted successfully" });
}
