export const calculateEOQ = ({ annualDemand, orderCost, holdingCostPerUnit }) => {
    if (annualDemand <= 0 || orderCost <= 0 || holdingCostPerUnit <= 0) {
        throw new Error("All EOQ parameters must be strictly positive numbers.");
    }

    const rawEOQ = Math.sqrt((2 * annualDemand * orderCost) / holdingCostPerUnit);

    // Logistical constraint: We cannot order a fraction of a unit.
    const optimalOrderQuantity = Math.round(rawEOQ);

    const totalOrdersPerYear = annualDemand / optimalOrderQuantity;
    const annualHoldingCost = (optimalOrderQuantity / 2) * holdingCostPerUnit;
    const annualOrderingCost = totalOrdersPerYear * orderCost;
    const toalInventoryCost = annualHoldingCost + annualOrderingCost;

    return {
        optimalOrderQuantity,
        totalOrdersPerYear: Number(totalOrdersPerYear.toFixed(2)),
        annualHoldingCost: Number(annualHoldingCost.toFixed(2)),
        annualOrderingCost: Number(annualOrderingCost.toFixed(2)),
        totalInventoryCost: Number(totalInventoryCost.toFixed(2)),
    };
};