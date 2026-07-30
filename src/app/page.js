'use client';

import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sellingItemId, setSellingItemId] = useState(null);
  const [saleAlert, setSaleAlert] = useState(null);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/sales');
      const json = await res.json();
      if (json.success) {
        setItems(json.data);
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleLogSale = async (itemId, quantity = 5) => {
    setSellingItemId(itemId);
    setSaleAlert(null);

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, quantitySold: quantity }),
      });

      const json = await res.json();

      if (!json.success) {
        alert(`Failed to log sale: ${json.error}`);
        return;
      }

      if (json.needsReorder) {
        setSaleAlert({
          type: 'warning',
          message: `🚨 Reorder Triggered for "${json.data.productName}"! Stock (${json.data.currentStock}) is at or below Reorder Point (${json.data.reorderPoint.toFixed(1)}). Recommended EOQ Purchase Order: ${json.eoqRecommendation} units.`,
        });
      } else {
        setSaleAlert({
          type: 'success',
          message: `✅ Sale logged successfully! Sold ${quantity} units of "${json.data.productName}". Stock remaining: ${json.data.currentStock}.`,
        });
      }

      fetchItems();
    } catch (err) {
      alert('Error connecting to API server.');
    } finally {
      setSellingItemId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="border-b border-slate-800 pb-6 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Retail Inventory & Demand Forecasting
            </h1>
            <p className="text-slate-400 mt-2">
              Real-time automated restocking triggers & EOQ optimization.
            </p>
          </div>
        </header>

        {saleAlert && (
          <div
            className={`p-4 rounded-lg border font-medium ${
              saleAlert.type === 'warning'
                ? 'bg-amber-950/80 border-amber-600 text-amber-200'
                : 'bg-emerald-950/80 border-emerald-600 text-emerald-200'
            }`}
          >
            {saleAlert.message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
            <h3 className="text-sm font-medium text-slate-400">Total Products</h3>
            <p className="text-3xl font-bold text-white mt-2">{items.length}</p>
          </div>

          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
            <h3 className="text-sm font-medium text-slate-400">Total Units in Stock</h3>
            <p className="text-3xl font-bold text-emerald-400 mt-2">
              {items.reduce((acc, item) => acc + item.currentStock, 0)}
            </p>
          </div>

          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
            <h3 className="text-sm font-medium text-slate-400">Items Needing Restock</h3>
            <p className="text-3xl font-bold text-amber-400 mt-2">
              {items.filter((i) => i.currentStock <= i.reorderPoint).length}
            </p>
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-xl font-semibold text-white">Live Inventory Matrix</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading products from Neon database...</div>
          ) : (
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="sticky top-0 bg-slate-900 z-10">
                  <tr className="bg-slate-800/50 text-slate-300 font-medium border-b border-slate-800">
                    <th className="p-4">ID</th>
                    <th className="p-4">Product Name</th>
                    <th className="p-4 text-right">Current Stock</th>
                    <th className="p-4 text-right">Annual Demand</th>
                    <th className="p-4 text-right">ROP</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {items.map((item) => {
                    const isLowStock = item.currentStock <= item.reorderPoint;
                    return (
                      <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-4 font-mono text-xs text-slate-500">#{item.id}</td>
                        <td className="p-4 font-semibold text-white">{item.productName}</td>
                        <td className="p-4 font-bold text-base text-right">{item.currentStock}</td>
                        <td className="p-4 text-slate-400 text-right">
                          {Math.round(item.avgDailyDemand * 365).toLocaleString()}
                        </td>
                        <td className="p-4 text-slate-400 text-right">{item.reorderPoint.toFixed(1)}</td>
                        <td className="p-4 text-center">
                          {isLowStock ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              ⚠️ REORDER
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Healthy
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleLogSale(item.id, 5)}
                            disabled={sellingItemId === item.id || item.currentStock < 5}
                            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium px-3 py-1.5 rounded-lg text-xs transition-colors"
                          >
                            {sellingItemId === item.id ? 'Processing...' : 'Log Sale (-5)'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}