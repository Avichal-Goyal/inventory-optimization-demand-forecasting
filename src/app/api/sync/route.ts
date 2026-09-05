import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.SYNC_API_KEY}`) {
            return NextResponse.json(
                {error: 'Unauthorized request'},
                {status: 401}
            );
        }

        const data = await request.json();

        if (!Array.isArray(data)) {
            return NextResponse.json(
                {error: 'Expected an array of items'},
                {status: 400}
            );
        }

        const updatePromises = data.map((item: any) => {
            return prisma.item.update({
                where: {id: item.id},
                data: {
                    reorderPoint: item.reorderPoint,
                    safetyStock: item.safetyStock,
                }
            });
        });
    } catch (error) {

    }
}