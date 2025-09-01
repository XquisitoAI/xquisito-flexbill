'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '../context/CartContext';
import MenuHeader from '../components/MenuHeader';
import { getRestaurantData } from '../utils/restaurantData';

export default function UserPage() {
  const [userName, setUserName] = useState('');
  const { state, dispatch } = useCart();
  const router = useRouter();
  const restaurantData = getRestaurantData();

  const handleGoBack = () => {
    router.back();
  };

  const handleProceedToOrder = () => {
    if (userName.trim()) {
      // Guardar el nombre del usuario en el contexto
      dispatch({ type: 'SET_USER_NAME', payload: userName.trim() });
      router.push('/order');
    }
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

      {/* User Form */}
      <div className="max-w-md mx-auto px-4 pb-32">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-800 mb-2">Enter your name</h2>
            <p className="text-sm text-gray-600">We need your name to process your order</p>
          </div>
          
          <div className="mb-6">
            <input
              type="text"
              placeholder="Your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Order Button - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-md mx-auto">
          <button 
            onClick={handleProceedToOrder}
            disabled={!userName.trim()}
            className={`w-full py-4 rounded-lg font-medium transition-colors ${
              userName.trim()
                ? 'bg-teal-700 text-white hover:bg-teal-800'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Order {state.totalItems} items
          </button>
        </div>
      </div>
    </div>
  );
}