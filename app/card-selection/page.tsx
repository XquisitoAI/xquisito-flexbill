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
import { apiService } from "../utils/api";

export default function CardSelectionPage() {
  const { state, addPayment, markOrdersAsPaid } = useTable();
  const { navigateWithTable } = useTableNavigation();
  const searchParams = useSearchParams();
  const restaurantData = getRestaurantData();
  const isGuest = useIsGuest();
  const { guestId, tableNumber, setAsAuthenticated } = useGuest();
  const { hasPaymentMethods, paymentMethods } = usePayment();
  const { user, isLoaded } = useUser();

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
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | null>(null);
  const [paymentMethodType, setPaymentMethodType] = useState<"saved" | "new">("new");

  const [paymentAmount, setPaymentAmount] = useState(0);
  const [tipAmount, setTipAmount] = useState(0);
  const [baseAmount, setBaseAmount] = useState(0);
  const [paymentAttempts, setPaymentAttempts] = useState(0);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  useEffect(() => {
    if (isLoaded && user) {
      setAsAuthenticated(user.id);
    }
  }, [isLoaded, user, setAsAuthenticated]);

  useEffect(() => {
    const storedPaymentAmount = sessionStorage.getItem("paymentAmount");
    const storedTipAmount = sessionStorage.getItem("tipAmount");
    const storedBaseAmount = sessionStorage.getItem("baseAmount");
    const storedSelectedUsers = sessionStorage.getItem("selectedUsers");

    if (storedPaymentAmount) setPaymentAmount(parseFloat(storedPaymentAmount));
    if (storedTipAmount) setTipAmount(parseFloat(storedTipAmount));
    if (storedBaseAmount) setBaseAmount(parseFloat(storedBaseAmount));
    if (storedSelectedUsers) {
      try {
        setSelectedUsers(JSON.parse(storedSelectedUsers));
      } catch (e) {
        console.error('Error parsing selectedUsers from sessionStorage:', e);
      }
    }
  }, []);

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

  const tableTotalPrice = state.orders.reduce(
    (sum, order) => sum + parseFloat(order.total_price.toString()),
    0
  );

  const handlePaymentSuccess = async (paymentId: string, amount: number, type: string) => {
    try {
      // Marcar órdenes como pagadas
      if (selectedUsers.length > 0) {
        // Si hay usuarios específicos seleccionados, marcar solo sus órdenes
        console.log('🎯 Payment successful, marking orders as paid for SPECIFIC users:', selectedUsers);
        console.log('🔍 About to call markOrdersAsPaid with userNames:', selectedUsers);
        await markOrdersAsPaid(undefined, selectedUsers);
        console.log('✅ Specific user orders marked as paid successfully');
      } else {
        // Si no hay usuarios específicos, marcar todas las órdenes de la mesa
        console.log('🎉 Payment successful, marking ALL orders as paid for table:', state.tableNumber);
        console.log('🔍 About to call markOrdersAsPaid without parameters');
        await markOrdersAsPaid();
        console.log('✅ All orders marked as paid successfully');
      }

      // Store payment success data for payment-success page (prevent double execution)
      if (typeof window !== 'undefined') {
        const successData = {
          paymentId,
          amount,
          users: selectedUsers.length > 0 ? selectedUsers : null,
          tableNumber: state.tableNumber,
          type,
          alreadyProcessed: true // Flag to prevent double processing
        };
        console.log('💾 Storing payment success data for payment-success page:', successData);
        localStorage.setItem('xquisito-completed-payment', JSON.stringify(successData));
      }

    } catch (error) {
      console.error('❌ Error marking orders as paid:', error);
      // No bloquear la navegación si hay error marcando las órdenes
    } finally {
      // Navegar a la página de éxito
      navigateWithTable(`/payment-success?paymentId=${paymentId}&amount=${amount}&type=${type}&processed=true`);
    }
  };

  const handlePayment = async () => {
    if (!name.trim()) {
      alert("Please enter your name");
      return;
    }
    try {
      // Set guest and table info for API service
      if (isGuest && guestId) {
        apiService.setGuestInfo(guestId, state.tableNumber || undefined);
      }

      // Check if user has payment methods
      const paymentMethodsResult = await apiService.getPaymentMethods();

      if (!paymentMethodsResult.success) {
        throw new Error(paymentMethodsResult.error?.message || 'Failed to fetch payment methods');
      }

      if (!paymentMethodsResult.data?.paymentMethods || paymentMethodsResult.data.paymentMethods.length === 0) {
        // No payment methods, redirect to add card page
        alert('No payment methods found. Please add a payment method first.');
        navigateWithTable(`/add-card?amount=${paymentAmount}&users=${selectedUsers.join(',')}&tip=${tipAmount}`);
        return;
      }

      // Use the first/default payment method
      const paymentMethods = paymentMethodsResult.data.paymentMethods;
      const defaultPaymentMethod = paymentMethods.find(pm => pm.isDefault) || paymentMethods[0];

      // Process payment directly with saved payment method
      const paymentResult = await apiService.processPayment({
        paymentMethodId: defaultPaymentMethod.id,
        amount: paymentAmount,
        currency: 'USD',
        description: `Xquisito Restaurant Payment - Table ${state.tableNumber || 'N/A'} - Users: ${selectedUsers.join(', ')} - Tip: $${tipAmount.toFixed(2)}`,
        orderId: `order-${Date.now()}-attempt-${paymentAttempts + 1}`,
        tableNumber: state.tableNumber,
        restaurantId: 'xquisito-main'
      });

      if (!paymentResult.success) {
        throw new Error(paymentResult.error?.message || 'Payment processing failed');
      }

      const payment = paymentResult.data?.payment;
      const order = paymentResult.data?.order;

      if (payment?.type === 'direct_charge' || (payment && !payment.payLink && !order?.payLink)) {
        console.log('💳 Direct payment successful, proceeding to handlePaymentSuccess with userNames:', selectedUsers);
        await handlePaymentSuccess(payment.id, paymentAmount, 'direct');
        return;
      }

      // Check if we have a payLink (fallback to EcartPay verification)
      const payLink = order?.payLink || payment?.payLink;
      if (payLink) {
        // Store order details for later reference
        if (typeof window !== 'undefined') {
          const paymentData = {
            orderId: order?.id || payment?.id,
            amount: paymentAmount,
            users: selectedUsers.length > 0 ? selectedUsers : null,
            tableNumber: state.tableNumber,
            tip: tipAmount
          };

          console.log('💾 Storing payment data in localStorage:', paymentData);
          localStorage.setItem('xquisito-pending-payment', JSON.stringify(paymentData));
        }

        setPaymentAttempts(prev => prev + 1);

        // Show user-friendly message before redirect
        const shouldRedirect = confirm(
          `Your saved payment method requires verification through EcartPay.\n\n` +
          `This is normal in testing/sandbox mode. In production, this step is usually skipped.\n\n` +
          `Click OK to complete verification, or Cancel to try again.`
        );

        if (shouldRedirect) {
          window.location.href = payLink;
        }
        return;
      }

      if (payment || order) {
        const paymentId = payment?.id || order?.id || 'completed';
        console.log('✅ Payment completed successfully (no verification needed):', paymentId);
        await handlePaymentSuccess(paymentId, paymentAmount, 'saved-card');
        return;
      }

      throw new Error('Unexpected payment response format');

    } catch (error: any) {
      console.error('Payment error:', error);
      alert(`Payment failed: ${error.message}`);
    }
  };

  const handleAddCard = () => {
    navigateWithTable("/add-card");
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
            <div className="space-y-2 mb-4">
              <div className="mb-6">
                <span className="text-black text-xl font-semibold">
                  Mesa {state.tableNumber}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-black">Subtotal</span>
                <span className="text-black">
                  ${tableTotalPrice.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-black">Tu parte</span>
                <span className="text-black">${baseAmount.toFixed(2)}</span>
              </div>
              {tipAmount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-black">Propina</span>
                  <span className="text-black">${tipAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center border-t pt-2">
                <span className="text-lg font-bold text-black">Total</span>
                <span className="text-lg font-bold text-black">
                  ${paymentAmount.toFixed(2)}
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
                              {method.cardType === "credit" ? "C" :
                               method.cardType === "mastercard" ? "MC" :
                               method.cardType === "amex" ? "AX" : "•"}
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
              disabled={paymentLoading || !name.trim()}
              className={`w-full text-white py-3 rounded-full cursor-pointer transition-colors ${
                paymentLoading
                  ? "bg-stone-800 cursor-not-allowed"
                  : "bg-black hover:bg-stone-950"
              }`}
            >
              {paymentLoading || !name.trim()
                ? "Procesando pago..."
                : `Pagar: $${paymentAmount.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
