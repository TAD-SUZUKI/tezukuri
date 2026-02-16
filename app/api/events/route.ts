import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { title, description, location, date, startTime, endTime } = await req.json();

        if (!title || !location || !date || !startTime || !endTime) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        const event = await prisma.event.create({
            data: {
                title,
                description,
                location,
                date: new Date(date),
                startTime,
                endTime,
                authorId: session.user.id,
            },
        });

        return NextResponse.json(event, { status: 201 });
    } catch (error) {
        console.error("Event creation error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
