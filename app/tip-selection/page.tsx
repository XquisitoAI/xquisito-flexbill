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
    <div className="min-h-screen bg-gradient-to-br from-[#0a8b9b] to-[#153f43] flex flex-col">
      <MenuHeaderBack
        restaurant={restaurantData}
        tableNumber={state.tableNumber}
      />

      <div
        className={`px-4 w-full ${paymentType === "select-items" ? "flex-1 flex flex-col" : "fixed bottom-0 left-0 right-0"}`}
      >
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

          <div className="bg-white rounded-t-4xl relative z-10 flex flex-col px-8 flex-1 py-8">
            {/* Seleccionar articulos */}
            {paymentType === "select-items" && (
              <div className="flex-1 flex flex-col">
                {getAllTableItems().length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-gray-400 text-6xl mb-4">🛒</div>
                      <p className="text-black text-2xl">
                        No hay pedidos en la mesa
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="text-black font-semibold text-sm flex gap-5 justify-end mb-3">
                        <span>Cant.</span>
                        <span>Precio</span>
                      </div>
                      <div>
                        {getAllTableItems().map((item) => (
                          <div
                            key={item.id}
                            className={`py-3 px-2 border-b border-[#8e8e8e] cursor-pointer transition-colors ${
                              selectedItems[item.id]
                                ? "bg-teal-50"
                                : "hover:bg-gray-50"
                            }`}
                            onClick={() => toggleItemSelection(item.id, item)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="mr-2">
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
                                <div className="flex-shrink-0 mt-1">
                                  <div className="size-16 bg-gray-300 rounded-sm flex items-center justify-center hover:scale-105 transition-transform duration-200">
                                    {item.originalItem.images ? (
                                      <img
                                        src={item.originalItem.images[0]}
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
                                    {item.orderedBy.toUpperCase()}
                                  </h3>
                                  <h4 className="text-base font-medium text-black">
                                    {item.name}
                                  </h4>
                                </div>
                              </div>
                              <div className="text-right flex gap-5 items-center">
                                <p className="text-black">{item.quantity}</p>
                                <p className="font-medium text-black">
                                  ${item.price.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Spacer to push content to bottom when items don't fill viewport */}
                      <div className="flex-1"></div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Selecionar monto a pagar */}
            {paymentType === "choose-amount" && (
              <div>
                <div className="flex flex-col w-full items-center">
                  <label className="block text-xl font-medium text-black mb-2">
                    Monto a pagar
                  </label>
                  <div>
                    <input
                      type="number"
                      value={customPaymentAmount}
                      onChange={(e) => setCustomPaymentAmount(e.target.value)}
                      placeholder="$0.00"
                      step="0.01"
                      min="0"
                      className={`w-full text-center text-black border-b border-black focus:outline-none focus:ring-none text-3xl ${
                        customPaymentAmount &&
                        parseFloat(customPaymentAmount) > remainingTableAmount
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-3">
                    Máximo: ${remainingTableAmount.toFixed(2)} (monto restante)
                  </p>
                  {customPaymentAmount &&
                    parseFloat(customPaymentAmount) > remainingTableAmount && (
                      <p className="text-sm text-red-600 mt-1">
                        No puedes ingresar una cantidad mayor al monto restante
                      </p>
                    )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tip Selection Section */}
        <div className="bg-white px-8 pb-6 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-black font-medium">Total de la mesa</span>
            <span className="text-black font-medium">
              ${tableTotalPrice.toFixed(2)} MXN
            </span>
          </div>
          {paymentType !== "full-bill" && (
            <div className="flex justify-between items-center">
              <span className="text-black font-medium">Tu parte</span>
              <span className="text-black font-medium">
                ${baseAmount.toFixed(2)} MXN
              </span>
            </div>
          )}

          <div className="mb-4">
            <div className="flex gap-3">
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
              <div className="flex justify-end mt-1">
                <span className="text-black font-medium">
                  ${tipAmount.toFixed(2)} MXN
                </span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center">
            <span className="font-bold text-black">Total a pagar:</span>
            <span className="font-bold text-black">
              ${paymentAmount.toFixed(2)} MXN
            </span>
          </div>
        </div>

        {/* Pagar Button */}
        <div className="bg-white p-6">
          {(() => {
            const isSelectItemsEmpty =
              paymentType === "select-items" &&
              Object.keys(selectedItems).length === 0;
            const isSelectItemsZero =
              paymentType === "select-items" && paymentAmount === 0;
            const isChooseAmountInvalid =
              paymentType === "choose-amount" &&
              (!customPaymentAmount ||
                parseFloat(customPaymentAmount) <= 0 ||
                parseFloat(customPaymentAmount) > remainingTableAmount);

            const isDisabled =
              isSelectItemsEmpty || isSelectItemsZero || isChooseAmountInvalid;

            return (
              <button
                onClick={handleContinueToCardSelection}
                disabled={isDisabled}
                className={`w-full text-white py-3 rounded-full cursor-pointer transition-colors ${
                  isDisabled
                    ? "bg-stone-800 cursor-not-allowed"
                    : "bg-black hover:bg-stone-950"
                }`}
              >
                {isSelectItemsEmpty
                  ? "Selecciona platillos"
                  : paymentType === "choose-amount" &&
                      (!customPaymentAmount ||
                        parseFloat(customPaymentAmount) <= 0)
                    ? "Introduce un monto"
                    : paymentType === "choose-amount" &&
                        parseFloat(customPaymentAmount) > remainingTableAmount
                      ? "Monto excede lo que resta por pagar"
                      : "Pagar"}
              </button>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
