"use client";

import { useTable } from "../context/TableContext";
import { useTableNavigation } from "../hooks/useTableNavigation";
import { useGuest } from "../context/GuestContext";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { getRestaurantData } from "../utils/restaurantData";
import { Loader2, Eye, EyeClosed, Loader } from "lucide-react";
import MenuHeaderBackOrder from "./headers/MenuHeaderBackOrder";

export default function OrderStatus() {
  const { state, loadTableData } = useTable();
  const { goBack, navigateWithTable } = useTableNavigation();
  const { setAsGuest } = useGuest();
  const { user, isLoaded } = useUser();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showPaidOrders, setShowPaidOrders] = useState(false);
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  const restaurantData = getRestaurantData();

  const handleRefresh = () => {
    loadTableData();
  };

  const handleCheckOut = async () => {
    setIsProcessingPayment(true);
    try {
      // Permitir que tanto usuarios autenticados como invitados accedan a payment-options
      navigateWithTable("/payment-options");

      // if (isLoaded && user) {
      //   // User is authenticated, redirect directly to payment options
      //   navigateWithTable("/payment-options");
      // } else {
      //   // User is guest, show authentication modal
      //   //setShowAuthModal(true);
      //   navigateWithTable("/sign-in");
      // }
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Filtrar platillos pagados y no pagados
  const unpaidDishes = Array.isArray(state.dishOrders)
    ? state.dishOrders.filter((dish) => dish.payment_status === "not_paid")
    : [];
  const paidDishes = Array.isArray(state.dishOrders)
    ? state.dishOrders.filter((dish) => dish.payment_status === "paid")
    : [];

  // Calcular totales de la mesa usando tableSummary si está disponible
  const tableTotalItems =
    state.tableSummary?.data?.data?.no_items || state.dishOrders?.length || 0;
  const tableTotalPrice =
    state.tableSummary?.data?.data?.total_amount ||
    state.dishOrders?.reduce((sum, dish) => sum + dish.total_price, 0) ||
    0;
  const tablePaidAmount =
    state.tableSummary?.data?.data?.paid_amount ||
    paidDishes.reduce((sum, dish) => sum + dish.total_price, 0) ||
    0;
  const tableRemainingAmount =
    state.tableSummary?.data?.data?.remaining_amount ||
    unpaidDishes.reduce((sum, dish) => sum + dish.total_price, 0) ||
    0;

  // Calcular totales de platillos pagados
  const paidTotalItems = paidDishes.length;
  const paidTotalPrice = paidDishes.reduce(
    (sum, dish) => sum + dish.total_price,
    0
  );

  // Cargar datos cuando se monta el componente o cambia el número de mesa
  useEffect(() => {
    console.log("🔍 OrderStatus useEffect - tableNumber:", state.tableNumber);
    console.log("🔍 OrderStatus useEffect - dishOrders:", state.dishOrders);
    console.log("🔍 OrderStatus useEffect - tableSummary:", state.tableSummary);

    if (state.tableNumber && !hasLoadedInitialData) {
      console.log("📡 Loading table data...");
      setHasLoadedInitialData(true);

      // Call API directly to debug
      loadTableData()
        .then(() => {
          console.log("✅ loadTableData completed");
          console.log("📊 Final state after load:", {
            dishOrders: state.dishOrders,
            tableSummary: state.tableSummary,
            error: state.error,
          });
        })
        .catch((error) => {
          console.error("❌ loadTableData failed:", error);
        });
    }
  }, [state.tableNumber]); // Removed loadTableData from dependencies

  // Debug: Log state changes only when data actually changes
  useEffect(() => {
    if (state.dishOrders?.length > 0 || state.tableSummary || state.error) {
      console.log("🔄 State updated:", {
        tableNumber: state.tableNumber,
        dishOrdersCount: state.dishOrders?.length || 0,
        tableSummary: state.tableSummary,
        isLoading: state.isLoading,
        error: state.error,
        unpaidDishesCount: unpaidDishes.length,
        paidDishesCount: paidDishes.length,
      });
    }
  }, [state.dishOrders?.length, state.tableSummary, state.error]); // Only log meaningful changes

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a8b9b] to-[#153f43] flex flex-col">
      <MenuHeaderBackOrder
        restaurant={restaurantData}
        tableNumber={state.tableNumber}
      />

      <div className="px-4 md:px-6 lg:px-8 w-full flex-1 flex flex-col">
        <div className="left-4 right-4 bg-gradient-to-tl from-[#0a8b9b] to-[#1d727e] rounded-t-4xl translate-y-7 z-0">
          <div className="py-6 md:py-8 lg:py-10 px-8 md:px-10 lg:px-12 flex flex-col justify-center">
            <h1 className="font-medium text-[#e0e0e0] text-xl md:text-2xl lg:text-3xl">
              Mesa {state.tableNumber}
            </h1>
            <h2 className="font-medium text-white text-3xl md:text-4xl lg:text-5xl leading-7 md:leading-9 lg:leading-tight mt-2 md:mt-3 mb-6 md:mb-8">
              Revisa tu cuenta y elige como pagar
            </h2>
          </div>
        </div>

        <div className="flex-1 h-full flex flex-col overflow-hidden relative">
          <div className="bg-white rounded-t-4xl flex-1 z-5 flex flex-col overflow-hidden">
            {/* Table Closed Message */}
            {state.tableSummary?.data?.data?.status === "paid" ? (
              <div className="flex-1 flex items-center justify-center py-8 md:py-12 text-center">
                <div>
                  <div className="mb-4 md:mb-6">
                    <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-medium text-green-600 mb-2 md:mb-3">
                    ¡Mesa Cerrada!
                  </h2>
                  <p className="text-gray-600 text-base md:text-lg lg:text-xl mb-4 md:mb-6">
                    Todas las órdenes han sido pagadas exitosamente
                  </p>
                  <button
                    onClick={handleRefresh}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 md:px-8 lg:px-10 py-2 md:py-3 lg:py-4 rounded-full transition-colors text-base md:text-lg lg:text-xl"
                  >
                    Actualizar
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto px-6 md:px-8 lg:px-10 pb-[180px] md:pb-[200px] lg:pb-[220px]">
                  {/* Ordered Items */}
                  <div className="w-full mx-auto pb-6 md:pb-8">
                    <div className="flex justify-center items-start relative mt-6 md:mt-8">
                      <h2 className="bg-[#f9f9f9] border border-[#8e8e8e] rounded-full px-3 md:px-4 lg:px-5 py-1 md:py-1.5 text-base md:text-lg lg:text-xl font-medium text-black">
                        Cuenta Compartida
                      </h2>
                      <div className="absolute right-0">
                        <button
                          onClick={handleRefresh}
                          disabled={state.isLoading}
                          className="flex items-center gap-2 text-teal-600 hover:text-teal-800 transition-colors disabled:text-gray-400 cursor-pointer"
                        >
                          <svg
                            className={`w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 ${state.isLoading ? "animate-spin" : ""}`}
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
                        </button>
                      </div>
                    </div>

                    {state.isLoading ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader className="h-8 w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 animate-spin text-teal-600" />
                      </div>
                    ) : unpaidDishes.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center py-8 md:py-12 text-center">
                        <div>
                          <p className="text-black text-2xl md:text-3xl lg:text-4xl">
                            Aún no hay pedidos realizados para esta mesa
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-black font-medium text-sm md:text-base lg:text-lg flex gap-10 md:gap-12 lg:gap-14 justify-end translate-y-4">
                          <span>Cant.</span>
                          <span>Precio</span>
                        </div>
                        <div className="divide-y divide-[#8e8e8e]/50">
                          {unpaidDishes.map((dish, dishIndex) => {
                            const statusMap = {
                              pending: "En preparación",
                              preparing: "En preparación",
                              ready: "En camino",
                              delivered: "Entregado",
                            };
                            const status =
                              statusMap[dish.status] || "En preparación";

                            return (
                              <div key={dish.dish_order_id} className="py-3 md:py-4 lg:py-5">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3 md:gap-4 lg:gap-5">
                                    <div className="flex-shrink-0 mt-1">
                                      <div className="size-16 md:size-20 lg:size-24 bg-gray-300 rounded-sm md:rounded-md flex items-center justify-center hover:scale-105 transition-transform duration-200">
                                        <img
                                          src={
                                            dish.images?.[0] ??
                                            "/logo-short-green.webp"
                                          }
                                          alt="Dish Image"
                                          className="w-full h-full object-cover rounded-sm md:rounded-md"
                                        />
                                      </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h3 className="text-sm md:text-base lg:text-lg text-[#8e8e8e]">
                                        {dish.guest_name.toUpperCase()}
                                      </h3>
                                      <h4 className="text-base md:text-lg lg:text-xl text-black capitalize">
                                        {dish.item}
                                      </h4>
                                      {dish.custom_fields &&
                                        dish.custom_fields.length > 0 && (
                                          <div className="text-xs md:text-sm lg:text-base text-gray-400 space-y-0.5">
                                            {dish.custom_fields.map(
                                              (field: any, idx: number) => (
                                                <div key={idx}>
                                                  {field.selectedOptions
                                                    .filter(
                                                      (opt: any) =>
                                                        opt.price > 0
                                                    )
                                                    .map(
                                                      (
                                                        opt: any,
                                                        optIdx: number
                                                      ) => (
                                                        <p key={optIdx}>
                                                          {opt.optionName} $
                                                          {opt.price.toFixed(2)}
                                                        </p>
                                                      )
                                                    )}
                                                </div>
                                              )
                                            )}
                                          </div>
                                        )}
                                      {/*
                                      <div className="mt-1">
                                        <div className="space-y-1">
                                          <p className="text-xs text-[#8e8e8e]">
                                            <span>Status:</span>
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
                                      </div>*/}
                                    </div>
                                  </div>
                                  <div className="text-right flex gap-10 md:gap-12 lg:gap-14">
                                    <p className="text-black text-base md:text-lg lg:text-xl">
                                      {dish.quantity}
                                    </p>
                                    <p className="text-black w-14 md:w-16 lg:w-20 text-base md:text-lg lg:text-xl">
                                      ${(dish.total_price / dish.quantity).toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Paid Orders Section */}
                  {paidDishes.length > 0 && (
                    <div className="w-full mx-auto pb-6 md:pb-8">
                      <div className="flex justify-between items-center mb-4 md:mb-6">
                        <h2 className="bg-teal-50/50 border border-teal-600 rounded-full px-3 md:px-4 lg:px-5 py-1 md:py-1.5 text-base md:text-lg lg:text-xl font-medium text-[#2e7d32] justify-self-center">
                          Artículos Pagados
                        </h2>
                        <button
                          onClick={() => setShowPaidOrders(!showPaidOrders)}
                          className="text-teal-600 hover:text-teal-800 transition-colors cursor-pointer text-sm md:text-base lg:text-lg"
                        >
                          {showPaidOrders ? (
                            <div className="flex items-center gap-1 md:gap-1.5">
                              <EyeClosed className="size-4 md:size-5 lg:size-6" />
                              Ocultar
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 md:gap-1.5">
                              <Eye className="size-4 md:size-5 lg:size-6" />
                              Ver
                            </div>
                          )}
                        </button>
                      </div>

                      {showPaidOrders && (
                        <>
                          <div className="text-black font-medium text-sm md:text-base lg:text-lg flex gap-5 md:gap-6 lg:gap-7 justify-end translate-y-3">
                            <span>Cant.</span>
                            <span>Precio</span>
                          </div>

                          <div className="divide-y divide-[#8e8e8e]/50">
                            {paidDishes.map((dish, dishIndex) => (
                              <div
                                key={`paid-${dish.dish_order_id}`}
                                className="py-3 md:py-4 lg:py-5"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3 md:gap-4 lg:gap-5">
                                    <div className="flex-shrink-0 mt-1">
                                      <div className="size-16 md:size-20 lg:size-24 bg-gray-300 rounded-sm md:rounded-md flex items-center justify-center hover:scale-105 transition-transform duration-200">
                                        <img
                                          src={
                                            dish.images?.[0] ??
                                            "/logo-short-green.webp"
                                          }
                                          alt="Logo Xquisito"
                                          className="size-18 md:size-20 lg:size-22 object-contain rounded-sm md:rounded-md"
                                        />
                                      </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h3 className="text-sm md:text-base lg:text-lg text-[#8e8e8e]">
                                        {dish.guest_name.toUpperCase()}
                                      </h3>
                                      <h4 className="text-base md:text-lg lg:text-xl text-black">
                                        {dish.item}
                                      </h4>
                                      {dish.custom_fields &&
                                        dish.custom_fields.length > 0 && (
                                          <div className="text-xs md:text-sm lg:text-base text-gray-400 space-y-0.5">
                                            {dish.custom_fields.map(
                                              (field: any, idx: number) => (
                                                <div key={idx}>
                                                  {field.selectedOptions
                                                    .filter(
                                                      (opt: any) =>
                                                        opt.price > 0
                                                    )
                                                    .map(
                                                      (
                                                        opt: any,
                                                        optIdx: number
                                                      ) => (
                                                        <p key={optIdx}>
                                                          {opt.optionName} $
                                                          {opt.price.toFixed(2)}
                                                        </p>
                                                      )
                                                    )}
                                                </div>
                                              )
                                            )}
                                          </div>
                                        )}
                                      <div className="mt-1 flex items-center gap-2">
                                        <p className="text-xs md:text-sm lg:text-base text-teal-600">
                                          ✓ PAGADO
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right flex gap-10 md:gap-12 lg:gap-14">
                                    <p className="text-black text-base md:text-lg lg:text-xl">
                                      {dish.quantity}
                                    </p>
                                    <p className="text-black text-base md:text-lg lg:text-xl">
                                      ${(dish.total_price / dish.quantity).toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}

                            {/* Paid Orders Total */}
                            <div className="pt-4 md:pt-6">
                              <div className="flex justify-between items-center text-black">
                                <span className="text-lg md:text-xl lg:text-2xl font-medium">
                                  Total Pagado
                                </span>
                                <span className="font-medium text-base md:text-lg lg:text-xl">
                                  ${paidTotalPrice.toFixed(2)}
                                </span>
                              </div>
                              <p className="text-sm md:text-base lg:text-lg mt-1 text-black">
                                {paidTotalItems} platillos pagados
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Fixed bottom section */}
                {unpaidDishes.length > 0 && tableRemainingAmount > 0 && (
                  <div
                    className="fixed bottom-0 left-0 right-0 bg-white mx-4 md:mx-6 lg:mx-8 px-6 md:px-8 lg:px-10 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"
                    style={{
                      paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
                    }}
                  >
                    <div className="mb-4 md:mb-5 lg:mb-6"></div>
                    {/* Table Total */}
                    <div className="space-y-3 md:space-y-4">
                      {/* Total de la Mesa */}
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-black text-base md:text-lg lg:text-xl">Subtotal</span>
                        <span className="font-medium text-black text-base md:text-lg lg:text-xl">
                          ${tableTotalPrice.toFixed(2)} MXN
                        </span>
                      </div>

                      {/* Pagado */}
                      {tablePaidAmount > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-green-600 font-medium text-base md:text-lg lg:text-xl">
                            Pagado:
                          </span>
                          <span className="text-green-600 font-medium text-base md:text-lg lg:text-xl">
                            ${tablePaidAmount.toFixed(2)} MXN
                          </span>
                        </div>
                      )}

                      {/* Restante por pagar */}
                      <div className="flex justify-between items-center">
                        <span className="text-black font-bold text-base md:text-lg lg:text-xl">Total:</span>
                        <span className="text-black font-bold text-base md:text-lg lg:text-xl">
                          ${tableRemainingAmount.toFixed(2)} MXN
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleCheckOut}
                      disabled={
                        isProcessingPayment || tableRemainingAmount <= 0
                      }
                      className={`mt-5 md:mt-6 lg:mt-7 w-full py-3 md:py-4 lg:py-5 rounded-full font-normal transition-colors text-white text-base md:text-lg lg:text-xl ${
                        !isProcessingPayment && tableRemainingAmount > 0
                          ? "bg-gradient-to-r from-[#34808C] to-[#173E44] cursor-pointer"
                          : "bg-gradient-to-r from-[#34808C] to-[#173E44] opacity-50 cursor-not-allowed"
                      }`}
                    >
                      {isProcessingPayment ? (
                        <div className="flex items-center justify-center gap-2 md:gap-3">
                          <Loader2 className="h-5 w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 animate-spin" />
                          <span>Cargando...</span>
                        </div>
                      ) : tableRemainingAmount <= 0 ? (
                        "¡Cuenta pagada completamente!"
                      ) : (
                        "Continuar"
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
