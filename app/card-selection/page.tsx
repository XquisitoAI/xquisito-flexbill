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
import MenuHeaderBack from "../components/MenuHeaderBack";
import { apiService } from "../utils/api";

// Utility function to get card type abbreviation
function getCardTypeAbbreviation(cardType: string): string {
  debugger
  const abbreviations: { [key: string]: string } = {
    'visa': 'V',
    'mastercard': 'MC',
    'amex': 'AX',
    'discover': 'D',
    'credit': '💳', // fallback for generic credit
    'debit': '💳',  // fallback for generic debit
    'unknown': '•', // for unknown types
    'card': '•'     // for generic card types
  };

  return abbreviations[cardType.toLowerCase()] || '•';
}

export default function CardSelectionPage() {
  const { state, loadTableData } = useTable();
  const { navigateWithTable } = useTableNavigation();
  const searchParams = useSearchParams();
  const restaurantData = getRestaurantData();
  const isGuest = useIsGuest();
  const { guestId, tableNumber, setAsAuthenticated } = useGuest();
  const { hasPaymentMethods, paymentMethods } = usePayment();
  const { user, isLoaded } = useUser();

  const paymentType = searchParams.get("type") || "full-bill";
  const totalAmountWithTip = parseFloat(searchParams.get("amount") || "0"); // Total con propina para eCardPay
  const baseAmount = parseFloat(searchParams.get("baseAmount") || "0"); // Monto base sin propina para BD
  const tipAmount = parseFloat(searchParams.get("tipAmount") || "0");
  const userName = searchParams.get("userName");
  const usersParam = searchParams.get("users");
  const selectedItemsParam = searchParams.get("selectedItems");

  const {
    createCheckout,
    isLoading: paymentLoading,
    error: paymentError,
    waitForSDK,
  } = useEcartPay();

  const [name, setName] = useState(userName || state.currentUserName || "");
  const [email, setEmail] = useState("");
  const [selectedPayment, setSelectedPayment] = useState("mastercard");
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | null>(null);
  const [paymentMethodType, setPaymentMethodType] = useState<"saved" | "new">("new");
  const [paymentAttempts, setPaymentAttempts] = useState(0);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isLoaded && user) {
      setAsAuthenticated(user.id);
    }
  }, [isLoaded, user, setAsAuthenticated]);

  useEffect(() => {
    // Cargar datos de sessionStorage si existen
    const storedUserName = sessionStorage.getItem("userName");
    const storedPaymentType = sessionStorage.getItem("paymentType");
    const storedSelectedItems = sessionStorage.getItem("selectedItems");

    if (storedUserName && !name) {
      setName(storedUserName);
    }

    // Configurar usuarios seleccionados según el tipo de pago
    if (usersParam) {
      setSelectedUsers(
        usersParam.split(",").filter((user) => user.trim() !== "")
      );
    } else if (userName) {
      setSelectedUsers([userName]);
    }

    // Configurar items seleccionados para select-items
    if (paymentType === "select-items") {
      if (selectedItemsParam) {
        setSelectedItems(
          selectedItemsParam.split(",").filter((item) => item.trim() !== "")
        );
      } else if (storedSelectedItems) {
        try {
          const parsedItems = JSON.parse(storedSelectedItems);
          setSelectedItems(parsedItems);
        } catch (error) {
          console.error("Error parsing stored selected items:", error);
        }
      }
    }
  }, [usersParam, userName, name, paymentType, selectedItemsParam]);

  // Calcular totales basados en el nuevo sistema de platillos
  const dishOrders = Array.isArray(state.dishOrders) ? state.dishOrders : [];

  // Total de la mesa basado en platillos
  const tableTotalPrice = dishOrders.reduce((sum, dish) => {
    return sum + (dish.total_price || 0);
  }, 0);

  // Platillos no pagados
  const unpaidDishes = dishOrders.filter(
    (dish) => dish.payment_status === "not_paid" || !dish.payment_status
  );

  const unpaidAmount = unpaidDishes.reduce((sum, dish) => {
    return sum + (dish.total_price || 0);
  }, 0);

  // Set default payment method when payment methods are loaded
  useEffect(() => {
    if (hasPaymentMethods && paymentMethods.length > 0) {
      const defaultMethod = paymentMethods.find(pm => pm.isDefault) || paymentMethods[0];
      setSelectedPaymentMethodId(defaultMethod.id);
      setPaymentMethodType("saved");
    } else {
      setPaymentMethodType("new");
      setSelectedPaymentMethodId(null);
    }
  }, [hasPaymentMethods, paymentMethods]);

  const handlePaymentSuccess = async (
    paymentId: string,
    amount: number,
    paymentType: string
  ) => {
    try {
      setIsProcessing(true);

      // En el nuevo sistema de platillos, necesitamos marcar platillos específicos como pagados
      // Esto dependerá del tipo de pago y los platillos involucrados

      if (paymentType === "user-items" && userName) {
        // Pagar solo los platillos del usuario específico
        const userDishes = dishOrders.filter(
          (dish) =>
            dish.guest_name === userName &&
            (dish.payment_status === "not_paid" || !dish.payment_status)
        );

        for (const dish of userDishes) {
          try {
            await apiService.payDishOrder(dish.dish_order_id);
          } catch (error) {
            console.error(`Error paying dish ${dish.dish_order_id}:`, error);
          }
        }
      } else if (paymentType === "select-items") {
        // Pagar solo los platillos seleccionados específicamente
        for (const dishId of selectedItems) {
          try {
            await apiService.payDishOrder(dishId);
          } catch (error) {
            console.error(`Error paying selected dish ${dishId}:`, error);
          }
        }
      } else if (
        paymentType === "full-bill" ||
        paymentType === "equal-shares" ||
        paymentType === "choose-amount"
      ) {
        // Para cuenta completa, división equitativa o monto personalizado, usar el monto exacto
        try {
          await apiService.payTableAmount(state.tableNumber, baseAmount);
        } catch (error) {
          console.error("Error paying table amount:", error);
        }
      }

      // Recargar datos de la mesa después del pago para reflejar cambios
      console.log("🔄 Reloading table data after payment...");
      await loadTableData();

      // Store payment success data for payment-success page
      if (typeof window !== "undefined") {
        const successData = {
          paymentId,
          amount,
          paymentType,
          userName: userName || name,
          tableNumber: state.tableNumber,
          dishCount:
            paymentType === "user-items"
              ? dishOrders.filter((d) => d.guest_name === userName).length
              : paymentType === "select-items"
                ? selectedItems.length
                : unpaidDishes.length,
          alreadyProcessed: true,
        };

        console.log(
          "💾 Storing payment success data for payment-success page:",
          successData
        );
        localStorage.setItem(
          "xquisito-completed-payment",
          JSON.stringify(successData)
        );
      }
    } catch (error) {
      console.error("❌ Error processing payment success:", error);
    } finally {
      setIsProcessing(false);
      // Navegar a la página de éxito
      navigateWithTable(
        `/payment-success?paymentId=${paymentId}&amount=${amount}&type=${paymentType}&processed=true`
      );
    }
  };

  const handlePayment = async () => {
    // Para usuarios invitados, mantener validación de nombre
    if (isGuest && !name.trim()) {
      alert("Please enter your name");
      return;
    }

    // Para usuarios registrados, validar selección de tarjeta
    if (!isGuest && !selectedPaymentMethodId) {
      alert("Por favor selecciona una tarjeta de pago");
      return;
    }
    try {
      // Set guest and table info for API service
      if (isGuest && guestId) {
        apiService.setGuestInfo(
          guestId,
          state.tableNumber || tableNumber || undefined
        );
      }

      // Check if user has payment methods
      const paymentMethodsResult = await apiService.getPaymentMethods();

      if (!paymentMethodsResult.success) {
        throw new Error(
          paymentMethodsResult.error?.message ||
            "Failed to fetch payment methods"
        );
      }

      if (
        !paymentMethodsResult.data?.paymentMethods ||
        paymentMethodsResult.data.paymentMethods.length === 0
      ) {
        // No payment methods, redirect to add card page
        setIsProcessing(false);

        const queryParams = new URLSearchParams({
          amount: totalAmountWithTip.toString(), // Total con propina para eCardPay
          baseAmount: baseAmount.toString(), // Monto base para BD
          tipAmount: tipAmount.toString(),
          type: paymentType,
          ...(userName && { userName }),
          ...(usersParam && { users: usersParam }),
        });

        navigateWithTable(`/add-card?${queryParams.toString()}`);
        return;
      }

      // Determinar qué método de pago usar
      const paymentMethods = paymentMethodsResult.data.paymentMethods;
      let paymentMethodToUse;

      console.log('🔍 Debug payment method selection:');
      console.log('- isGuest:', isGuest);
      console.log('- selectedPaymentMethodId:', selectedPaymentMethodId);
      console.log('- available paymentMethods:', paymentMethods.map(pm => ({id: pm.id, isDefault: pm.isDefault, cardType: pm.cardType})));

      if (!isGuest && selectedPaymentMethodId) {
        // Usuario registrado: usar tarjeta seleccionada
        paymentMethodToUse = paymentMethods.find(pm => pm.id === selectedPaymentMethodId);
        console.log('- paymentMethodToUse (selected):', paymentMethodToUse);
        if (!paymentMethodToUse) {
          throw new Error('Tarjeta seleccionada no encontrada');
        }
      } else {
        // Usuario invitado o fallback: usar tarjeta predeterminada/primera
        paymentMethodToUse = paymentMethods.find(pm => pm.isDefault) || paymentMethods[0];
        console.log('- paymentMethodToUse (default/first):', paymentMethodToUse);
      }

      // Process payment directly with selected/default payment method
      const paymentData = {
        paymentMethodId: paymentMethodToUse.id,
        amount: totalAmountWithTip,
        currency: 'USD',
        description: `Xquisito Restaurant Payment - Table ${tableNumber || state.tableNumber || 'N/A'} - Users: ${selectedUsers.join(', ')} - Tip: $${tipAmount.toFixed(2)}`,
        orderId: `order-${Date.now()}-attempt-${paymentAttempts + 1}`,
        tableNumber: tableNumber || state.tableNumber,
        restaurantId: 'xquisito-main'
      };

      console.log('💳 Sending payment request:', paymentData);
      const paymentResult = await apiService.processPayment(paymentData);

      if (!paymentResult.success) {
        console.error('❌ Payment failed:', paymentResult.error);
        throw new Error(paymentResult.error?.message || 'Payment processing failed');
      }

      const payment = paymentResult.data?.payment;
      const order = paymentResult.data?.order;

      if (
        payment?.type === "direct_charge" ||
        (payment && !payment.payLink && !order?.payLink)
      ) {
        console.log(
          "💳 Direct payment successful, proceeding to handlePaymentSuccess"
        );
        await handlePaymentSuccess(payment.id, baseAmount, paymentType); // Usar baseAmount, no totalAmountWithTip
        return;
      }

      // Check if we have a payLink (fallback to EcartPay verification)
      const payLink = order?.payLink || payment?.payLink;
      if (payLink) {
        // Store order details for later reference
        if (typeof window !== "undefined") {
          const paymentData = {
            orderId: order?.id || payment?.id,
            amount: baseAmount, // Monto base para BD (SIN propina)
            paymentType,
            userName: userName || name,
            tableNumber: state.tableNumber,
            baseAmount,
            tipAmount,
            eCartPayAmount: totalAmountWithTip, // Total pagado en eCardPay (CON propina)
          };

          console.log("💾 Storing payment data in localStorage:", paymentData);
          localStorage.setItem(
            "xquisito-pending-payment",
            JSON.stringify(paymentData)
          );
        }

        setPaymentAttempts((prev) => prev + 1);

        // Show user-friendly message before redirect
        const shouldRedirect = confirm(
          `Tu método de pago requiere verificación a través de EcartPay.\n\n` +
            `Esto es normal en modo de pruebas. En producción, este paso usualmente se omite.\n\n` +
            `Haz clic en OK para completar la verificación, o Cancelar para intentar de nuevo.`
        );

        if (shouldRedirect) {
          window.location.href = payLink;
        } else {
          setIsProcessing(false);
        }
        return;
      }

      if (payment || order) {
        const paymentId = payment?.id || order?.id || "completed";
        console.log(
          "✅ Payment completed successfully (no verification needed):",
          paymentId
        );
        await handlePaymentSuccess(paymentId, baseAmount, paymentType); // Usar baseAmount, no totalAmountWithTip
        return;
      }

      throw new Error("Formato de respuesta de pago inesperado");
    } catch (error: any) {
      console.error("Payment error:", error);
      alert(`Error en el pago: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddCard = () => {
    const queryParams = new URLSearchParams({
      amount: totalAmountWithTip.toString(), // Total con propina para eCardPay
      baseAmount: baseAmount.toString(), // Monto base para BD
      tipAmount: tipAmount.toString(),
      type: paymentType,
      ...(userName && { userName }),
      ...(usersParam && { users: usersParam }),
    });

    navigateWithTable(`/add-card?${queryParams.toString()}`);
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

      <div className="px-4 w-full fixed bottom-0 left-0 right-0">
        <div className="flex-1 flex flex-col relative">
          <div className="left-4 right-4 bg-gradient-to-tl from-[#0a8b9b] to-[#1d727e] rounded-t-4xl translate-y-7 z-0">
            <div className="py-6 px-8 flex flex-col justify-center">
              <h1 className="font-bold text-white text-3xl leading-7 mt-2 mb-6">
                Selecciona tu método de pago
              </h1>
            </div>
          </div>

          <div className="bg-white rounded-t-4xl relative z-10 flex flex-col px-6 flex-1 py-8">
            {/* Payment Summary */}
            <div className="space-y-2 mb-6">
              <div className="mb-4">
                <span className="text-black text-xl font-semibold">
                  Mesa {state.tableNumber}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total mesa</span>
                <span className="text-gray-600">
                  ${tableTotalPrice.toFixed(2)}
                </span>
              </div>

              {unpaidAmount < tableTotalPrice && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Pendiente</span>
                  <span className="text-gray-600">
                    ${unpaidAmount.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-black font-medium">Tu parte</span>
                <span className="text-black font-medium">
                  ${baseAmount.toFixed(2)}
                </span>
              </div>

              {tipAmount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-black">Propina</span>
                  <span className="text-black">${tipAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-center border-t pt-2">
                <span className="text-lg font-bold text-black">
                  Total a pagar
                </span>
                <span className="text-lg font-bold text-black">
                  ${totalAmountWithTip.toFixed(2)}
                </span>
              </div>
            </div>
            {/* Customer Information - Only show for guest users */}
            {isGuest && (
              <div className="mb-6 text-center">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Nombre completo
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={handleNameChange}
                      placeholder="Tu nombre completo"
                      className="w-full text-center text-black border-b border-black focus:outline-none focus:ring-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Email (opcional)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="w-full text-center text-black border-b border-black focus:outline-none focus:ring-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Payment Method Selection */}
            {user && hasPaymentMethods && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-black mb-4">
                  Selecciona tu método de pago
                </h3>

                {/* Payment Method Type Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
                  <button
                    onClick={() => setPaymentMethodType("saved")}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                      paymentMethodType === "saved"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Tarjetas guardadas
                  </button>
                  {/* <button
                    onClick={() => setPaymentMethodType("new")}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                      paymentMethodType === "new"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Nueva tarjeta
                  </button> */}
                </div>

                {/* Saved Cards List */}
                {paymentMethodType === "saved" && (
                  <div className="space-y-2 mb-4">
                    {paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        onClick={() => setSelectedPaymentMethodId(method.id)}
                        className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedPaymentMethodId === method.id
                            ? "border-teal-500 bg-teal-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-5 bg-gradient-to-r from-blue-500 to-purple-500 rounded flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              {getCardTypeAbbreviation(method.cardType)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800 capitalize">
                              {method.cardType}
                            </p>
                            <p className="text-xs text-gray-500">
                              •••• {method.lastFourDigits}
                            </p>
                          </div>
                          {method.isDefault && (
                            <span className="text-xs bg-teal-100 text-teal-800 px-2 py-1 rounded-full">
                              Predeterminada
                            </span>
                          )}
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          selectedPaymentMethodId === method.id
                            ? "border-teal-500 bg-teal-500"
                            : "border-gray-300"
                        }`}>
                          {selectedPaymentMethodId === method.id && (
                            <div className="w-full h-full rounded-full bg-white scale-50"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Payment Method Section */}
            <div className="mb-4">
              <button
                onClick={handleAddCard}
                className="w-full text-white py-3 rounded-full cursor-pointer transition-colors bg-black hover:bg-stone-950"
              >
                + Agregar método de pago
              </button>
            </div>

            {paymentError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-800 text-sm text-center">
                  {paymentError}
                </p>
              </div>
            )}

            {/* Pay Button */}
            <button
              onClick={handlePayment}
              disabled={paymentLoading || (isGuest && !name.trim()) || (!isGuest && !selectedPaymentMethodId)}
              className={`w-full text-white py-3 rounded-full cursor-pointer transition-colors ${
                paymentLoading || (isGuest && !name.trim()) || (!isGuest && !selectedPaymentMethodId)
                  ? "bg-stone-800 cursor-not-allowed"
                  : "bg-black hover:bg-stone-950"
              }`}
            >
              {paymentLoading
                ? "Procesando pago..."
                : (isGuest && !name.trim())
                  ? "Ingresa tu nombre"
                  : (!isGuest && !selectedPaymentMethodId)
                    ? "Selecciona una tarjeta"
                    : `Pagar: $${totalAmountWithTip.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
