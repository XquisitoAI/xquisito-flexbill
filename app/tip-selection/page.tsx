"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTable } from "../context/TableContext";
import { useTableNavigation } from "../hooks/useTableNavigation";
import { getRestaurantData } from "../utils/restaurantData";
import { useState, useEffect } from "react";
import MenuHeaderBack from "../components/MenuHeaderBack";
import { Check } from "lucide-react";
import { apiService } from "../utils/api";

export default function TipSelectionPage() {
  const { state, loadTableData } = useTable();
  const { navigateWithTable } = useTableNavigation();
  const searchParams = useSearchParams();
  const restaurantData = getRestaurantData();

  const paymentType = searchParams.get("type") || "full-bill";
  const amount = searchParams.get("amount");
  const userName = searchParams.get("userName");
  const users = searchParams.get("users");
  const numberOfPeople = searchParams.get("numberOfPeople");
  const maxAmount = searchParams.get("maxAmount");

  const [tipPercentage, setTipPercentage] = useState(0);
  const [customTip, setCustomTip] = useState("");
  const [customPaymentAmount, setCustomPaymentAmount] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [splitStatus, setSplitStatus] = useState<any>(null);

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

  // Recargar datos de la mesa para asegurar montos actualizados
  useEffect(() => {
    if (state.tableNumber) {
      loadTableData();
      loadSplitStatus();
    }
  }, [state.tableNumber]);

  // Cargar datos guardados si existen
  useEffect(() => {
    if (paymentType === "choose-amount" && amount) {
      setCustomPaymentAmount(amount);
    }
  }, [paymentType, amount]);

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

  // Platillos del usuario actual no pagados
  const currentUserUnpaidDishes = dishOrders.filter(
    (dish) =>
      dish.guest_name === userName &&
      (dish.payment_status === "not_paid" || !dish.payment_status)
  );

  const currentUserUnpaidAmount = currentUserUnpaidDishes.reduce(
    (sum, dish) => {
      return sum + (dish.total_price || 0);
    },
    0
  );

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

  const getPaymentAmount = () => {
    switch (paymentType) {
      case "full-bill":
        // Usar el monto restante actual de tableSummary, no el unpaidAmount calculado al cargar
        return state.tableSummary?.data?.data?.remaining_amount || unpaidAmount;
      case "user-items":
        return currentUserUnpaidAmount;
      case "equal-shares":
        const participantCount = numberOfPeople
          ? parseInt(numberOfPeople)
          : uniqueUsers.length;
        const currentRemaining =
          state.tableSummary?.data?.data?.remaining_amount || unpaidAmount;
        // Si no hay personas pendientes o el monto es 0, devolver 0
        if (participantCount <= 0 || currentRemaining <= 0) {
          return 0;
        }
        return currentRemaining / participantCount;
      case "choose-amount":
        return customPaymentAmount ? parseFloat(customPaymentAmount) : 0;
      case "select-items":
        return selectedItems.reduce((sum, itemId) => {
          const dish = unpaidDishes.find((d) => d.dish_order_id === itemId);
          return sum + (dish?.total_price || 0);
        }, 0);
      default:
        return amount ? parseFloat(amount) : 0;
    }
  };

  const baseAmount = getPaymentAmount();
  const currentRemainingAmount =
    state.tableSummary?.data?.data?.remaining_amount || unpaidAmount;
  const maxAllowedAmount = maxAmount
    ? parseFloat(maxAmount)
    : currentRemainingAmount;

  const calculateTipAmount = () => {
    if (customTip && parseFloat(customTip) > 0) {
      return parseFloat(customTip);
    }
    return (baseAmount * tipPercentage) / 100;
  };

  const tipAmount = calculateTipAmount();
  const paymentAmount = baseAmount + tipAmount;

  const handleTipPercentage = (percentage: number) => {
    setTipPercentage(percentage);
    setCustomTip("");
  };

  const handleCustomTipChange = (value: string) => {
    setCustomTip(value);
    setTipPercentage(0);
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleContinueToCardSelection = () => {
    // Guardar información del pago en sessionStorage
    sessionStorage.setItem("tipPercentage", tipPercentage.toString());
    sessionStorage.setItem("customTip", customTip);
    sessionStorage.setItem("tipAmount", tipAmount.toString());
    sessionStorage.setItem("baseAmount", baseAmount.toString());
    sessionStorage.setItem("paymentAmount", paymentAmount.toString());
    sessionStorage.setItem("paymentType", paymentType);
    sessionStorage.setItem("userName", userName || "");

    if (paymentType === "choose-amount") {
      sessionStorage.setItem("customPaymentAmount", customPaymentAmount);
    }

    if (paymentType === "select-items") {
      sessionStorage.setItem("selectedItems", JSON.stringify(selectedItems));
    }

    const queryParams = new URLSearchParams({
      type: paymentType,
      amount: paymentAmount.toString(), // Total con propina para eCardPay
      baseAmount: baseAmount.toString(), // Monto base sin propina para BD
      tipAmount: tipAmount.toString(), // Propina por separado
      ...(userName && { userName }),
      ...(users && { users }),
      ...(paymentType === "select-items" && {
        selectedItems: selectedItems.join(","),
      }),
    });

    navigateWithTable(`/card-selection?${queryParams.toString()}`);
  };

  const getPaymentDetails = () => {
    switch (paymentType) {
      case "full-bill":
        return {
          description: "Cuenta completa de la mesa",
          items: `${unpaidDishes.length} platillos pendientes`,
        };
      case "user-items":
        return {
          description: `Platillos de ${userName}`,
          items: `${currentUserUnpaidDishes.length} platillo${currentUserUnpaidDishes.length !== 1 ? "s" : ""}`,
        };
      case "equal-shares":
        const divisionPeople = numberOfPeople || uniqueUsers.length;
        if (divisionPeople <= 0) {
          return {
            description: "División completada",
            items: "No hay personas pendientes",
          };
        }
        return {
          description: "Tu parte de la división",
          items: `${unpaidDishes.length} platillos divididos entre ${divisionPeople}`,
        };
      case "choose-amount":
        return {
          description: "Monto personalizado",
          items: "Cantidad específica",
        };
      case "select-items":
        return {
          description: "Artículos seleccionados",
          items: `${selectedItems.length} de ${unpaidDishes.length} disponibles`,
        };
      default:
        return {
          description: "Pago",
          items: "",
        };
    }
  };

  const paymentDetails = getPaymentDetails();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a8b9b] to-[#153f43] flex flex-col">
      <MenuHeaderBack
        restaurant={restaurantData}
        tableNumber={state.tableNumber}
      />

      <div className="px-4 w-full fixed bottom-0 left-0 right-0">
        <div className="flex-1 flex flex-col relative">
          <div className="left-4 right-4 bg-gradient-to-tl from-[#0a8b9b] to-[#1d727e] rounded-t-4xl translate-y-7 z-0">
            <div className="py-6 px-8 flex flex-col justify-center">
              <h1 className="text-[#e0e0e0] text-xl">
                Mesa {state.tableNumber}
              </h1>
              <h1 className="font-bold text-white text-3xl leading-7 mt-2 mb-6">
                Revisa tu cuenta
              </h1>
            </div>
          </div>

          <div className="bg-white rounded-t-4xl relative z-10 flex flex-col px-8 py-8">
            {/* Seleccionar monto a pagar para choose-amount */}
            {paymentType === "choose-amount" && (
              <div className="mb-6">
                <div className="flex flex-col w-full items-center">
                  <label className="block text-xl font-medium text-black mb-4">
                    Monto a pagar
                  </label>
                  <div className="w-full max-w-xs">
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-2xl">
                        $
                      </span>
                      <input
                        type="number"
                        value={customPaymentAmount}
                        onChange={(e) => setCustomPaymentAmount(e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        className={`w-full pl-8 pr-4 py-3 text-center text-black border-2 rounded-lg focus:outline-none text-2xl font-semibold ${
                          customPaymentAmount &&
                          parseFloat(customPaymentAmount) > maxAllowedAmount
                            ? "border-red-500 bg-red-50"
                            : "border-gray-300 focus:border-teal-500"
                        }`}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-3">
                    Máximo: ${maxAllowedAmount.toFixed(2)}
                  </p>
                  {customPaymentAmount &&
                    parseFloat(customPaymentAmount) > maxAllowedAmount && (
                      <p className="text-sm text-red-600 mt-1">
                        El monto no puede exceder ${maxAllowedAmount.toFixed(2)}
                      </p>
                    )}
                </div>
              </div>
            )}

            {/* Seleccionar artículos específicos */}
            {paymentType === "select-items" && (
              <div className="mb-6">
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {unpaidDishes.map((dish) => {
                    const isSelected = selectedItems.includes(
                      dish.dish_order_id
                    );
                    return (
                      <div
                        key={dish.dish_order_id}
                        onClick={() => toggleItemSelection(dish.dish_order_id)}
                        className={`py-3 px-2 cursor-pointer transition-colors ${
                          isSelected ? "bg-teal-50" : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              <div
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                  isSelected
                                    ? "border-teal-500 bg-teal-500"
                                    : "border-gray-300"
                                }`}
                              >
                                {isSelected && (
                                  <svg
                                    className="w-4 h-4 text-white"
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
                                )}
                              </div>
                            </div>
                            <div className="size-16 bg-gray-300 rounded-sm flex items-center justify-center hover:scale-105 transition-transform duration-200">
                              <img
                                src={"/logo-short-green.webp"}
                                alt="Logo Xquisito"
                                className="size-18 object-contain rounded-sm"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm text-[#8e8e8e]">
                                {dish.guest_name}
                              </h3>
                              <h4 className="text-base font-medium text-black">
                                {dish.item}
                              </h4>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-black">
                              ${dish.total_price.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {selectedItems.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    Selecciona al menos un artículo para continuar
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tip Selection Section */}
        <div className="bg-white px-8 pb-6 space-y-4">
          {/* Resumen del pago */}
          <div className="space-y-2">
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
            {paidAmount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-green-600 font-medium">Pagado:</span>
                <span className="text-green-600 font-medium">
                  ${paidAmount.toFixed(2)}
                </span>
              </div>
            )}

            {/* Restante por pagar */}
            <div className="flex justify-between items-center">
              <span className="text-orange-600 font-medium">
                Restante por pagar:
              </span>
              <span className="text-orange-600 font-medium">
                ${unpaidAmount.toFixed(2)}
              </span>
            </div>

            {/* Tu parte */}
            <div className="flex justify-between items-center border-t pt-2 mt-2">
              <span className="text-black font-bold">Tu parte:</span>
              <span className="text-black font-bold">
                ${baseAmount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Selección de propina */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center gap-4 mb-3">
              <span className="text-black font-medium">Propina</span>
              {/* Tip Percentage Buttons */}
              <div className="grid grid-cols-5 gap-2">
                {[0, 10, 15, 20].map((percentage) => (
                  <button
                    key={percentage}
                    onClick={() => handleTipPercentage(percentage)}
                    className={`py-1 rounded-full border border-[#8e8e8e]/40 text-black font-medium transition-colors ${
                      tipPercentage === percentage
                        ? "bg-[#ededed]"
                        : "bg-[#f9f9f9] hover:border-gray-400"
                    }`}
                  >
                    {percentage === 0 ? "0%" : `${percentage}%`}
                  </button>
                ))}
                {/* Custom Tip Input */}
                <div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black">
                      $
                    </span>
                    <input
                      type="number"
                      value={customTip}
                      onChange={(e) => handleCustomTipChange(e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="w-full pl-6 pr-1 py-1 border border-[#8e8e8e]/40 rounded-full focus:outline-none focus:ring focus:ring-gray-400 focus:border-transparent text-black [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {tipAmount > 0 && (
              <div className="flex justify-between items-center mt-2 text-sm">
                <span className="text-gray-600">Propina</span>
                <span className="text-teal-600 font-medium">
                  +${tipAmount.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Total final */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center">
              <span className="font-bold text-black text-lg">
                Total a pagar
              </span>
              <span className="font-bold text-black text-lg">
                ${paymentAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Pagar Button */}
        <div className="bg-white px-8 pb-6">
          {(() => {
            const isChooseAmountInvalid =
              paymentType === "choose-amount" &&
              (!customPaymentAmount ||
                parseFloat(customPaymentAmount) <= 0 ||
                parseFloat(customPaymentAmount) > maxAllowedAmount);

            const isSelectItemsInvalid =
              paymentType === "select-items" && selectedItems.length === 0;

            const isDisabled =
              baseAmount <= 0 || isChooseAmountInvalid || isSelectItemsInvalid;

            return (
              <button
                onClick={handleContinueToCardSelection}
                disabled={isDisabled}
                className={`w-full text-white py-3 rounded-full font-medium cursor-pointer transition-colors ${
                  isDisabled
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-black hover:bg-stone-950"
                }`}
              >
                {paymentType === "choose-amount" &&
                (!customPaymentAmount || parseFloat(customPaymentAmount) <= 0)
                  ? "Introduce un monto"
                  : paymentType === "choose-amount" &&
                      parseFloat(customPaymentAmount) > maxAllowedAmount
                    ? "Monto excede el máximo permitido"
                    : paymentType === "select-items" &&
                        selectedItems.length === 0
                      ? "Selecciona al menos un artículo"
                      : `Pagar $${paymentAmount.toFixed(2)}`}
              </button>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
