"use client";

import { useTable } from "../context/TableContext";
import { useTableNavigation } from "../hooks/useTableNavigation";
import MenuHeader from "./MenuHeader";
import { getRestaurantData } from "../utils/restaurantData";
import MenuHeaderBack from "./MenuHeaderBack";

// Tipos para el estado de los items
type OrderItemStatus = "En preparación" | "En camino" | "Entregado";

// Función para asignar estado aleatorio (simulando el proceso real)
const getRandomStatus = (): OrderItemStatus => {
  const statuses: OrderItemStatus[] = [
    "En preparación",
    "En camino",
    "Entregado",
  ];
  return statuses[Math.floor(Math.random() * statuses.length)];
};

export default function OrderStatus() {
  const { state, refreshOrders } = useTable();
  const { goBack, navigateWithTable } = useTableNavigation();
  const restaurantData = getRestaurantData();

  const handleRefresh = () => {
    // Solo refrescar si no estamos en modo nueva sesión
    if (!state.skipAutoLoad) {
      refreshOrders();
    }
  };

  const handleCheckOut = () => {
    navigateWithTable("/checkout");
  };

  // Calcular totales de toda la mesa
  const tableTotalItems = state.orders.reduce(
    (sum, order) => sum + order.total_items,
    0
  );
  const tableTotalPrice = state.orders.reduce(
    (sum, order) => sum + parseFloat(order.total_price.toString()),
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a8b9b] to-[#153f43] flex flex-col">
      <MenuHeaderBack
        restaurant={restaurantData}
        tableNumber={state.tableNumber}
      />

      <div className="px-4 w-full flex-1 flex flex-col">
        <div className="left-4 right-4 bg-gradient-to-tl from-[#0a8b9b] to-[#1d727e] rounded-t-4xl translate-y-7 z-0">
          <div className="py-6 px-8 flex flex-col justify-center">
            <h1 className="text-[#e0e0e0] text-xl">Mesa {state.tableNumber}</h1>
            <h2 className="font-bold text-white text-3xl leading-7 mt-2 mb-6">
              Revisa tu cuenta y elige como pagar
            </h2>
          </div>
        </div>

        <div className="flex-1 h-full flex flex-col">
          <div className="bg-white rounded-t-4xl flex-1 z-10 flex flex-col px-6">
            {/* Ordered Items */}
            <div className="w-full mx-auto pb-6">
              <div className="flex justify-between mt-6">
                <h2 className="bg-[#f9f9f9] border border-[#8e8e8e] rounded-full px-3 py-1 text-base font-medium text-black justify-self-center">
                  Orden
                </h2>
                <div>
                  <button
                    onClick={handleRefresh}
                    disabled={state.isLoading || state.skipAutoLoad}
                    className="flex items-center gap-2 text-teal-600 hover:text-teal-800 transition-colors disabled:text-gray-400"
                  >
                    <svg
                      className={`w-5 h-5 ${state.isLoading ? "animate-spin" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    {state.isLoading ? "Cargando..." : "Refrescar"}
                  </button>
                </div>
              </div>

              <div className="text-black font-semibold text-sm flex gap-5 justify-end translate-y-3">
                <span>Cant.</span>
                <span>Precio</span>
              </div>

              {state.orders.length === 0 ? (
                <div className="flex-1 flex items-center justify-center py-8 text-center">
                  <div>
                    <p className="text-black text-2xl">
                      Aún no hay pedidos realizados para esta mesa
                    </p>
                  </div>
                </div>
              ) : (
                <div className="">
                  {state.orders.map((order, orderIndex) => (
                    <div key={order.id}>
                      {order.items.map((item) => {
                        const status = getRandomStatus();

                        return (
                          <div
                            key={`${orderIndex}-${item.id}`}
                            className="py-3 border-b border-[#8e8e8e]"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex-shrink-0 mt-1">
                                  <div className="size-16 bg-gray-300 rounded-sm flex items-center justify-center hover:scale-105 transition-transform duration-200">
                                    {item.images ? (
                                      <img
                                        src={item.images[0]}
                                        alt="Dish preview"
                                        className="w-full h-full object-cover rounded-sm"
                                      />
                                    ) : (
                                      <img
                                        src={"/logo-short-green.webp"}
                                        alt="Logo Xquisito"
                                        className="size-18 object-contain rounded-sm"
                                      />
                                    )}
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-sm text-[#8e8e8e]">
                                    {order.user_name.toUpperCase()}
                                  </h3>
                                  <h4 className="text-base font-medium text-black">
                                    {item.name}
                                  </h4>
                                  <div className="mt-1">
                                    <p className="text-xs text-[#8e8e8e]">
                                      <span className="font-medium">
                                        Status:
                                      </span>
                                      <span
                                        className={`ml-1 ${
                                          status === "Entregado"
                                            ? "text-green-600"
                                            : status === "En camino"
                                              ? "text-blue-600"
                                              : "text-orange-600"
                                        }`}
                                      >
                                        {status}
                                      </span>
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right flex gap-10">
                                <p className="text-black">{item.quantity}</p>
                                <p className="font-medium text-black">
                                  ${(item.price * item.quantity).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}

                  {/* Table Total */}
                  <div className="mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-black">
                        Total
                      </span>
                      <span className="font-bold text-black">
                        ${tableTotalPrice.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-sm text-black mt-1">
                      {tableTotalItems} articulos para {state.orders.length}{" "}
                      ordenes
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Check Out Button */}
            {state.orders.length > 0 && (
              <div className="w-full mb-6">
                <button
                  onClick={handleCheckOut}
                  className="bg-black hover:bg-stone-950 w-full text-white py-3 rounded-full font-medium cursor-pointer transition-colors"
                >
                  Continuar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
