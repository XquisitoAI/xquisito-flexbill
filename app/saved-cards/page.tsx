"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useTable } from "../context/TableContext";
import { useTableNavigation } from "../hooks/useTableNavigation";
import { usePayment } from "../context/PaymentContext";
import { getRestaurantData } from "../utils/restaurantData";
import MenuHeaderBack from "../components/MenuHeaderBack";
import {
  Plus,
  CreditCard,
  Trash2,
  Star,
  StarOff,
  AlertTriangle,
  LoaderIcon,
} from "lucide-react";

export default function SavedCardsPage() {
  const { user, isLoaded } = useUser();
  const { state } = useTable();
  const { navigateWithTable } = useTableNavigation();
  const router = useRouter();
  const restaurantData = getRestaurantData();
  const {
    paymentMethods,
    isLoading,
    hasPaymentMethods,
    setDefaultPaymentMethod,
    deletePaymentMethod,
  } = usePayment();

  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  const handleAddNewCard = () => {
    navigateWithTable("/add-card");
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    setSettingDefaultId(paymentMethodId);
    try {
      await setDefaultPaymentMethod(paymentMethodId);
    } catch (error) {
      alert("Error al establecer tarjeta por defecto. Intenta de nuevo.");
    } finally {
      setSettingDefaultId(null);
    }
  };

  const handleDeleteCard = async (paymentMethodId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta tarjeta?")) {
      return;
    }

    setDeletingCardId(paymentMethodId);
    try {
      await deletePaymentMethod(paymentMethodId);
    } catch (error) {
      alert("Error al eliminar la tarjeta. Intenta de nuevo.");
    } finally {
      setDeletingCardId(null);
    }
  };

  const getCardIcon = (cardType: string) => {
    switch (cardType) {
      case "visa":
        return "💳";
      case "mastercard":
        return "🔴";
      case "amex":
        return "🔵";
      default:
        return "💳";
    }
  };

  // Loading state
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a8b9b] to-[#153f43] flex items-center justify-center">
        <div className="animate-pulse">
          <img
            src="/logo-short-green.webp"
            alt="Xquisito Logo"
            className="size-24 justify-self-center"
          />
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a8b9b] to-[#153f43] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Acceso denegado
          </h1>
          <p className="text-white mb-6">
            Inicia sesión para ver tus tarjetas guardadas
          </p>
          <button
            onClick={() => navigateWithTable("/checkout")}
            className="bg-black hover:bg-stone-950 w-full text-white py-3 rounded-full cursor-pointer transition-colors"
          >
            Ir a Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

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
              Mis tarjetas guardadas
            </h2>
          </div>
        </div>

        <div className="flex-1 h-full flex flex-col">
          <div className="bg-white rounded-t-4xl flex-1 z-5 flex flex-col px-6 py-6">
            {/* Add New Card Button */}
            <button
              onClick={handleAddNewCard}
              className="w-full bg-teal-50 border-2 border-dashed border-teal-300 rounded-lg p-4 mb-6 hover:bg-teal-100 transition-colors"
            >
              <div className="flex items-center justify-center gap-3">
                <Plus className="size-6 text-teal-600" />
                <span className="text-teal-700 font-medium">
                  Agregar nueva tarjeta
                </span>
              </div>
            </button>

            {/* Loading State */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <LoaderIcon className="size-8 animate-spin text-teal-600" />
              </div>
            ) : (
              <>
                {/* Payment Methods List */}
                {hasPaymentMethods ? (
                  <div className="space-y-4">
                    {paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        className={`relative border rounded-lg p-4 ${
                          method.isDefault
                            ? "border-teal-300 bg-teal-50"
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        {/* Default Badge */}
                        {method.isDefault && (
                          <div className="absolute -top-2 left-4 bg-teal-600 text-white text-xs px-2 py-1 rounded-full">
                            Por defecto
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="size-12 bg-gray-100 rounded-lg flex items-center justify-center">
                              <span className="text-2xl">
                                {getCardIcon(method.cardType)}
                              </span>
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900 capitalize">
                                  {method.cardType}
                                </span>
                                <span className="text-gray-600">
                                  •••• {method.lastFourDigits}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500">
                                {method.cardholderName}
                              </p>
                              <p className="text-sm text-gray-500">
                                Expira {method.expiryMonth?.toString().padStart(2, '0')}/{method.expiryYear?.toString().slice(-2)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Set Default Button */}
                            {!method.isDefault && (
                              <button
                                onClick={() => handleSetDefault(method.id)}
                                disabled={settingDefaultId === method.id}
                                className="p-2 text-gray-400 hover:text-teal-600 transition-colors disabled:opacity-50"
                                title="Establecer como predeterminada"
                              >
                                {settingDefaultId === method.id ? (
                                  <LoaderIcon className="size-5 animate-spin" />
                                ) : (
                                  <StarOff className="size-5" />
                                )}
                              </button>
                            )}

                            {method.isDefault && (
                              <div className="p-2 text-teal-600" title="Tarjeta predeterminada">
                                <Star className="size-5 fill-current" />
                              </div>
                            )}

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteCard(method.id)}
                              disabled={deletingCardId === method.id}
                              className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                              title="Eliminar tarjeta"
                            >
                              {deletingCardId === method.id ? (
                                <LoaderIcon className="size-5 animate-spin" />
                              ) : (
                                <Trash2 className="size-5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Empty State */
                  <div className="text-center py-12">
                    <div className="size-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CreditCard className="size-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No tienes tarjetas guardadas
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Agrega una tarjeta para pagar más rápido en tus próximos
                      pedidos
                    </p>
                    <button
                      onClick={handleAddNewCard}
                      className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      Agregar mi primera tarjeta
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Security Notice */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="size-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-blue-800 font-medium text-sm">
                    Seguridad garantizada
                  </p>
                  <p className="text-blue-600 text-xs mt-1">
                    Tus datos de tarjeta están protegidos con encriptación de
                    nivel bancario. Solo almacenamos tokens seguros, nunca
                    información sensible.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}