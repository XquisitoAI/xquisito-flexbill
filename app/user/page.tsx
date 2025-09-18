'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTable } from '../context/TableContext';
import { useTableNavigation } from '../hooks/useTableNavigation';
import MenuHeader from '../components/MenuHeader';
import { getRestaurantData } from '../utils/restaurantData';

export default function UserPage() {
  const [userName, setUserName] = useState('');
  const { state, dispatch, submitOrder } = useTable();
  const { tableNumber, navigateWithTable, goBack } = useTableNavigation();
  const router = useRouter();
  const restaurantData = getRestaurantData();

  useEffect(() => {
    if (!tableNumber) {
      // Redirigir a home si no hay número de mesa
      router.push('/');
      return;
    }

    if (isNaN(parseInt(tableNumber))) {
      // Redirigir si el número de mesa no es válido
      router.push('/');
      return;
    }

    // Establecer el número de mesa en el contexto
    dispatch({ type: 'SET_TABLE_NUMBER', payload: tableNumber });
  }, [tableNumber, dispatch, router]);

  const handleGoBack = () => {
    goBack();
  };

  const handleProceedToOrder = async () => {
    if (userName.trim()) {
      debugger
      try {
        // Enviar la orden a la API con el nombre del usuario directamente
        await submitOrder(userName.trim());
        // Navegar a la página de órdenes
        navigateWithTable('/order');
      } catch (error) {
        console.error('Error submitting order:', error);
        // El error se maneja en el contexto
      }
    }
  };

  if (!tableNumber || isNaN(parseInt(tableNumber))) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Mesa Inválida</h1>
          <p className="text-gray-600">Por favor escanee el código QR</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a8b9b] to-[#153f43]">
      <MenuHeader restaurant={restaurantData} tableNumber={state.tableNumber} />
      
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
            disabled={!userName.trim() || state.isLoading}
            className={`w-full py-4 rounded-lg font-medium transition-colors ${
              userName.trim() && !state.isLoading
                ? 'bg-teal-700 text-white hover:bg-teal-800'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {state.isLoading ? 'Placing Order...' : `Order ${state.currentUserTotalItems} items`}
          </button>
        </div>
      </div>
    </div>
  );
}