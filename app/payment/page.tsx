"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTable } from "../context/TableContext";
import { useTableNavigation } from "../hooks/useTableNavigation";
import { useGuest, useIsGuest } from "../context/GuestContext";
import { usePayment } from "../context/PaymentContext";
import { getRestaurantData } from "../utils/restaurantData";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useEcartPay } from "../hooks/useEcartPay";
import { EcartPayCheckoutOptions } from "../types/ecartpay";
import MenuHeaderBack from "../components/MenuHeaderBack";

export default function PaymentPage() {
  const { state } = useTable();
  const { goBack, navigateWithTable } = useTableNavigation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const restaurantData = getRestaurantData();
  const isGuest = useIsGuest();
  const { guestId, tableNumber, setAsAuthenticated } = useGuest();
  const { hasPaymentMethods } = usePayment();
  const { user, isLoaded } = useUser();
  // Tipo de pago de URL params
  const paymentType = searchParams.get("type") || "full-bill";
  const {
    createCheckout,
    isLoading: paymentLoading,
    error: paymentError,
    waitForSDK,
  } = useEcartPay();
  const [name, setName] = useState(state.currentUserName);
  const [email, setEmail] = useState("");
  const [selectedPayment, setSelectedPayment] = useState("mastercard");

  const [selectedItems, setSelectedItems] = useState<{
    [key: string]: { quantity: number; price: number };
  }>({});
  const [tipPercentage, setTipPercentage] = useState(0);
  const [customTip, setCustomTip] = useState("");

  // Sync Clerk authentication with GuestContext
  useEffect(() => {
    if (isLoaded && user) {
      // User is authenticated, clear guest session
      setAsAuthenticated(user.id);
    }
  }, [isLoaded, user, setAsAuthenticated]);

  // Calcular total de la mesa
  const tableTotalPrice = state.orders.reduce(
    (sum, order) => sum + parseFloat(order.total_price.toString()),
    0
  );

  // Calcular el total de los articulos seleccionados
  const selectedItemsTotal = Object.values(selectedItems).reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );

  // Calcular el total segun el tipo de pago
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
      default:
        return tableTotalPrice;
    }
  };

  const baseAmount = getPaymentAmount();

  // Calcular la propina
  const calculateTipAmount = () => {
    if (customTip && parseFloat(customTip) > 0) {
      return parseFloat(customTip);
    }
    return (baseAmount * tipPercentage) / 100;
  };

  const tipAmount = calculateTipAmount();
  const paymentAmount = baseAmount + tipAmount;

  // Renderizar el texto segun tipo de pago
  const getPaymentDescription = () => {
    switch (paymentType) {
      case "full-bill":
        return `Mesa ${state.tableNumber || "N/A"} - Cuenta completa`;
      case "equal-shares":
        const participantCount = Array.from(
          new Set(state.orders.map((order) => order.user_name))
        ).length;
        return `Mesa ${state.tableNumber || "N/A"} - División entre ${participantCount} personas`;
      case "select-items":
        return `Mesa ${state.tableNumber || "N/A"} - Platillos seleccionados`;
      default:
        return `Mesa ${state.tableNumber || "N/A"}`;
    }
  };

  // Obtener todos los articulos de la mesa
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

  // Funciones de propina
  const handleTipPercentage = (percentage: number) => {
    setTipPercentage(percentage);
    setCustomTip(""); // Limpiar propina
  };

  const handleCustomTipChange = (value: string) => {
    setCustomTip(value);
    setTipPercentage(0); // Limpiar porcentaje
  };

  const handlePayment = async () => {
    if (!name.trim()) {
      alert("Please enter your name");
      return;
    }

    try {
      // Wait for SDK to load
      const sdkLoaded = await waitForSDK();
      if (!sdkLoaded) {
        throw new Error(
          "EcartPay SDK failed to load. Please refresh and try again."
        );
      }

      const publicKey = process.env.NEXT_PUBLIC_ECARTPAY_PUBLIC_KEY;
      if (!publicKey) {
        throw new Error("EcartPay configuration missing");
      }

      // Use provided user data or fallback to defaults
      const userEmail = email.trim() || "guest@xquisito.com";
      const [firstName, ...lastNameParts] = name.trim().split(" ");
      const lastName = lastNameParts.join(" ") || "User";

      // Prepare checkout options
      const checkoutOptions: EcartPayCheckoutOptions = {
        publicID: publicKey,
        order: {
          email: userEmail,
          first_name: firstName,
          last_name: lastName,
          phone: "5551234567", // Default phone
          currency: "USD",
          items: [
            {
              name: `Xquisito Restaurant - ${getPaymentDescription()}`,
              price: paymentAmount,
              quantity: 1,
            },
          ],
        },
      };

      console.log(
        "🚀 Initiating EcartPay checkout for full bill with options:",
        checkoutOptions
      );

      // Create checkout using the hook
      const result = await createCheckout(checkoutOptions);

      console.log("💳 EcartPay checkout result:", result);

      if (result.success && result.payment) {
        // Payment successful
        console.log("✅ Full bill payment successful:", result.payment.id);

        // Store payment details
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "xquisito-completed-payment",
            JSON.stringify({
              paymentId: result.payment.id,
              amount: paymentAmount,
              paymentType: paymentType,
              tableNumber: state.tableNumber,
              orders: state.orders,
              payerName: name,
              payerEmail: email,
            })
          );
        }

        // Navigate to success page
        navigateWithTable(
          `/payment-success?paymentId=${result.payment.id}&amount=${paymentAmount}&type=${paymentType}`
        );
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      alert(`Payment failed: ${error.message}`);
    }
  };

  const handleAddCard = () => {
    navigateWithTable("/add-card");
  };

  const handleSplitBill = () => {
    if (isGuest && !hasPaymentMethods) {
      alert("Please add a payment method first to split the bill");
      return;
    }
    navigateWithTable("/choose-to-pay");
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;    
    const textOnlyRegex = /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s'-]*$/;    

    if (textOnlyRegex.test(value)) {
      setName(value);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a8b9b] to-[#153f43]">
      <MenuHeaderBack
        restaurant={restaurantData}
        tableNumber={state.tableNumber}
      />

      <div className="px-4 py-6">
        {/* Payment Type Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            {paymentType === "full-bill" && "Pagar cuenta completa"}
            {paymentType === "equal-shares" && "Pagar parte igual"}
            {paymentType === "select-items" && "Pagar platillos seleccionados"}
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            {getPaymentDescription()}
          </p>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                Tu parte:
              </span>
              <span className="text-lg font-bold text-gray-800">
                ${paymentAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

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

        {/* Tip Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            ¿Quieres agregar propina?
          </h3>

          {/* Tip Percentage Buttons */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            {[10, 15, 18, 20].map((percentage) => (
              <button
                key={percentage}
                onClick={() => handleTipPercentage(percentage)}
                className={`py-3 px-2 rounded-lg border text-sm font-medium transition-colors ${
                  tipPercentage === percentage
                    ? "border-teal-500 bg-teal-50 text-teal-700"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                }`}
              >
                {percentage}%
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

          {/* No Tip Option */}
          <button
            onClick={() => {
              setTipPercentage(0);
              setCustomTip("");
            }}
            className={`w-full py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${
              tipPercentage === 0 && !customTip
                ? "border-gray-400 bg-gray-50 text-gray-700"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
            }`}
          >
            Sin propina
          </button>

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

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-sm font-medium text-gray-800 mb-4">
            Selecciona tu método de pago
          </h3>

          {/* Selected Payment Method */}
          {/* <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-5 bg-gradient-to-r from-red-500 to-yellow-500 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">MC</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {selectedPayment === 'mastercard' ? 'Mastercard' : 'Visa'}
                </p>
                <p className="text-xs text-gray-500">
                  ****{selectedPayment === 'mastercard' ? '3484' : '1234'}
                </p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div> */}

          {/* Change Method Button */}
          <button
            onClick={handleAddCard}
            className="w-full bg-gray-800 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors mb-3"
          >
            Add card
          </button>

          <button
            onClick={handleSplitBill}
            disabled={isGuest && !hasPaymentMethods}
            className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors mb-3 ${
              isGuest && !hasPaymentMethods
                ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                : "bg-gray-800 text-white hover:bg-gray-700"
            }`}
          >
            Split Bill
            {isGuest && !hasPaymentMethods && (
              <span className="block text-xs mt-1 text-gray-500">
                Add a card first
              </span>
            )}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total de la mesa:</span>
              <span className="text-sm text-gray-600">
                ${tableTotalPrice.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Tu parte:</span>
              <span className="text-sm text-gray-600">
                ${baseAmount.toFixed(2)}
              </span>
            </div>
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

        {paymentError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800 text-sm text-center">{paymentError}</p>
          </div>
        )}

        <button
          onClick={handlePayment}
          disabled={
            paymentLoading ||
            !name.trim() ||
            (paymentType === "select-items" &&
              Object.keys(selectedItems).length === 0) ||
            (paymentType === "select-items" && paymentAmount === 0)
          }
          className={`w-full py-4 rounded-lg font-semibold text-lg transition-colors ${
            paymentLoading ||
            !name.trim() ||
            (paymentType === "select-items" &&
              Object.keys(selectedItems).length === 0) ||
            (paymentType === "select-items" && paymentAmount === 0)
              ? "bg-gray-400 text-gray-600 cursor-not-allowed"
              : "bg-teal-700 text-white hover:bg-teal-800"
          }`}
        >
          {paymentLoading
            ? "Procesando pago..."
            : paymentType === "select-items" &&
                Object.keys(selectedItems).length === 0
              ? "Selecciona platillos para continuar"
              : `Pagar: $${paymentAmount.toFixed(2)}`}
        </button>
      </div>
    </div>
  );
}
