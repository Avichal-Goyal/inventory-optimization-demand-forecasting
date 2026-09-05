// app/api/sales/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';// Make sure this path points to your prisma.ts file

// 1. GET: Fetch all inventory for the dashboard
export async function GET() {
  try {
    const items = await prisma.item.findMany({
      orderBy: { id: 'asc' }, // Order by ID to keep the table stable
    });

    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    console.error("Failed to fetch inventory:", error);
    return NextResponse.json({ success: false, error: 'Failed to fetch inventory' }, { status: 500 });
  }
}

// 2. POST: Handle the "Log Sale (-5)" button
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { itemId, quantitySold } = body;

    // Fetch the current item to check stock
    const item = await prisma.item.findUnique({
      where: { id: itemId }
    });

    if (!item) {
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
    }

    if (item.currentStock < quantitySold) {
      return NextResponse.json({ success: false, error: 'Not enough stock' }, { status: 400 });
    }

    // Update the database: deduct stock and log the transaction
    const updatedItem = await prisma.$transaction([
      prisma.item.update({
        where: { id: itemId },
        data: { currentStock: item.currentStock - quantitySold }
      }),
      prisma.inventoryTransaction.create({
        data: {
          productName: item.productName,
          quantityChange: -quantitySold,
          transactionType: "SALE"
        }
      })
    ]);

    // Check if we hit the Reorder Point
    const newStock = updatedItem[0].currentStock;
    const needsReorder = newStock <= item.reorderPoint;
    
    // Quick EOQ Calculation for the alert
    // (We estimate holding cost at 20% and setup cost at $50 for this demo)
    const holdingCost = 0.2;
    const setupCost = 50;
    const annualDemand = item.avgDailyDemand * 365;
    
    // EOQ = sqrt((2 * Demand * Setup Cost) / Holding Cost)
    const eoq = Math.ceil(Math.sqrt((2 * annualDemand * setupCost) / holdingCost));

    return NextResponse.json({
      success: true,
      data: updatedItem[0],
      needsReorder,
      eoqRecommendation: needsReorder ? eoq : null
    });

  } catch (error) {
    console.error("Sale transaction failed:", error);
    return NextResponse.json({ success: false, error: 'Transaction failed' }, { status: 500 });
  }
}