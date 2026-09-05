'use client';
import { useState } from 'react';

export default function ReorderButton({ 
  productId, 
  orderQuantity, 
  onSuccess // Optional function to refresh your data after a successful order
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleRestock = async () => {
    // Safety check
    if (!orderQuantity || orderQuantity <= 0) {
      alert("Please specify a valid order quantity.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          productId: productId, 
          orderQuantity: orderQuantity 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✅ ${data.message}`);
        // If a refresh function was passed down, call it so the UI updates
        if (onSuccess) onSuccess(); 
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      console.error('Failed to submit reorder request:', err);
      alert('Network error while placing reorder.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button 
      onClick={handleRestock}
      disabled={isLoading}
      className={`w-full font-bold py-2 px-4 rounded-lg transition-colors shadow-sm flex justify-center items-center ${
        isLoading 
          ? 'bg-gray-400 text-gray-100 cursor-not-allowed' 
          : 'bg-green-600 hover:bg-green-700 text-white'
      }`}
    >
      {isLoading ? (
        // Simple loading text (you could add an SVG spinner here)
        <span>Processing...</span> 
      ) : (
        <span>Restock {orderQuantity} Units</span>
      )}
    </button>
  );
}