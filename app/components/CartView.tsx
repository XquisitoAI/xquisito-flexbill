'use client';

import { useTable } from "../context/TableContext";
import { useTableNavigation } from "../hooks/useTableNavigation";
import MenuHeader from "./MenuHeader";
import { getRestaurantData } from "../utils/restaurantData";

export default function CartView() {
  const { state } = useTable();
  const { navigateWithTable, goBack } = useTableNavigation();
  const restaurantData = getRestaurantData();

  const handleGoBack = () => {
    goBack();
  };

  const handleOrder = () => {
    // Navegamos a la vista de usuario para capturar su nombre
    navigateWithTable('/user');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a8b9b] to-[#153f43] flex flex-col">
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

      <div className="px-4 w-full flex-1 flex flex-col">
        <div className="left-4 right-4 bg-gradient-to-tl from-[#0a8b9b] to-[#1d727e] rounded-t-4xl translate-y-7 z-0">
          {state.currentUserItems.length === 0 ? (
            <div className="py-6 px-8 flex flex-col justify-center">
              <h1 className="text-[#e0e0e0] text-xl">Mesa</h1>
              <h2 className="font-bold text-white text-3xl leading-7 mt-2 mb-6">El carrito está vacío, agrega items y disfruta</h2>
            </div>
          ):(
            <div className="py-6 px-8 flex flex-col justify-center">
              <h1 className="text-[#e0e0e0] text-xl">Mesa</h1>
              <h2 className="font-bold text-white text-3xl leading-7 mt-2 mb-6">Todo listo, revisa tu pedido y confirma</h2>
            </div>
          )}
        </div>

        <div className="flex-1 h-full flex flex-col">
          {/* Cart Items */}
          <div className="bg-white rounded-t-4xl flex-1 z-10 flex flex-col">
            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              <div className="pt-6">
                  <h2 className="bg-[#f9f9f9] border border-[#8e8e8e]/50 rounded-full px-3 py-1 text-base font-medium text-black justify-self-center">Mi carrito</h2>

                {state.currentUserItems.length === 0 ? (
                  <div className="px-6 py-8 text-center">
                    <div className="text-gray-400 text-4xl mb-4">🛒</div>
                    <p className="text-gray-500">El carrito está vacío</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#8e8e8e] px-6">
                    {state.currentUserItems.map((item) => (
                      <div key={item.id} className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                            <div
                              className="size-16 bg-gray-300 rounded-sm flex items-center justify-center hover:scale-105 transition-transform duration-200"
                            >
                              {item.images[0] ? (
                                <img src={item.images[0]} alt="Dish preview"  className="w-full h-full object-cover rounded-xl"/>
                              ) : (
                                <img src={'/logo-short-green.webp'} alt="Logo Xquisito" className="size-18 object-contain"/>
                              )}

                            </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-medium text-gray-800 truncate">
                                {item.name}
                              </h3>
                            </div>
                          </div>
                          <div className="text-right flex items-center justify-center gap-8">
                            <p className="text-base text-black">
                              {item.quantity}
                            </p>
                            <p className="text-base font-medium text-black">
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

            {/* Fixed bottom section */}
            {state.currentUserItems.length > 0 && (
              <div className="bg-white border-t border-gray-200">
                <div className="w-full flex justify-between text-black px-6 text-base font-semibold mb-6 pt-6">
                  <span>Total</span>
                  <p>
                    ${state.currentUserTotalPrice} MXN
                  </p>
                </div>

                <div className="text-black px-6">
                  <span className="font-bold text-xl">
                    ¿Algo que debamos saber?
                  </span>
                  <textarea name="" id="" className="h-24 text-base w-full bg-[#f9f9f9] border border-[#bfbfbf] px-3 py-2 rounded-lg resize-none focus:outline-none mt-2" placeholder="Alergias, instrucciones especiales, comentarios..."></textarea>
                </div>

                <div className="p-4 w-full">
                  <button
                    onClick={handleOrder}
                    className="bg-black hover:bg-stone-950 w-full text-white py-3 rounded-full cursor-pointer transition-colors"
                  >
                    Ordenar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}