"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTable } from "../context/TableContext";
import { useTableNavigation } from "../hooks/useTableNavigation";
import { getRestaurantData } from "../utils/restaurantData";
import { useState, useEffect } from "react";
import MenuHeaderBack from "../components/MenuHeaderBack";

export default function TipSelectionPage() {
  const { state, getTotalPaidAmount, getRemainingAmount } = useTable();
  const { navigateWithTable } = useTableNavigation();
  const searchParams = useSearchParams();
  const restaurantData = getRestaurantData();

  const paymentType = searchParams.get("type") || "full-bill";

  const [tipPercentage, setTipPercentage] = useState(0);
  const [customTip, setCustomTip] = useState("");
  const [customPaymentAmount, setCustomPaymentAmount] = useState("");

  const [selectedItems, setSelectedItems] = useState<{
    [key: string]: { quantity: number; price: number };
  }>({});

  useEffect(() => {
    const storedSelectedItems = sessionStorage.getItem("selectedItems");
    if (storedSelectedItems) {
      setSelectedItems(JSON.parse(storedSelectedItems));
    }
  }, []);

  const tableTotalPrice = state.orders.reduce(
    (sum, order) => sum + parseFloat(order.total_price.toString()),
    0
  );

  const totalPaidAmount = getTotalPaidAmount();
  const remainingTableAmount = getRemainingAmount();

  const selectedItemsTotal = Object.values(selectedItems).reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );

  const getPaymentAmount = () => {
    switch (paymentType) {
      case "full-bill":
        return tableTotalPrice;
      case "equal-shares":
        const participantCount = Array.from(
          new Set(state.orders.map((order) => order.user_name))
        ).length;
        return participantCount > 0
          ? tableTotalPrice / participantCount
          : tableTotalPrice;
      case "select-items":
        return selectedItemsTotal;
      case "choose-amount":
        return customPaymentAmount ? parseFloat(customPaymentAmount) : 0;
      default:
        return tableTotalPrice;
    }
  };

  const baseAmount = getPaymentAmount();

  const calculateTipAmount = () => {
    if (customTip && parseFloat(customTip) > 0) {
      return parseFloat(customTip);
    }
    return (baseAmount * tipPercentage) / 100;
  };

  const tipAmount = calculateTipAmount();
  const paymentAmount = baseAmount + tipAmount;

  const getAllTableItems = () => {
    const allItems: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
      orderedBy: string;
      orderId: string;
      originalItem: any;
    }> = [];

    state.orders.forEach((order) => {
      order.items.forEach((item) => {
        for (let i = 0; i < item.quantity; i++) {
          allItems.push({
            id: `${order.id}-${item.id}-${i}`,
            name: item.name,
            price: item.price,
            quantity: 1,
            orderedBy: order.user_name,
            orderId: order.id,
            originalItem: item,
          });
        }
      });
    });

    return allItems;
  };

  const toggleItemSelection = (itemId: string, item: any) => {
    setSelectedItems((prev) => {
      const newSelected = { ...prev };
      if (newSelected[itemId]) {
        delete newSelected[itemId];
      } else {
        newSelected[itemId] = {
          quantity: 1,
          price: item.price,
        };
      }
      return newSelected;
    });
  };

  const handleTipPercentage = (percentage: number) => {
    setTipPercentage(percentage);
    setCustomTip("");
  };

  const handleCustomTipChange = (value: string) => {
    setCustomTip(value);
    setTipPercentage(0);
  };

  const handleContinueToCardSelection = () => {
    sessionStorage.setItem("tipPercentage", tipPercentage.toString());
    sessionStorage.setItem("customTip", customTip);
    sessionStorage.setItem("tipAmount", tipAmount.toString());
    sessionStorage.setItem("baseAmount", baseAmount.toString());
    sessionStorage.setItem("paymentAmount", paymentAmount.toString());

    if (paymentType === "choose-amount") {
      sessionStorage.setItem("customPaymentAmount", customPaymentAmount);
    }

    navigateWithTable(`/card-selection?type=${paymentType}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a8b9b] to-[#153f43]">
      <MenuHeaderBack
        restaurant={restaurantData}
        tableNumber={state.tableNumber}
      />

      <div className="px-4 py-6">
        {/* Item Selection UI - Only show for select-items payment type */}
        {paymentType === "select-items" && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Selecciona los platillos que quieres pagar
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Puedes pagar por cualquier platillo de la mesa, sin importar quién
              lo ordenó
            </p>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {getAllTableItems().map((item) => (
                <div
                  key={item.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedItems[item.id]
                      ? "border-teal-500 bg-teal-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => toggleItemSelection(item.id, item)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800">
                            {item.name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            Ordenado por: {item.orderedBy}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-800">
                            ${item.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedItems[item.id]
                            ? "border-teal-500 bg-teal-500"
                            : "border-gray-300"
                        }`}
                      >
                        {selectedItems[item.id] && (
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
                  </div>
                </div>
              ))}
            </div>

            {Object.keys(selectedItems).length > 0 && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">
                    Platillos seleccionados: {Object.keys(selectedItems).length}
                  </span>
                  <span className="font-bold text-gray-800">
                    ${selectedItemsTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Custom Payment Amount Section - Only show for choose-amount payment type */}
        {paymentType === "choose-amount" && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Introduce el monto que quieres pagar
            </h3>

            {/* Payment Status Summary */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-800">Total de la mesa:</span>
                  <span className="text-sm font-semibold text-blue-800">
                    ${tableTotalPrice.toFixed(2)}
                  </span>
                </div>
                {totalPaidAmount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-600">Ya pagado por otros:</span>
                    <span className="text-sm font-semibold text-blue-600">
                      -${totalPaidAmount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center border-t border-blue-300 pt-2">
                  <span className="text-sm font-bold text-blue-900">Restante por pagar:</span>
                  <span className="text-sm font-bold text-blue-900">
                    ${remainingTableAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto a pagar
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  type="number"
                  value={customPaymentAmount}
                  onChange={(e) => setCustomPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className={`w-full pl-8 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-lg ${
                    customPaymentAmount && parseFloat(customPaymentAmount) > remainingTableAmount
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-300 focus:ring-teal-500"
                  }`}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Máximo: ${remainingTableAmount.toFixed(2)} (monto restante)
              </p>
              {customPaymentAmount && parseFloat(customPaymentAmount) > remainingTableAmount && (
                <p className="text-sm text-red-600 mt-1">
                  ⚠️ No puedes ingresar una cantidad mayor al monto restante
                </p>
              )}
            </div>

            {customPaymentAmount && parseFloat(customPaymentAmount) > 0 && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Tu pago:</span>
                    <span className="text-sm font-semibold text-gray-800">
                      ${parseFloat(customPaymentAmount).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="text-sm font-medium text-gray-700">Quedaría por pagar:</span>
                    <span className="text-sm font-bold text-gray-800">
                      ${(remainingTableAmount - parseFloat(customPaymentAmount)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tip Selection Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            ¿Quieres agregar propina?
          </h3>

          {/* Tip Percentage Buttons */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            {[0, 10, 15, 20].map((percentage) => (
              <button
                key={percentage}
                onClick={() => handleTipPercentage(percentage)}
                className={`py-3 px-2 rounded-lg border text-sm font-medium transition-colors ${
                  tipPercentage === percentage
                    ? "border-teal-500 bg-teal-50 text-teal-700"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                }`}
              >
                {percentage === 0 ? "0%" : `${percentage}%`}
              </button>
            ))}
          </div>

          {/* Custom Tip Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Propina personalizada
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                $
              </span>
              <input
                type="number"
                value={customTip}
                onChange={(e) => handleCustomTipChange(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Tip Summary */}
          {(tipPercentage > 0 || (customTip && parseFloat(customTip) > 0)) && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  {tipPercentage > 0
                    ? `Propina (${tipPercentage}%):`
                    : "Propina personalizada:"}
                </span>
                <span className="text-sm font-semibold text-gray-800">
                  ${tipAmount.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total de la mesa:</span>
              <span className="text-sm text-gray-600">
                ${tableTotalPrice.toFixed(2)}
              </span>
            </div>
            {paymentType !== "full-bill" && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tu parte:</span>
                <span className="text-sm text-gray-600">
                  ${baseAmount.toFixed(2)}
                </span>
              </div>
            )}
            {tipAmount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Propina:</span>
                <span className="text-sm text-gray-600">
                  ${tipAmount.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center border-t pt-2">
              <span className="text-lg font-bold text-gray-800">
                Total a pagar:
              </span>
              <span className="text-lg font-bold text-gray-800">
                ${paymentAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinueToCardSelection}
          disabled={
            (paymentType === "select-items" &&
              Object.keys(selectedItems).length === 0) ||
            (paymentType === "select-items" && paymentAmount === 0) ||
            (paymentType === "choose-amount" && (!customPaymentAmount || parseFloat(customPaymentAmount) <= 0 || parseFloat(customPaymentAmount) > remainingTableAmount))
          }
          className={`w-full py-4 rounded-lg font-semibold text-lg transition-colors ${
            (paymentType === "select-items" &&
              Object.keys(selectedItems).length === 0) ||
            (paymentType === "select-items" && paymentAmount === 0) ||
            (paymentType === "choose-amount" && (!customPaymentAmount || parseFloat(customPaymentAmount) <= 0 || parseFloat(customPaymentAmount) > remainingTableAmount))
              ? "bg-gray-400 text-gray-600 cursor-not-allowed"
              : "bg-teal-700 text-white hover:bg-teal-800"
          }`}
        >
          {paymentType === "select-items" &&
          Object.keys(selectedItems).length === 0
            ? "Selecciona platillos para continuar"
            : paymentType === "choose-amount" && (!customPaymentAmount || parseFloat(customPaymentAmount) <= 0)
            ? "Introduce un monto para continuar"
            : paymentType === "choose-amount" && parseFloat(customPaymentAmount) > remainingTableAmount
            ? "Monto excede lo que resta por pagar"
            : "Continuar"}
        </button>
      </div>
    </div>
  );
}
