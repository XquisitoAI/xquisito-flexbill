'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTable } from "../context/TableContext";
import { useTableNavigation } from "../hooks/useTableNavigation";
import { useGuest, useIsGuest } from "../context/GuestContext";
import MenuHeader from "../components/MenuHeader";
import { getRestaurantData } from "../utils/restaurantData";

export default function SelectTotalPayPage() {
  const { state } = useTable();
  const { goBack, navigateWithTable } = useTableNavigation();
  const router = useRouter();
  const restaurantData = getRestaurantData();
  const isGuest = useIsGuest();
  const { guestId, tableNumber } = useGuest();
  
  // Estado para manejar qué usuarios están seleccionados para pagar
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Calcular totales
  const tableTotalPrice = state.orders.reduce((sum, order) => sum + parseFloat(order.total_price.toString()), 0);
  const currentUserTotalPrice = state.currentUserTotalPrice;
  
  // Obtener usuarios únicos con sus totales
  const usersWithTotals = state.orders.reduce((acc, order) => {
    const existing = acc.find(u => u.userName === order.user_name);
    if (existing) {
      existing.total += parseFloat(order.total_price.toString());
    } else {
      acc.push({
        userName: order.user_name,
        total: parseFloat(order.total_price.toString())
      });
    }
    return acc;
  }, [] as Array<{ userName: string; total: number }>);

  // Incluir al usuario actual si tiene items en el carrito y no está ya en las órdenes
  const currentUserInOrders = usersWithTotals.find(u => u.userName === state.currentUserName);
  if (!currentUserInOrders && currentUserTotalPrice > 0) {
    usersWithTotals.push({
      userName: state.currentUserName || 'You',
      total: currentUserTotalPrice
    });
  }

  const handleBack = () => {
    router.back();
  };

  const handleUserSelection = (userName: string) => {
    setSelectedUsers(prev => {
      if (prev.includes(userName)) {
        return prev.filter(u => u !== userName);
      } else {
        return [...prev, userName];
      }
    });
  };

  const calculateSelectedTotal = () => {
    return usersWithTotals
      .filter(user => selectedUsers.includes(user.userName))
      .reduce((sum, user) => sum + user.total, 0);
  };

  const handlePayYourPart = () => {
    if (selectedUsers.length === 0) {
      alert('Please select at least one person to pay for');
      return;
    }

    console.log(selectedUsers);
    
    
    const selectedTotal = calculateSelectedTotal();
    
    // Navegar a la página de agregar propina con los datos seleccionados
    const queryParams = new URLSearchParams({
      amount: selectedTotal.toString(),
      users: selectedUsers.join(',')
    });    
    
    navigateWithTable(`/add-tip?${queryParams.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MenuHeader restaurant={restaurantData} tableNumber={state.tableNumber} />
      
      {/* Back Button */}
      <div className="max-w-md mx-auto px-4 py-4">
        <button 
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Guest User Indicator */}
        {isGuest && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-blue-800 font-medium text-sm">Splitting Bill</p>
                <p className="text-blue-600 text-xs">
                  {tableNumber ? `Table ${tableNumber}` : 'Guest user'} • Select who you want to pay for
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Total Amount */}
        <div className="text-center mb-8">
          <h2 className="text-lg font-medium text-gray-600 mb-2">Total</h2>
          <div className="text-4xl font-bold text-gray-800">
            ${tableTotalPrice.toFixed(2)}
          </div>
        </div>

        {/* User Selection List */}
        <div className="space-y-4 mb-8">
          {usersWithTotals.map((user) => (
            <div 
              key={user.userName}
              className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
            >
              <div className="flex items-center gap-3">
                <span className="text-gray-800 font-medium">{user.userName}</span>
                <span className="text-gray-600">${user.total.toFixed(2)}</span>
              </div>
              <button
                onClick={() => handleUserSelection(user.userName)}
                className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                  selectedUsers.includes(user.userName)
                    ? 'bg-teal-600 border-teal-600'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {selectedUsers.includes(user.userName) && (
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Selected Total Display */}
        {selectedUsers.length > 0 && (
          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">You will pay:</span>
              <span className="text-lg font-bold text-gray-800">
                ${calculateSelectedTotal().toFixed(2)}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              For: {selectedUsers.join(', ')}
            </p>
          </div>
        )}

        {/* Pay Button */}
        <button 
          onClick={handlePayYourPart}
          disabled={selectedUsers.length === 0}
          className={`w-full py-4 rounded-lg font-semibold text-lg transition-colors ${
            selectedUsers.length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-teal-700 text-white hover:bg-teal-800'
          }`}
        >
          Pay your part
        </button>

        {/* Help Text */}
        {selectedUsers.length === 0 && (
          <p className="text-center text-gray-500 text-sm mt-4">
            Select who you want to pay for from the list above
          </p>
        )}
      </div>
    </div>
  );
}