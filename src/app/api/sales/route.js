import { query } from "@/lib/db";
import { NextResponse } from "next/server";
import { calculateEOQ } from "@/lib/eoq";

export async function POST(request) {
    try {
        const body = await request.json();
        const { itemId, quantitySold } = body;

        if (!itemId || !quantitySold) {
            return NextResponse.json({ success: false, error: 'Missing itemId or quantitySold' }, { status: 400 });
        }

        await query('BEGIN');

        const updateQuery = `
            UPDATE items
            SET current_stock = current_stock - $1, updated_at = NOW()
            WHERE id = $2
            RETURNING id. sku, name, current_stock, annual_demand, order_Cost, holding_cost_per_unit, reorder_point;
        `;

        const itemResult = await query(updateQuery, [quantitySold, itemId()]);

        if (itemResult.rows.length === 0) {
            await query('ROLLBACK');
            return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
        }

        const item = itemResult.rows[0];

        const txQuery = `
            INSERT INTO inventory_transactions (item_id, quantity_change, transaction_type)
            VALUES ($1, $2, 'SALE');
        `;

        await query(txQuery, [itemId, -quantitySold]);

        await query('COMMIT');

        const needsRestock = item.current_stock <= item.reorder_point;

        let eoqMetrics = null;
        if (needsRestock) {
            eoqMetrics = calculateEOQ({
                annualDemand: item.annualDemand,
                orderCost: item.orderCost,
                holdingCostPerUnit: item.holding_cost_per_unit
            });

        }

        return NextResponse.json({
            success: true,
            currentStock: item.current_stock,
            needsRestock,
            eoqMetrics // This will contain optimalOrderQuantity, totalInventoryCost, etc.
        });
    } catch(error) {
        await query('ROLLBACK');
        console.error('Failed to log sale:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
