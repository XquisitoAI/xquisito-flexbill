'use client';

import { useTable } from "../context/TableContext";
import { useTableNavigation } from "../hooks/useTableNavigation";
import MenuHeader from "./MenuHeader";
import { getRestaurantData } from "../utils/restaurantData";

// Tipos para el estado de los items
type OrderItemStatus = 'On Kitchen' | 'On its Way' | 'Delivered';

// Función para asignar estado aleatorio (simulando el proceso real)
const getRandomStatus = (): OrderItemStatus => {
  const statuses: OrderItemStatus[] = ['On Kitchen', 'On its Way', 'Delivered'];
  return statuses[Math.floor(Math.random() * statuses.length)];
};

export default function OrderStatus() {
  const { state, refreshOrders } = useTable();
  const { goBack, navigateWithTable } = useTableNavigation();
  const restaurantData = getRestaurantData();

  const handleRefresh = () => {
    refreshOrders();
  };

  const handleGoBack = () => {
    goBack();
  };

  const handleCheckOut = () => {
    navigateWithTable('/checkout');
  };

  // Calcular totales de toda la mesa
  const tableTotalItems = state.orders.reduce((sum, order) => sum + order.total_items, 0);
  const tableTotalPrice = state.orders.reduce((sum, order) => sum + parseFloat(order.total_price.toString()), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <MenuHeader restaurant={restaurantData} tableNumber={state.tableNumber} />

      <div className="max-w-md mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <button 
            onClick={handleGoBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          
          <button
            onClick={handleRefresh}
            disabled={state.isLoading}
            className="flex items-center gap-2 text-teal-600 hover:text-teal-800 transition-colors disabled:text-gray-400"
          >
            <svg className={`w-5 h-5 ${state.isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {state.isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Ordered Items */}
      <div className="max-w-md mx-auto px-4 pb-32">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-medium text-gray-800 text-center">Ordered Items</h2>
          </div>
          
          {state.orders.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-gray-500">No orders placed yet for this table</p>
            </div>
          ) : (
            <div className="space-y-4">
              {state.orders.map((order, orderIndex) => (
                <div key={order.id} className="bg-white rounded-lg shadow-sm">
                  <div className="px-4 py-3 bg-gray-50 rounded-t-lg border-b">
                    <h3 className="font-medium text-gray-800">
                      Order by {order.user_name.toUpperCase()}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {order.items.map((item) => {
                      const status = getRandomStatus();
                      
                      return (
                        <div key={`${orderIndex}-${item.id}`} className="px-4 py-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-1">
                                <div className="w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center">
                                  <span className="text-yellow-600 text-xs">⭐</span>
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-800">
                                  {item.name}
                                </h4>
                                <div className="mt-1">
                                  <p className="text-xs text-gray-600">
                                    <span className="font-medium">Status:</span> 
                                    <span className={`ml-1 ${
                                      status === 'Delivered' ? 'text-green-600' :
                                      status === 'On its Way' ? 'text-blue-600' :
                                      'text-orange-600'
                                    }`}>
                                      {status}
                                    </span>
                                  </p>
                                  {item.quantity > 1 && (
                                    <p className="text-xs text-gray-500">
                                      Quantity: {item.quantity}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-800">
                                ${(item.price * item.quantity).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div className="px-4 py-3 bg-gray-50">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-800">Subtotal</span>
                        <span className="text-sm font-bold text-gray-800">
                          ${parseFloat(order.total_price.toString()).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Table Total */}
              <div className="bg-teal-50 rounded-lg p-4 border-2 border-teal-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-teal-800">Table Total</span>
                  <span className="text-xl font-bold text-teal-800">
                    ${tableTotalPrice.toFixed(2)}
                  </span>
                </div>
                <p className="text-sm text-teal-600 mt-1">
                  {tableTotalItems} items from {state.orders.length} orders
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Check Out Button - Fixed at bottom */}
      {state.orders.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="max-w-md mx-auto">
            <button
              onClick={handleCheckOut}
              className="w-full bg-teal-700 text-white py-4 rounded-lg font-medium hover:bg-teal-800 transition-colors"
            >
              Check Out Table ({tableTotalItems} items - ${tableTotalPrice.toFixed(2)})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}