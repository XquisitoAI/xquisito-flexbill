'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTable } from "../context/TableContext";
import { useTableNavigation } from "../hooks/useTableNavigation";
import { useGuest, useIsGuest } from "../context/GuestContext";
import MenuHeader from "../components/MenuHeader";
import { getRestaurantData } from "../utils/restaurantData";

interface SelectableItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  description?: string;
  image?: string;
  userName: string;
  isCurrentUser: boolean;
  isSelected: boolean;
}

export default function SelectItemsPage() {
  const { state } = useTable();
  const { goBack, navigateWithTable } = useTableNavigation();
  const router = useRouter();
  const restaurantData = getRestaurantData();
  const isGuest = useIsGuest();
  const { guestId, tableNumber } = useGuest();
  
  // Estado para items seleccionados
  const [selectableItems, setSelectableItems] = useState<SelectableItem[]>([]);
  
  // Procesar todas las órdenes y items para mostrarlos
  useEffect(() => {
    const allItems: SelectableItem[] = [];
    
    // Agregar items de órdenes confirmadas
    state.orders.forEach(order => {
      order.items.forEach(item => {
        allItems.push({
          ...item,
          userName: order.user_name,
          isCurrentUser: order.user_name === state.currentUserName,
          isSelected: false
        });
      });
    });
    
    // Agregar items del carrito actual si existe
    if (state.currentUserItems.length > 0) {
      state.currentUserItems.forEach(item => {
        allItems.push({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          description: item.description,
          image: item.image,
          userName: state.currentUserName || 'You',
          isCurrentUser: true,
          isSelected: false
        });
      });
    }
    
    setSelectableItems(allItems);
  }, [state.orders, state.currentUserItems, state.currentUserName]);

  const handleBack = () => {
    router.back();
  };

  const handleItemSelection = (index: number) => {
    setSelectableItems(prev => 
      prev.map((item, i) => {
        if (i === index && item.isCurrentUser) {
          return { ...item, isSelected: !item.isSelected };
        }
        return item;
      })
    );
  };

  const getSelectedItems = () => {
    return selectableItems.filter(item => item.isSelected);
  };

  const calculateSelectedTotal = () => {
    return getSelectedItems().reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getUserItems = (userName: string) => {
    return selectableItems.filter(item => item.userName === userName);
  };

  const getUniqueUsers = () => {
    const users = [...new Set(selectableItems.map(item => item.userName))];
    return users.sort((a, b) => {
      // Current user first
      if (a === state.currentUserName) return -1;
      if (b === state.currentUserName) return 1;
      return a.localeCompare(b);
    });
  };

  const handlePayForSelected = () => {
    const selectedItems = getSelectedItems();
    if (selectedItems.length === 0) {
      alert('Please select at least one item to pay for');
      return;
    }

    const selectedTotal = calculateSelectedTotal();
    const itemNames = selectedItems.map(item => `${item.name} (${item.quantity})`);
    
    // Navegar a la página de agregar propina con los items seleccionados
    const queryParams = new URLSearchParams({
      amount: selectedTotal.toString(),
      users: [state.currentUserName || 'You'].join(','),
      items: itemNames.join(', ')
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
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Select Your Items</h1>
          <p className="text-gray-600">Choose the items you want to pay for from your orders</p>
        </div>

        {/* Guest Indicator */}
        {isGuest && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-blue-800 font-medium text-sm">Item Selection</p>
                <p className="text-blue-600 text-xs">
                  {tableNumber ? `Table ${tableNumber}` : 'Guest session'} • Only your items can be selected
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Items by User */}
        <div className="space-y-6 mb-6">
          {getUniqueUsers().map((userName) => {
            const userItems = getUserItems(userName);
            const isCurrentUser = userName === state.currentUserName;
            const userTotal = userItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            
            return (
              <div key={userName} className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* User Header */}
                <div className={`px-4 py-3 border-b border-gray-200 ${
                  isCurrentUser ? 'bg-teal-50' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${
                        isCurrentUser ? 'text-teal-800' : 'text-gray-800'
                      }`}>
                        {isCurrentUser ? `${userName} (You)` : userName}
                      </span>
                      {isCurrentUser && (
                        <span className="px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded">
                          Your Items
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-600">
                      ${userTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* User Items */}
                <div className="p-4 space-y-3">
                  {userItems.map((item, index) => {
                    const globalIndex = selectableItems.findIndex(si => si === item);
                    return (
                      <div 
                        key={`${item.id}-${userName}-${index}`}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                          isCurrentUser 
                            ? item.isSelected
                              ? 'border-teal-300 bg-teal-50'
                              : 'border-gray-200 bg-white hover:border-teal-200 cursor-pointer'
                            : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-75'
                        }`}
                        onClick={() => isCurrentUser && handleItemSelection(globalIndex)}
                      >
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-gray-800">{item.name}</h4>
                              {item.description && (
                                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                              )}
                              <div className="flex items-center gap-3 mt-2">
                                <span className="text-sm text-gray-500">Qty: {item.quantity}</span>
                                <span className="text-sm font-medium text-gray-700">
                                  ${(item.price * item.quantity).toFixed(2)}
                                </span>
                              </div>
                            </div>
                            
                            {/* Selection checkbox */}
                            <div className="ml-3">
                              {isCurrentUser ? (
                                <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                                  item.isSelected
                                    ? 'bg-teal-600 border-teal-600'
                                    : 'border-gray-300 hover:border-teal-400'
                                }`}>
                                  {item.isSelected && (
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                              ) : (
                                <div className="w-6 h-6 rounded border-2 border-gray-200 bg-gray-100 flex items-center justify-center">
                                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {!isCurrentUser && (
                  <div className="px-4 pb-3">
                    <p className="text-xs text-gray-500 italic">
                      You can only select your own items for payment
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Items Summary */}
        {getSelectedItems().length > 0 && (
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-teal-800 mb-2">Selected Items ({getSelectedItems().length})</h3>
            <div className="space-y-1 mb-3">
              {getSelectedItems().map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-teal-700">{item.name} × {item.quantity}</span>
                  <span className="text-teal-700 font-medium">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-teal-200 pt-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-teal-800">Total:</span>
                <span className="font-bold text-lg text-teal-800">
                  ${calculateSelectedTotal().toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Pay Button */}
        <button 
          onClick={handlePayForSelected}
          disabled={getSelectedItems().length === 0}
          className={`w-full py-4 rounded-lg font-semibold text-lg transition-colors ${
            getSelectedItems().length > 0
              ? 'bg-teal-700 text-white hover:bg-teal-800'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {getSelectedItems().length > 0 
            ? `Pay for Selected Items: $${calculateSelectedTotal().toFixed(2)}`
            : 'Select items to continue'
          }
        </button>

        {/* Help Text */}
        {getSelectedItems().length === 0 && (
          <p className="text-center text-gray-500 text-sm mt-4">
            Tap on your items to select them for payment
          </p>
        )}
      </div>
    </div>
  );
}