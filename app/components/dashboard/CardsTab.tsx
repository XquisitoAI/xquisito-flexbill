"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { usePayment } from "@/app/context/PaymentContext";
import { useTableNavigation } from "@/app/hooks/useTableNavigation";
import {
  Plus,
  CreditCard,
  Trash2,
  Star,
  StarOff,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { getCardTypeIcon } from "@/app/utils/cardIcons";

export default function CardsTab() {
  const router = useRouter();
  const { navigateWithTable } = useTableNavigation();
  const {
    paymentMethods,
    isLoading,
    hasPaymentMethods,
    setDefaultPaymentMethod,
    deletePaymentMethod,
  } = usePayment();

  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  // System default card
  const defaultSystemCard = {
    id: "system-default-card",
    lastFourDigits: "1234",
    cardBrand: "visa",
    cardType: "debit",
    isDefault: true,
    isSystemCard: true,
  };

  // Combine system default card with user payment methods
  const allPaymentMethods = useMemo(() => {
    return [defaultSystemCard, ...paymentMethods];
  }, [paymentMethods]);

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

  return (
    <div className="h-full flex flex-col">
      <div className="fixed bottom-0 left-0 right-0 flex flex-col flex-shrink-0 mx-6 md:mx-8 lg:mx-10 pb-6 md:pb-8 lg:pb-10 px-4 md:px-6 lg:px-8 z-50">
        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12 md:py-16 lg:py-20">
            <Loader2 className="size-8 md:size-10 lg:size-12 animate-spin text-teal-600" />
          </div>
        ) : (
          <>
            {/* Payment Methods List */}
            {hasPaymentMethods ? (
              <div className="space-y-2 md:space-y-3 lg:space-y-4">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className={`relative border rounded-full py-1.5 md:py-2 lg:py-2.5 px-5 md:px-6 lg:px-8 ${
                      method.isDefault
                        ? "border-teal-300 bg-teal-50"
                        : "border-black/50 bg-[#f9f9f9]"
                    }`}
                  >
                    {/* Default Badge */}
                    {method.isDefault && (
                      <div className="absolute -top-2 md:-top-2.5 lg:-top-3 left-4 md:left-5 lg:left-6 bg-teal-600 text-white text-xs md:text-sm lg:text-base px-2 md:px-3 lg:px-4 py-1 md:py-1.5 lg:py-2 rounded-full">
                        Por defecto
                      </div>
                    )}

                    <div className="flex items-center">
                      <div className="flex items-center gap-2 md:gap-3 lg:gap-4 mx-auto">
                        <div>
                          <span className="text-2xl md:text-3xl lg:text-4xl">
                            {getCardTypeIcon(method.cardBrand, "medium")}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
                            <span className="text-black text-base md:text-lg lg:text-xl">
                              **** **** **** {method.lastFourDigits}
                            </span>
                            <p className="text-xs md:text-sm lg:text-base text-gray-500">
                              {method.expiryMonth?.toString().padStart(2, "0")}/
                              {method.expiryYear?.toString().slice(-2)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center">
                        {/* Set Default Button */}
                        {!method.isDefault && (
                          <button
                            onClick={() => handleSetDefault(method.id)}
                            disabled={settingDefaultId === method.id}
                            className="text-gray-400 hover:text-teal-600 transition-colors disabled:opacity-50 cursor-pointer"
                            title="Establecer como predeterminada"
                          >
                            {settingDefaultId === method.id ? (
                              <Loader2 className="size-5 md:size-6 lg:size-7 animate-spin" />
                            ) : (
                              <StarOff className="size-5 md:size-6 lg:size-7" />
                            )}
                          </button>
                        )}

                        {method.isDefault && (
                          <div
                            className="text-teal-600"
                            title="Tarjeta predeterminada"
                          >
                            <Star className="size-5 md:size-6 lg:size-7 fill-current" />
                          </div>
                        )}

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteCard(method.id)}
                          disabled={deletingCardId === method.id}
                          className="p-2 md:p-2.5 lg:p-3 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50 cursor-pointer"
                          title="Eliminar tarjeta"
                        >
                          {deletingCardId === method.id ? (
                            <Loader2 className="size-5 md:size-6 lg:size-7 animate-spin" />
                          ) : (
                            <Trash2 className="size-5 md:size-6 lg:size-7" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="text-center py-12 md:py-16 lg:py-20">
                <div className="size-20 md:size-24 lg:size-28 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-5 lg:mb-6">
                  <CreditCard className="size-10 md:size-12 lg:size-14 text-gray-400" />
                </div>
                <h3 className="text-lg md:text-xl lg:text-2xl font-medium text-gray-900 mb-2 md:mb-3 lg:mb-4">
                  No tienes tarjetas guardadas
                </h3>
                <p className="text-gray-500 text-base md:text-lg lg:text-xl mb-6 md:mb-8 lg:mb-10">
                  Agrega una tarjeta para pagar más rápido en tus próximos
                  pedidos
                </p>
              </div>
            )}
          </>
        )}

        {/* Add New Card Button */}
        <button
          onClick={handleAddNewCard}
          className="mt-2 md:mt-3 lg:mt-4 border border-black/50 flex justify-center items-center gap-1 md:gap-1.5 lg:gap-2 w-full text-black text-base md:text-lg lg:text-xl py-3 md:py-4 lg:py-5 rounded-full cursor-pointer transition-colors bg-[#f9f9f9] hover:bg-gray-100"
        >
          <Plus className="size-5 md:size-6 lg:size-7" />
          Agregar nueva tarjeta
        </button>
      </div>
    </div>
  );
}
