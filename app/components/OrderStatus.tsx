"use client";

import { useTable } from "../context/TableContext";
import { useTableNavigation } from "../hooks/useTableNavigation";
import { useGuest } from "../context/GuestContext";
import { SignInButton, useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import MenuHeader from "./MenuHeader";
import { getRestaurantData } from "../utils/restaurantData";
import { saveUrlParams } from "../utils/urlParams";
import MenuHeaderBack from "./MenuHeaderBack";
import { ChevronRight, X, Loader2, Eye, EyeClosed } from "lucide-react";

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
      if (isLoaded && user) {
        // User is authenticated, redirect directly to payment options
        navigateWithTable("/payment-options");
      } else {
        // User is guest, show authentication modal
        //setShowAuthModal(true);
        navigateWithTable("/sign-in");
      }
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleContinueAsGuest = () => {
    try {
      const tableNum = state.tableNumber?.toString() || undefined;
      setAsGuest(tableNum);
      setShowAuthModal(false);
      navigateWithTable("/payment-options");
    } catch (error) {
      console.error("❌ Error initializing guest session:", error);
      navigateWithTable("/payment-options");
    }
  };

  const handleSignUp = () => {
    saveUrlParams();
    setShowAuthModal(false);
    navigateWithTable("/sign-up");
  };

  const handleSignIn = () => {
    saveUrlParams();
    setShowAuthModal(false);
    navigateWithTable("/sign-in");
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
          <div className="bg-white rounded-t-4xl flex-1 z-5 flex flex-col px-6">
            {/* Table Closed Message */}
            {state.tableSummary?.data?.data?.status === "paid" ? (
              <div className="flex-1 flex items-center justify-center py-8 text-center">
                <div>
                  <div className="mb-4">
                    <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-green-600"
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
                  <h2 className="text-2xl font-bold text-green-600 mb-2">
                    ¡Mesa Cerrada!
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Todas las órdenes han sido pagadas exitosamente
                  </p>
                  <button
                    onClick={handleRefresh}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full transition-colors"
                  >
                    Actualizar
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Ordered Items */}
                <div className="w-full mx-auto pb-6">
                  <div className="flex justify-between mt-6">
                    <h2 className="bg-[#f9f9f9] border border-[#8e8e8e] rounded-full px-3 py-1 text-base font-medium text-black justify-self-center">
                      Orden
                    </h2>
                    <div>
                      <button
                        onClick={handleRefresh}
                        disabled={state.isLoading}
                        className="flex items-center gap-2 text-teal-600 hover:text-teal-800 transition-colors disabled:text-gray-400 cursor-pointer"
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

                  {state.isLoading ? (
                    <div className="flex-1 flex items-center justify-center py-8 text-center">
                      <div>
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                        <p className="text-black text-xl">
                          Cargando pedidos...
                        </p>
                      </div>
                    </div>
                  ) : unpaidDishes.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center py-8 text-center">
                      <div>
                        <p className="text-black text-2xl">
                          Aún no hay pedidos realizados para esta mesa
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="">
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
                          <div
                            key={dish.dish_order_id}
                            className="py-3 border-b border-[#8e8e8e]"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex-shrink-0 mt-1">
                                  <div className="size-16 bg-gray-300 rounded-sm flex items-center justify-center hover:scale-105 transition-transform duration-200">
                                    <img
                                      src={"/logo-short-green.webp"}
                                      alt="Logo Xquisito"
                                      className="size-18 object-contain rounded-sm"
                                    />
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-sm text-[#8e8e8e]">
                                    {dish.guest_name.toUpperCase()}
                                  </h3>
                                  <h4 className="text-base font-medium text-black">
                                    {dish.item}
                                  </h4>
                                  <div className="mt-1">
                                    <div className="space-y-1">
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
                              </div>
                              <div className="text-right flex gap-10">
                                <p className="text-black">{dish.quantity}</p>
                                <p className="font-medium text-black">
                                  ${dish.total_price.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Table Total */}
                      <div className="mt-4 space-y-3 border-t pt-4">
                        {/* Total de la Mesa */}
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-black">
                            Total de la Mesa
                          </span>
                          <span className="font-bold text-black">
                            ${tableTotalPrice.toFixed(2)}
                          </span>
                        </div>

                        {/* Pagado */}
                        {tablePaidAmount > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-green-600 font-medium">
                              Pagado:
                            </span>
                            <span className="text-green-600 font-medium">
                              ${tablePaidAmount.toFixed(2)}
                            </span>
                          </div>
                        )}

                        {/* Restante por pagar */}
                        <div className="flex justify-between items-center">
                          <span className="text-orange-600 font-bold">
                            Restante por pagar:
                          </span>
                          <span className="text-orange-600 font-bold">
                            ${tableRemainingAmount.toFixed(2)}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 mt-2">
                          {tableTotalItems} platillos en total
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Paid Orders Section */}
                {paidDishes.length > 0 && (
                  <div className="w-full mx-auto pb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="bg-teal-50/50 border border-teal-600 rounded-full px-3 py-1 text-base font-medium text-[#2e7d32] justify-self-center">
                        Artículos Pagados
                      </h2>
                      <button
                        onClick={() => setShowPaidOrders(!showPaidOrders)}
                        className="text-teal-600 hover:text-teal-800 transition-colors cursor-pointer"
                      >
                        {showPaidOrders ? (
                          <div className="flex items-center gap-1">
                            <EyeClosed className="size-4" />
                            Ocultar
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Eye className="size-4" />
                            Ver
                          </div>
                        )}
                      </button>
                    </div>

                    {showPaidOrders && (
                      <>
                        <div className="text-black font-semibold text-sm flex gap-5 justify-end translate-y-3">
                          <span>Cant.</span>
                          <span>Precio</span>
                        </div>

                        <div className="">
                          {paidDishes.map((dish, dishIndex) => (
                            <div
                              key={`paid-${dish.dish_order_id}`}
                              className="py-3 border-b border-[#8e8e8e]"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="flex-shrink-0 mt-1">
                                    <div className="size-16 bg-gray-300 rounded-sm flex items-center justify-center hover:scale-105 transition-transform duration-200">
                                      <img
                                        src={"/logo-short-green.webp"}
                                        alt="Logo Xquisito"
                                        className="size-18 object-contain rounded-sm"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-sm text-[#8e8e8e]">
                                      {dish.guest_name.toUpperCase()}
                                    </h3>
                                    <h4 className="text-base font-medium text-black">
                                      {dish.item}
                                    </h4>
                                    <div className="mt-1 flex items-center gap-2">
                                      <p className="text-xs text-teal-600 font-medium">
                                        ✓ PAGADO
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right flex gap-10">
                                  <p className="text-black">{dish.quantity}</p>
                                  <p className="font-medium text-black">
                                    ${dish.total_price.toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}

                          {/* Paid Orders Total */}
                          <div className="pt-4">
                            <div className="flex justify-between items-center text-black">
                              <span className="text-lg font-bold">
                                Total Pagado
                              </span>
                              <span className="font-bold">
                                ${paidTotalPrice.toFixed(2)}
                              </span>
                            </div>
                            <p className="text-sm mt-1 text-black">
                              {paidTotalItems} platillos pagados
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Check Out Button */}
                {unpaidDishes.length > 0 && tableRemainingAmount > 0 && (
                  <div className="w-full mb-6">
                    <button
                      onClick={handleCheckOut}
                      disabled={
                        isProcessingPayment || tableRemainingAmount <= 0
                      }
                      className={`w-full py-3 rounded-full font-medium transition-colors text-white ${
                        !isProcessingPayment && tableRemainingAmount > 0
                          ? "bg-black hover:bg-stone-950 cursor-pointer"
                          : "bg-stone-800 cursor-not-allowed"
                      }`}
                    >
                      {isProcessingPayment ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                      ) : tableRemainingAmount <= 0 ? (
                        "¡Cuenta pagada completamente!"
                      ) : (
                        `Pagar $${tableRemainingAmount.toFixed(2)}`
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Authentication Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-50">
          <div className="bg-white rounded-2xl shadow-lg p-5 w-full max-w-md relative">
            {/* Close button */}
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors p-0.5 hover:bg-gray-100 rounded-md cursor-pointer"
            >
              <X className="size-6" />
            </button>

            {/* Content */}
            <div className="mt-8">
              {/*<h1 className="text-xl font-medium text-black text-center mb-6">
                ¡Bienvenido!
              </h1>*/}

              <div className="space-y-2">
                {/* Sign In Button */}
                <button
                  onClick={handleSignIn}
                  className="flex items-center justify-between bg-white border border-gray-700 hover:bg-gray-100 w-full text-gray-700 py-3 px-4 rounded-lg font-medium cursor-pointer transition-colors"
                >
                  <span>Iniciar sesión</span>
                  <ChevronRight className="size-4 text-white" />
                </button>
                {/*
                  <SignInButton
                    mode="modal"
                    fallbackRedirectUrl={`/payment-options${state.tableNumber ? `?table=${state.tableNumber}` : ""}`}
                    forceRedirectUrl={`/payment-options${state.tableNumber ? `?table=${state.tableNumber}` : ""}`}
                  >
                    <button className="flex items-center justify-between bg-white border border-gray-700 hover:bg-gray-100 w-full text-gray-700 py-3 px-4 rounded-lg font-medium cursor-pointer transition-colors">
                      <span>Iniciar sesión</span>
                      <ChevronRight className="size-4 text-white" />
                    </button>
                  </SignInButton>
                */}
                {/* Sign Up Button */}
                {/*
                <button
                  onClick={handleSignUp}
                  className="flex items-center justify-between bg-black hover:bg-stone-950 w-full text-white py-3 px-4 rounded-full font-medium cursor-pointer transition-colors"
                >
                  <span>Sign Up</span>
                  <ChevronRight className="size-4 text-white" />
                </button>*/}

                {/* Continue as Guest */}
                <button
                  onClick={handleContinueAsGuest}
                  className="flex items-center justify-between bg-white border border-gray-700 hover:bg-gray-100 w-full text-gray-700 py-3 px-4 rounded-lg font-medium cursor-pointer transition-colors"
                >
                  <span>Coninuar como invitado</span>
                  <ChevronRight className="size-4 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
