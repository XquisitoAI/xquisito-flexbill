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

export default function CardSelectionPage() {
  const { state, addPayment } = useTable();
  const { navigateWithTable } = useTableNavigation();
  const searchParams = useSearchParams();
  const restaurantData = getRestaurantData();
  const isGuest = useIsGuest();
  const { guestId, tableNumber, setAsAuthenticated } = useGuest();
  const { hasPaymentMethods } = usePayment();
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

  const [paymentAmount, setPaymentAmount] = useState(0);
  const [tipAmount, setTipAmount] = useState(0);
  const [baseAmount, setBaseAmount] = useState(0);

  useEffect(() => {
    if (isLoaded && user) {
      setAsAuthenticated(user.id);
    }
  }, [isLoaded, user, setAsAuthenticated]);

  useEffect(() => {
    const storedPaymentAmount = sessionStorage.getItem("paymentAmount");
    const storedTipAmount = sessionStorage.getItem("tipAmount");
    const storedBaseAmount = sessionStorage.getItem("baseAmount");

    if (storedPaymentAmount) setPaymentAmount(parseFloat(storedPaymentAmount));
    if (storedTipAmount) setTipAmount(parseFloat(storedTipAmount));
    if (storedBaseAmount) setBaseAmount(parseFloat(storedBaseAmount));
  }, []);

  const tableTotalPrice = state.orders.reduce(
    (sum, order) => sum + parseFloat(order.total_price.toString()),
    0
  );

  const handlePayment = async () => {
    if (!name.trim()) {
      alert("Please enter your name");
      return;
    }
    try {
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

      const userEmail = email.trim() || "guest@xquisito.com";
      const [firstName, ...lastNameParts] = name.trim().split(" ");
      const lastName = lastNameParts.join(" ") || "User";

      const checkoutOptions: EcartPayCheckoutOptions = {
        publicID: publicKey,
        order: {
          email: userEmail,
          first_name: firstName,
          last_name: lastName,
          phone: "5551234567",
          currency: "USD",
          items: [
            {
              name: `Xquisito Restaurant`,
              price: paymentAmount,
              quantity: 1,
            },
          ],
        },
      };

      console.log(
        "🚀 Initiating EcartPay checkout with options:",
        checkoutOptions
      );

      const result = await createCheckout(checkoutOptions);

      console.log("💳 EcartPay checkout result:", result);

      if (result.success && result.payment) {
        console.log("✅ Payment successful:", result.payment.id);

        // Record the payment in table context
        addPayment({
          userName: name,
          amount: paymentAmount,
          paymentType: paymentType,
        });

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

        sessionStorage.removeItem("tipPercentage");
        sessionStorage.removeItem("customTip");
        sessionStorage.removeItem("tipAmount");
        sessionStorage.removeItem("baseAmount");
        sessionStorage.removeItem("paymentAmount");
        sessionStorage.removeItem("selectedItems");
        sessionStorage.removeItem("customPaymentAmount");

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
        {/* Customer Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Información del cliente
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre completo
              </label>
              <input
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="Tu nombre completo"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email (opcional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Payment Method Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-sm font-medium text-gray-800 mb-4">
            Selecciona tu método de pago
          </h3>

          <button
            onClick={handleAddCard}
            className="w-full bg-gray-800 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            Add card
          </button>
        </div>

        {/* Payment Summary */}
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

        {/* Pay Button */}
        <button
          onClick={handlePayment}
          disabled={paymentLoading || !name.trim()}
          className={`w-full py-4 rounded-lg font-semibold text-lg transition-colors ${
            paymentLoading
              ? "bg-gray-400 text-gray-600 cursor-not-allowed"
              : "bg-teal-700 text-white hover:bg-teal-800"
          }`}
        >
          {paymentLoading || !name.trim()
            ? "Procesando pago..."
            : `Pagar: $${paymentAmount.toFixed(2)}`}
        </button>
      </div>
    </div>
  );
}
