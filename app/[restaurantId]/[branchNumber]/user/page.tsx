"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart, CartItem } from "@/app/context/CartContext";
import { useTable } from "@/app/context/TableContext";
import { useTableNavigation } from "@/app/hooks/useTableNavigation";
import { getRestaurantData } from "@/app/utils/restaurantData";
import MenuHeaderBack from "@/app/components/headers/MenuHeaderBack";
import { Loader2 } from "lucide-react";
import OrderAnimation from "@/app/components/UI/OrderAnimation";
import { useValidateAccess } from "@/app/hooks/useValidateAccess";
import ValidationError from "@/app/components/ValidationError";
import Loader from "@/app/components/UI/Loader";

export default function UserPage() {
  const [userName, setUserName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOrderAnimation, setShowOrderAnimation] = useState(false);
  const [orderedItems, setOrderedItems] = useState<CartItem[]>([]);
  const [orderUserName, setOrderUserName] = useState("");
  const { state: cartState, clearCart } = useCart();
  const { state, dispatch, submitOrder } = useTable();
  const { tableNumber, navigateWithTable } = useTableNavigation();
  const router = useRouter();
  const restaurantData = getRestaurantData();
  const { validationError, isValidating, restaurantId, branchNumber } = useValidateAccess();

  // Mostrar error de validación si existe
  if (validationError) {
    return <ValidationError errorType={validationError as any} />;
  }

  // Mostrar loader mientras valida
  if (isValidating) {
    return <Loader />;
  }

  // Función para validar que solo se ingresen caracteres de texto válidos para nombres
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const textOnlyRegex = /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s'-]*$/;

    if (textOnlyRegex.test(value)) {
      setUserName(value);
    }
  };

  const handleProceedToOrder = async () => {
    if (userName.trim()) {
      setIsSubmitting(true);
      // Guardar items antes de que se limpie el carrito
      const itemsToOrder = [...cartState.items];
      setOrderedItems(itemsToOrder);
      setOrderUserName(userName.trim());
      // Mostrar animación de orden INMEDIATAMENTE (sin enviar la orden aún)
      setShowOrderAnimation(true);
    }
  };

  const handleContinueFromAnimation = () => {
    navigateWithTable("/order");
  };

  const handleCancelOrder = () => {
    console.log("❌ Order cancelled by user");
    setShowOrderAnimation(false);
    setOrderedItems([]);
    setOrderUserName("");
    setIsSubmitting(false);
  };

  const handleConfirmOrder = async () => {
    // Esta función se ejecuta después de que expira el período de cancelación
    if (orderUserName && orderedItems.length > 0) {
      try {
        console.log("🛍️ Submitting order for guest user:", orderUserName);

        // Enviar la orden a la API con branchNumber
        await submitOrder(orderUserName, orderedItems, branchNumber?.toString());
        // Limpiar el carrito de la base de datos después de la orden exitosa
        await clearCart();
      } catch (error) {
        console.error("Error submitting order:", error);
        // Si hay error, ocultar la animación
        setShowOrderAnimation(false);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (!tableNumber || isNaN(parseInt(tableNumber))) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center px-4 md:px-6 lg:px-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-meduim text-gray-800 mb-4 md:mb-6">
            Mesa Inválida
          </h1>
          <p className="text-gray-600 text-base md:text-lg lg:text-xl">
            Por favor escanee el código QR
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-gradient-to-br from-[#0a8b9b] to-[#153f43] flex flex-col">
      <MenuHeaderBack
        restaurant={restaurantData}
        tableNumber={state.tableNumber}
      />

      <div className="px-4 md:px-6 lg:px-8 w-full flex-1 flex flex-col">
        <div className="left-4 right-4 bg-gradient-to-tl from-[#0a8b9b] to-[#1d727e] rounded-t-4xl translate-y-7 z-0">
          <div className="py-6 md:py-8 lg:py-10 px-8 md:px-10 lg:px-12 flex flex-col justify-center">
            <h2 className="font-medium text-white text-3xl md:text-4xl lg:text-5xl leading-7 md:leading-9 lg:leading-tight mt-2 md:mt-3 mb-6 md:mb-8">
              Ingresa tu nombre para continuar
            </h2>
          </div>
        </div>

        <div className="flex-1 h-full flex flex-col">
          <div className="bg-white rounded-t-4xl flex-1 z-5 flex flex-col px-6 md:px-8 lg:px-10">
            <div className="flex-1 flex flex-col items-center w-full h-full pb-[120px] md:pb-[140px] lg:pb-[160px]">
              <div className="pt-48 md:pt-56 lg:pt-64 mb-6 md:mb-8">
                <h2 className="text-lg md:text-xl lg:text-2xl font-medium text-black">
                  Tu nombre
                </h2>
              </div>

              <div className="w-full">
                <input
                  type="text"
                  placeholder="Nombre"
                  value={userName}
                  onChange={handleNameChange}
                  className="w-full px-4 md:px-5 lg:px-6 py-3 md:py-4 lg:py-5 border-0 border-b border-black text-black text-2xl md:text-3xl lg:text-4xl text-center font-medium focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed bottom button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center py-4 md:py-5 lg:py-6">
        <div className="mx-4 md:mx-6 lg:mx-8 w-full max-w-full px-4 md:px-6 lg:px-8">
          <button
            onClick={handleProceedToOrder}
            disabled={!userName.trim() || isSubmitting}
            className={`w-full py-3 md:py-4 lg:py-5 rounded-full transition-colors text-white cursor-pointer text-base md:text-lg lg:text-xl ${
              userName.trim() && !isSubmitting
                ? "bg-gradient-to-r from-[#34808C] to-[#173E44]"
                : "bg-gradient-to-r from-[#34808C] to-[#173E44] opacity-50 cursor-not-allowed"
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2 md:gap-3">
                <Loader2 className="h-5 w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 animate-spin" />
              </div>
            ) : (
              "Continuar"
            )}
          </button>
        </div>
      </div>

      {/* User Form */}
      {/*<div className="max-w-md mx-auto px-4 pb-32">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-800 mb-2">
              Enter your name
            </h2>
            <p className="text-sm text-gray-600">
              We need your name to process your order
            </p>
          </div>

          <div className="mb-6">
            <input
              type="text"
              placeholder="Your name"
              value={userName}
              onChange={handleNameChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>*/}

      {/* Order Button - Fixed at bottom */}
      {/*<div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleProceedToOrder}
            disabled={!userName.trim() || state.isLoading}
            className={`w-full py-4 rounded-lg font-medium transition-colors ${
              userName.trim() && !state.isLoading
                ? "bg-teal-700 text-white hover:bg-teal-800"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {state.isLoading
              ? "Placing Order..."
              : `Order ${state.currentUserTotalItems} items`}
          </button>
        </div>
      </div>*/}

      {/* OrderAnimation overlay - para usuarios invitados */}
      {showOrderAnimation && (
        <OrderAnimation
          userName={orderUserName}
          orderedItems={orderedItems}
          onContinue={handleContinueFromAnimation}
          onCancel={handleCancelOrder}
          onConfirm={handleConfirmOrder}
        />
      )}
    </div>
  );
}
