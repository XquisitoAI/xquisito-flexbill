'use client';

import { useCart } from "../context/CartContext";
import { useRouter } from 'next/navigation';
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
  const { state } = useCart();
  const router = useRouter();
  const restaurantData = getRestaurantData();

  const handleGoBack = () => {
    router.back();
  };

  const handleCheckOut = () => {
    // Aquí iría la lógica para el checkout
    console.log('Processing checkout...', state.items);
    alert('¡Gracias por tu orden! Procesando checkout...');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MenuHeader restaurant={restaurantData} />

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

      {/* Ordered Items */}
      <div className="max-w-md mx-auto px-4 pb-32">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-medium text-gray-800 text-center">Ordered Items</h2>
          </div>
          
          {state.items.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-gray-500">No items ordered yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {state.items.map((item) => {
                const status = getRandomStatus();
                
                return (
                  <div key={item.id} className="px-6 py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                            <span className="text-yellow-600 text-xs">⭐</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-medium text-gray-800">
                            {item.name}
                          </h3>
                          <div className="mt-1 space-y-1">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Status:</span> 
                              <span className={`ml-1 ${
                                status === 'Delivered' ? 'text-green-600' :
                                status === 'On its Way' ? 'text-blue-600' :
                                'text-orange-600'
                              }`}>
                                {status}
                              </span>
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Ordered by: {state.userName.toUpperCase()}</span>
                            </p>
                          </div>
                          {item.quantity > 1 && (
                            <p className="text-xs text-gray-500 mt-1">
                              Quantity: {item.quantity}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-medium text-gray-800">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Order Total */}
              <div className="px-6 py-4 bg-gray-50">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-800">Order Total</span>
                  <span className="text-lg font-bold text-gray-800">
                    ${state.totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Check Out Button - Fixed at bottom */}
      {state.items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="max-w-md mx-auto">
            <button 
              onClick={handleCheckOut}
              className="w-full bg-teal-700 text-white py-4 rounded-lg font-medium hover:bg-teal-800 transition-colors"
            >
              Check Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}