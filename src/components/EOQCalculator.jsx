'use client';
import ReorderButton from './ReorderButton';

import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceDot } from 'recharts';

export default function EOQCalculator({ initialDemand = 10000, productId, onReorder }) {
  // State for our interactive sliders
  const [demand, setDemand] = useState(initialDemand);
  const [orderCost, setOrderCost] = useState(50); // S: Cost per order
  const [holdingCost, setHoldingCost] = useState(5); // H: Holding cost per unit per year

  // Calculate EOQ dynamically
  const eoq = Math.round(Math.sqrt((2 * demand * orderCost) / holdingCost));
  const ordersPerYear = (demand / eoq).toFixed(1);
  const minTotalCost = Math.round((demand / eoq) * orderCost + (eoq / 2) * holdingCost);

  // Generate chart data based on current slider values
  const chartData = useMemo(() => {
    const data = [];
    // Plot points from 20% of EOQ to 250% of EOQ to show the curve perfectly
    const startQ = Math.max(10, Math.floor(eoq * 0.2));
    const endQ = Math.floor(eoq * 2.5);
    const step = Math.floor((endQ - startQ) / 20) || 1;

    for (let q = startQ; q <= endQ; q += step) {
      const holding = (q / 2) * holdingCost;
      const ordering = (demand / q) * orderCost;
      data.push({
        quantity: q,
        holdingCost: Math.round(holding),
        orderingCost: Math.round(ordering),
        totalCost: Math.round(holding + ordering),
      });
    }
    return data;
  }, [demand, orderCost, holdingCost, eoq]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Interactive EOQ Simulator</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Sliders */}
        <div className="space-y-6 lg:col-span-1">
          <div>
            <label className="flex justify-between text-sm font-medium text-gray-700 mb-1">
              <span>Annual Demand (D)</span>
              <span className="text-blue-600 font-bold">{demand.toLocaleString()} units</span>
            </label>
            <input 
              type="range" min="1000" max="50000" step="500"
              value={demand} onChange={(e) => setDemand(Number(e.target.value))}
              className="w-full cursor-pointer accent-blue-600"
            />
          </div>

          <div>
            <label className="flex justify-between text-sm font-medium text-gray-700 mb-1">
              <span>Order Cost (S)</span>
              <span className="text-blue-600 font-bold">${orderCost} / order</span>
            </label>
            <input 
              type="range" min="10" max="500" step="5"
              value={orderCost} onChange={(e) => setOrderCost(Number(e.target.value))}
              className="w-full cursor-pointer accent-blue-600"
            />
          </div>

          <div>
            <label className="flex justify-between text-sm font-medium text-gray-700 mb-1">
              <span>Holding Cost (H)</span>
              <span className="text-blue-600 font-bold">${holdingCost} / unit/yr</span>
            </label>
            <input 
              type="range" min="1" max="100" step="1"
              value={holdingCost} onChange={(e) => setHoldingCost(Number(e.target.value))}
              className="w-full cursor-pointer accent-blue-600"
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mt-4">
            <h3 className="text-sm text-blue-800 uppercase font-semibold tracking-wider">Optimal Batch Size (EOQ)</h3>
            <p className="text-4xl font-extrabold text-blue-900 mt-1">{eoq} <span className="text-lg font-medium text-blue-700">units</span></p>
            <p className="text-sm text-blue-700 mt-2">Orders per year: {ordersPerYear}</p>
          </div>

          {/* Connects back to your Reorder API */}
          <div className="mt-4">
             <ReorderButton 
               productId={productId} 
               orderQuantity={eoq} 
               onSuccess={() => console.log("Order successful! Update UI here if needed.")}
             />
          </div>
        </div>

        {/* Right Column: Chart */}
        <div className="lg:col-span-2 h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="quantity" label={{ value: 'Order Quantity (Q)', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Annual Cost ($)', angle: -90, position: 'insideLeft', offset: 10 }} />
              <Tooltip formatter={(value) => `$${value}`} labelFormatter={(label) => `Quantity: ${label}`} />
              <Legend verticalAlign="top" height={36}/>
              
              <Line type="monotone" dataKey="holdingCost" name="Holding Cost" stroke="#f59e0b" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="orderingCost" name="Ordering Cost" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="totalCost" name="Total Cost" stroke="#ef4444" strokeWidth={3} dot={false} />
              
              {/* This places a dot exactly at the lowest point of the U-curve */}
              <ReferenceDot x={eoq} y={minTotalCost} r={6} fill="#ef4444" stroke="white" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}