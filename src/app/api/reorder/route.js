import { NextResponse } from 'next/server';
// Import your existing Prisma instance instead of making a new one!
import prisma from '@/lib/prisma'; // Adjust the path if your lib folder is somewhere else

export async function POST(request) {
  try {
    const body = await request.json();
    const { productId, orderQuantity } = body;

    if (!productId || !orderQuantity) {
      return NextResponse.json({ error: 'Missing product ID or order quantity.' }, { status: 400 });
    }

    console.log(`📦 RECEIVED ORDER: ${orderQuantity} units of ${productId}`);

    // ==========================================
    // DATABASE UPDATE LOGIC
    // ==========================================
    const updatedItem = await prisma.item.update({
    where: { id: parseInt(productId) }, // Converts string "183" to integer 183
    data: { currentStock: { increment: parseInt(orderQuantity) } } // Safety conversion for quantity too
    });

    return NextResponse.json({ 
      message: `Successfully placed an order for ${orderQuantity} units!`,
      data: updatedItem
    }, { status: 200 });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error while restocking.' }, { status: 500 });
  }
}