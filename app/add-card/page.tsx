"use client";

// NOTE: This page is maintained for users who want to manage payment methods separately
// Main payment flows now use EcartPay SDK directly in payment/page.tsx and add-tip/page.tsx

import { useRouter } from "next/navigation";
import { useTable } from "../context/TableContext";
import { useTableNavigation } from "../hooks/useTableNavigation";
import { useGuest, useIsGuest } from "../context/GuestContext";
import { usePayment } from "../context/PaymentContext";
import MenuHeader from "../components/MenuHeader";
import { getRestaurantData } from "../utils/restaurantData";
import { useState } from "react";
import { apiService } from "../utils/api";
import MenuHeaderBack from "../components/MenuHeaderBack";

export default function AddCardPage() {
  const { state } = useTable();
  const { goBack, navigateWithTable } = useTableNavigation();
  const router = useRouter();
  const restaurantData = getRestaurantData();
  const isGuest = useIsGuest();
  const { guestId, tableNumber } = useGuest();
  const { addPaymentMethod, refreshPaymentMethods } = usePayment();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expDate, setExpDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [country, setCountry] = useState("Mexico");
  const [postalCode, setPostalCode] = useState("");
  const [postalCodeError, setPostalCodeError] = useState("");

  // Función para validar que solo se ingresen caracteres de texto válidos para nombres
  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Expresión regular que permite letras, espacios, acentos y algunos caracteres especiales comunes en nombres
    const textOnlyRegex = /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s'-]*$/;

    // Solo actualiza el estado si el valor cumple con la validación o está vacío
    if (textOnlyRegex.test(value)) {
      setFullName(value);
    }
  };

  // Función para validar caracteres válidos en email
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Expresión regular que permite caracteres válidos para emails
    const emailCharsRegex = /^[a-zA-Z0-9@._-]*$/;

    // Solo actualiza el estado si el valor contiene caracteres válidos para email
    if (emailCharsRegex.test(value)) {
      setEmail(value);
    }
  };

  const fillTestCard = () => {
    setFullName("Test User");
    setEmail("test@example.com");
    setCardNumber("4242 4242 4242 4242");
    setExpDate("12/25");
    setCvv("123");
    setCountry("Mexico");
    setPostalCode("76900");
  };

  const validatePostalCode = (code: string, country: string) => {
    const patterns = {
      Mexico: /^\d{5}$/,
      USA: /^\d{5}(-\d{4})?$/,
      Canada: /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/i,
      UK: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i,
    };

    return patterns[country as keyof typeof patterns]?.test(code) || false;
  };

  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      alert("Please enter your full name");
      return;
    }
    if (!email.trim()) {
      alert("Please enter your email address");
      return;
    }
    if (!validateEmail(email)) {
      alert("Please enter a valid email address");
      return;
    }
    if (!cardNumber.trim()) {
      alert("Please enter card number");
      return;
    }
    if (!expDate.trim()) {
      alert("Please enter expiration date");
      return;
    }
    if (!cvv.trim()) {
      alert("Please enter CVV");
      return;
    }
    if (!postalCode.trim()) {
      alert("Please enter postal code");
      return;
    }

    if (!validatePostalCode(postalCode, country)) {
      alert(`Please enter a valid postal code for ${country}`);
      return;
    }

    setIsLoading(true);

    try {
      // Ensure the API service has the correct guest context
      if (isGuest && guestId && tableNumber) {
        apiService.setGuestInfo(guestId, tableNumber.toString());
      }

      const result = await apiService.addPaymentMethod({
        fullName,
        email,
        cardNumber,
        expDate,
        cvv,
        country,
        postalCode,
      });

      if (result.success) {
        // Add the new payment method to the context if it exists
        if (result.data?.paymentMethod) {
          addPaymentMethod(result.data.paymentMethod);
        } else {
          // Fallback: refresh payment methods from API
          await refreshPaymentMethods();
        }
        alert("Card added successfully!");
        router.back();
      } else {
        alert(result.error?.message || "Failed to add card. Please try again.");
      }
    } catch (error) {
      console.error("Error saving card:", error);
      alert("Failed to add card. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  const formatExpDate = (value: string) => {
    const v = value.replace(/\D/g, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Solo permitir números y espacios para el formato de tarjeta
    const numbersOnlyRegex = /^[0-9\s]*$/;

    if (numbersOnlyRegex.test(value)) {
      const formatted = formatCardNumber(value);
      setCardNumber(formatted);
    }
  };

  const handleExpDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Solo permitir números y "/" para la fecha de expiración
    const expDateRegex = /^[0-9/]*$/;

    if (expDateRegex.test(value)) {
      const formatted = formatExpDate(value);
      setExpDate(formatted);
    }
  };

  // Validación mejorada para CVV - solo números
  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Solo permitir números
    const numbersOnlyRegex = /^[0-9]*$/;

    if (numbersOnlyRegex.test(value)) {
      setCvv(value.substring(0, 4)); // Máximo 4 dígitos
    }
  };

  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPostalCode(value);
    setPostalCodeError("");

    if (value.trim() && !validatePostalCode(value, country)) {
      const formats = {
        Mexico: "5 digits (e.g., 83120)",
        USA: "5 digits or 5+4 format (e.g., 12345 or 12345-6789)",
        Canada: "Format: A1A 1A1",
        UK: "UK format (e.g., SW1A 1AA)",
      };
      setPostalCodeError(
        `Invalid format. Expected: ${formats[country as keyof typeof formats]}`
      );
    }
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCountry(e.target.value);
    setPostalCode("");
    setPostalCodeError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a8b9b] to-[#153f43]">
      <MenuHeaderBack
        restaurant={restaurantData}
        tableNumber={state.tableNumber}
      />

      <div className="px-4 w-full flex-1 flex flex-col">
        <div className="left-4 right-4 bg-gradient-to-tl from-[#0a8b9b] to-[#1d727e] rounded-t-4xl translate-y-7 z-0">
          <div className="py-6 px-8 flex flex-col justify-center">
            <h2 className="font-bold text-white text-3xl leading-7 mt-2 mb-6">
              Agrega tu tarjeta para continuar
            </h2>
          </div>
        </div>
        {/* Guest User Indicator */}
        {/* {isGuest && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <p className="text-green-800 font-medium text-sm">Secure Guest Payment</p>
                <p className="text-green-600 text-xs">
                  {tableNumber ? `Table ${tableNumber}` : 'Guest session'} • Your card will be tokenized securely
                </p>
              </div>
            </div>
          </div>
        )} */}

        <div className="flex-1 h-full flex flex-col">
          <div className="bg-white rounded-t-4xl flex-1 z-5 flex flex-col px-6 py-6">
            {/* Test Card Helper */}
            {process.env.NODE_ENV === "development" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-800 font-medium text-sm">
                      Development Mode
                    </p>
                    <p className="text-blue-600 text-xs">
                      Use eCartpay test card data
                    </p>
                  </div>
                  <button
                    onClick={fillTestCard}
                    className="px-3 py-2 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Fill Test Card
                  </button>
                </div>
              </div>
            )}

            {/* Add Card Form */}
            <div className="space-y-4">
              {/* Full Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electronico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              {/* Card Number Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de tarjeta
                </label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  placeholder="**** 2098"
                  maxLength={19}
                  className="w-full px-3 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-600"
                />
              </div>

              {/* Exp Date Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de expiración
                </label>
                <input
                  type="text"
                  value={expDate}
                  onChange={handleExpDateChange}
                  placeholder="02/24"
                  maxLength={5}
                  className="w-full px-3 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-600"
                />
              </div>

              {/* CVV Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CVV
                </label>
                <input
                  type="text"
                  value={cvv}
                  onChange={(e) =>
                    setCvv(e.target.value.replace(/\D/g, "").substring(0, 4))
                  }
                  placeholder="123"
                  maxLength={4}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              {/* Country Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pais
                </label>
                <div className="relative">
                  <select
                    value={country}
                    onChange={handleCountryChange}
                    className="w-full px-3 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-600 appearance-none"
                  >
                    <option value="Mexico">🇲🇽 Mexico</option>
                    <option value="USA">🇺🇸 United States</option>
                    <option value="Canada">🇨🇦 Canada</option>
                    <option value="UK">🇬🇧 United Kingdom</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Postal Code Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código Postal
                </label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={handlePostalCodeChange}
                  placeholder={
                    country === "Mexico"
                      ? "83120"
                      : country === "USA"
                        ? "12345"
                        : country === "Canada"
                          ? "A1A 1A1"
                          : "SW1A 1AA"
                  }
                  className={`w-full px-3 py-3 bg-gray-100 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-600 ${postalCodeError ? "border-red-300" : "border-gray-200"}`}
                />
                {postalCodeError && (
                  <p className="mt-1 text-sm text-red-600">{postalCodeError}</p>
                )}
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="bg-black hover:bg-stone-950 w-full text-white py-3 rounded-full font-medium cursor-pointer transition-colors mt-8 disabled:bg-stone-600 disabled:cursor-not-allowed"
            >
              {isLoading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
