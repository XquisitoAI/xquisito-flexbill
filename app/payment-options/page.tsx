"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useTable } from "../context/TableContext";
import { useTableNavigation } from "../hooks/useTableNavigation";
import { useUserData } from "../context/UserDataContext";
import { useUserSync } from "../hooks/useUserSync";
import { getRestaurantData } from "../utils/restaurantData";
import { getSavedUrlParams, clearSavedUrlParams } from "../utils/urlParams";
import MenuHeaderBack from "../components/MenuHeaderBack";
import { apiService } from "../utils/api";
import {
  ChevronRight,
  DollarSign,
  ListTodo,
  ReceiptText,
  Users,
  Loader,
} from "lucide-react";

export default function PaymentOptionsPage() {
  const { user } = useUser();
  const { state, loadTableData } = useTable();
  const { navigateWithTable } = useTableNavigation();
  const router = useRouter();
  const restaurantData = getRestaurantData();
  const [isLoading, setIsLoading] = useState(true);
  const [splitStatus, setSplitStatus] = useState<any>(null);

  // Auto-sync user to backend if authenticated
  const { signUpData } = useUserData();
  const { saveUserToBackend, isSyncing, syncStatus, isUserSynced } = useUserSync(signUpData);

  useEffect(() => {
    const savedParams = getSavedUrlParams();
    if (savedParams) {
      router.replace(`/payment-options${savedParams}`);
      clearSavedUrlParams();
    }
  }, [router]);

  // Auto-sync authenticated users to backend
  useEffect(() => {
    if (user && !isUserSynced && !isSyncing && syncStatus !== 'success') {
      console.log('🔄 Payment Options: Auto-syncing new user to backend');
      saveUserToBackend();
    }
  }, [user, isUserSynced, isSyncing, syncStatus, saveUserToBackend]);

  const loadSplitStatus = async () => {
    if (!state.tableNumber) return;

    try {
      const response = await apiService.getSplitPaymentStatus(
        state.tableNumber.toString()
      );
      if (response.success) {
        setSplitStatus(response.data.data);
      } else {
        setSplitStatus(null);
      }
    } catch (error) {
      console.error("Error loading split status:", error);
      setSplitStatus(null);
    }
  };

  useEffect(() => {
    const loadPaymentData = async () => {
      if (state.tableNumber) {
        setIsLoading(true);
        await loadTableData();
        await loadSplitStatus();
        setIsLoading(false);
      }
    };

    loadPaymentData();
  }, [state.tableNumber]);

  // Calcular totales usando tableSummary si está disponible
  const dishOrders = Array.isArray(state.dishOrders) ? state.dishOrders : [];

  // Platillos no pagados y pagados
  const unpaidDishes = dishOrders.filter(
    (dish) => dish.payment_status === "not_paid" || !dish.payment_status
  );
  const paidDishes = dishOrders.filter(
    (dish) => dish.payment_status === "paid"
  );

  // Usar tableSummary.data.data si está disponible, sino calcular desde dishOrders
  const tableTotalPrice =
    state.tableSummary?.data?.data?.total_amount ||
    dishOrders.reduce((sum, dish) => sum + (dish.total_price || 0), 0);

  const paidAmount =
    state.tableSummary?.data?.data?.paid_amount ||
    paidDishes.reduce((sum, dish) => sum + (dish.total_price || 0), 0);

  const unpaidAmount =
    state.tableSummary?.data?.data?.remaining_amount ||
    unpaidDishes.reduce((sum, dish) => sum + (dish.total_price || 0), 0);

  const tableTotalItems =
    state.tableSummary?.data?.data?.no_items || dishOrders.length;

  // Obtener usuarios únicos considerando split status si está activo
  const uniqueUsers = (() => {
    // Si hay split status activo, usar esa información
    if (splitStatus && splitStatus.split_payments) {
      const pendingUsers = splitStatus.split_payments
        .filter((payment: any) => payment.status === "pending")
        .map((payment: any) => payment.guest_name || payment.user_id)
        .filter(Boolean);
      return pendingUsers;
    }

    // Fallback: usar usuarios con platillos no pagados
    return Array.from(
      new Set(unpaidDishes.map((dish) => dish.guest_name).filter(Boolean))
    );
  })();

  // Para mostrar la opción de split, usar siempre los usuarios con platillos no pagados
  // si no hay split activo, o los pendientes si ya hay split activo
  const usersForSplitOption = Array.from(
    new Set(unpaidDishes.map((dish) => dish.guest_name).filter(Boolean))
  );

  // Platillos del usuario actual
  const currentUserDishes = dishOrders.filter(
    (dish) => dish.guest_name === state.currentUserName
  );

  const currentUserUnpaidDishes = currentUserDishes.filter(
    (dish) => dish.payment_status === "not_paid" || !dish.payment_status
  );

  const currentUserUnpaidAmount = currentUserUnpaidDishes.reduce(
    (sum, dish) => {
      return sum + (dish.total_price || 0);
    },
    0
  );

  // Verificar si hay división activa
  const hasActiveSplit =
    state.isSplitBillActive &&
    Array.isArray(state.splitPayments) &&
    state.splitPayments.length > 0;

  const handlePayFullBill = () => {
    if (unpaidAmount <= 0) {
      alert("No hay cuenta pendiente por pagar");
      return;
    }

    const queryParams = new URLSearchParams({
      amount: unpaidAmount.toString(),
      type: "full-bill",
      users: uniqueUsers.join(","),
    });

    navigateWithTable(`/tip-selection?${queryParams.toString()}`);
  };

  const handleSelectItems = () => {
    if (unpaidDishes.length === 0) {
      alert("No hay platillos pendientes por pagar");
      return;
    }

    const queryParams = new URLSearchParams({
      type: "select-items",
      userName: state.currentUserName || "",
    });

    navigateWithTable(`/tip-selection?${queryParams.toString()}`);
  };

  const handleEqualShares = () => {
    if (unpaidAmount <= 0) {
      alert("No hay cuenta pendiente por pagar");
      return;
    }

    const numberOfPeople = uniqueUsers.length;
    const splitAmount = numberOfPeople > 0 ? unpaidAmount / numberOfPeople : 0;

    const queryParams = new URLSearchParams({
      amount: splitAmount.toString(),
      type: "equal-shares",
      userName: state.currentUserName || "",
      numberOfPeople: numberOfPeople.toString(),
    });

    navigateWithTable(`/tip-selection?${queryParams.toString()}`);
  };

  const handleChooseAmount = () => {
    if (unpaidAmount <= 0) {
      alert("No hay cuenta pendiente por pagar");
      return;
    }

    const queryParams = new URLSearchParams({
      type: "choose-amount",
      userName: state.currentUserName || "",
      maxAmount: unpaidAmount.toString(),
    });

    navigateWithTable(`/tip-selection?${queryParams.toString()}`);
  };

  const handlePayCurrentUser = () => {
    if (currentUserUnpaidAmount <= 0) {
      alert("No tienes platillos pendientes por pagar");
      return;
    }

    const queryParams = new URLSearchParams({
      amount: currentUserUnpaidAmount.toString(),
      type: "user-items",
      userName: state.currentUserName || "",
    });

    navigateWithTable(`/tip-selection?${queryParams.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a8b9b] to-[#153f43] flex flex-col items-center justify-center">
        <Loader className="size-12 text-white animate-spin" />
      </div>
    );
  }

  // Show loading while syncing new user
  if (user && isSyncing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a8b9b] to-[#153f43] flex flex-col items-center justify-center">
        <Loader className="size-12 text-white animate-spin" />
        <p className="text-white mt-4">Configurando tu cuenta...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a8b9b] to-[#153f43] flex flex-col">
      <MenuHeaderBack
        restaurant={restaurantData}
        tableNumber={state.tableNumber}
      />

      <div className="px-4 w-full fixed bottom-0 left-0 right-0">
        <div className="left-4 right-4 bg-gradient-to-tl from-[#0a8b9b] to-[#1d727e] rounded-t-4xl translate-y-7 z-0">
          <div className="py-6 px-8 flex flex-col justify-center">
            <h1 className="font-bold text-white text-3xl leading-7 mt-2 mb-6">
              Elige cómo quieres pagar la cuenta
            </h1>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="bg-white rounded-t-4xl z-5 flex flex-col px-8">
            {/* 4 OPCIONES PRINCIPALES DE PAGO */}
            <div className="flex flex-col my-8">
              {/* Opción 1: Pagar cuenta completa */}
              {unpaidAmount > 0 && (
                <button
                  onClick={handlePayFullBill}
                  className="w-full bg-white cursor-pointer border-b border-[#8e8e8e]"
                >
                  <div className="flex items-center gap-4 py-4">
                    <div className="size-16 rounded-sm border border-black flex items-center justify-center">
                      <ReceiptText
                        className="text-black size-9"
                        strokeWidth={1}
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="text-black font-semibold">
                        1. Pagar cuenta completa
                      </h3>
                      <p className="text-sm text-gray-600">
                        ${unpaidAmount.toFixed(2)} pendientes
                      </p>
                    </div>
                    <div className="text-black">
                      <ChevronRight className="size-5" />
                    </div>
                  </div>
                </button>
              )}

              {/* Opción 2: Seleccionar platillos específicos (TODOS los items disponibles) */}
              {unpaidDishes.length > 0 && (
                <button
                  onClick={handleSelectItems}
                  className="w-full bg-white cursor-pointer border-b border-[#8e8e8e]"
                >
                  <div className="flex items-center gap-4 py-4">
                    <div className="size-16 rounded-sm border border-black flex items-center justify-center">
                      <ListTodo className="text-black size-9" strokeWidth={1} />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="text-black font-semibold">
                        2. Seleccionar alimentos
                      </h3>
                    </div>
                    <div className="text-black">
                      <ChevronRight className="size-5" />
                    </div>
                  </div>
                </button>
              )}

              {/* Opción 3: Dividir cuenta */}
              {unpaidAmount > 0 && usersForSplitOption.length >= 2 && (
                <button
                  onClick={handleEqualShares}
                  className="w-full bg-white cursor-pointer border-b border-[#8e8e8e]"
                >
                  <div className="flex items-center gap-4 py-4">
                    <div className="size-16 rounded-sm border border-black flex items-center justify-center">
                      <Users className="text-black size-9" strokeWidth={1} />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="text-black font-semibold">
                        3. Dividir cuenta
                      </h3>
                      <p className="text-sm text-gray-600">
                        {uniqueUsers.length === 1
                          ? `$${unpaidAmount.toFixed(2)} (restante completo para ti)`
                          : `$${(unpaidAmount / uniqueUsers.length).toFixed(2)} por persona (${uniqueUsers.length} personas pendientes)`}
                      </p>
                    </div>
                    <div className="text-black">
                      <ChevronRight className="size-5" />
                    </div>
                  </div>
                </button>
              )}

              {/* Opción 4: Elegir monto personalizado */}
              {unpaidAmount > 0 && (
                <button
                  onClick={handleChooseAmount}
                  className="w-full bg-white cursor-pointer"
                >
                  <div className="flex items-center gap-4 py-4">
                    <div className="size-16 rounded-sm border border-black flex items-center justify-center">
                      <DollarSign
                        className="text-black size-9"
                        strokeWidth={1}
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="text-black font-semibold">
                        4. Elegir monto
                      </h3>
                    </div>
                    <div className="text-black">
                      <ChevronRight className="size-5" />
                    </div>
                  </div>
                </button>
              )}
            </div>

            {/* Mensaje si no hay platillos pendientes */}
            {unpaidAmount <= 0 && (
              <div className="my-8 text-center">
                <div className="p-6 bg-green-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    ¡Cuenta pagada completamente!
                  </h3>
                  <p className="text-green-600">
                    Todos los platillos de la mesa han sido pagados.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Total - Fixed to bottom */}
          <div className="bg-white px-8 pb-6">
            <div className="border-t border-[#8e8e8e] pt-6 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-black">
                  Total mesa {state.tableNumber}
                </span>
                <span className="text-lg font-bold text-black">
                  ${tableTotalPrice.toFixed(2)}
                </span>
              </div>
              {paidAmount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-green-600 font-medium">Pagado:</span>
                  <span className="text-green-600 font-medium">
                    ${paidAmount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-orange-600 font-medium">Restante:</span>
                <span className="text-orange-600 font-medium">
                  ${unpaidAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
