'use client';

import { useCart } from "../context/CartContext";
import { useRouter } from 'next/navigation';
import MenuHeader from "./MenuHeader";
import { getRestaurantData } from "../utils/restaurantData";

export default function CartView() {
  const { state } = useCart();
  const router = useRouter();
  const restaurantData = getRestaurantData();

  const handleGoBack = () => {
    router.back();
  };

  const handleOrder = () => {
    // Navegamos a la vista de usuario para capturar su nombre
    router.push('/user');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MenuHeader restaurant={restaurantData} />

      {/* Back button */}
      <div className="max-w-md mx-auto px-4 py-4">
        <button 
          onClick={handleGoBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      </div>

      {/* Cart Items */}
      <div className="max-w-md mx-auto px-4 pb-32">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 d-flex justify-center">
            <h2 className="text-lg font-medium text-gray-800">Items in Cart</h2>
          </div>
          
          {state.items.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <div className="text-gray-400 text-4xl mb-4">🛒</div>
              <p className="text-gray-500">Your cart is empty</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {state.items.map((item) => (
                <div key={item.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                          <span className="text-yellow-600 text-sm">⭐</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-800 truncate">
                          {item.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          x {item.quantity}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-800">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Order Button - Fixed at bottom */}
      {state.items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="max-w-md mx-auto">
            <button 
              onClick={handleOrder}
              className="w-full bg-teal-700 text-white py-4 rounded-lg font-medium hover:bg-teal-800 transition-colors"
            >
              Order {state.totalItems} items
            </button>
          </div>
        </div>
      )}
    </div>
  );
}