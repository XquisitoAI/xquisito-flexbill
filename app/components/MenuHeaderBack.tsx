"use client";

import { Restaurant } from "../interfaces/restaurante";
import { useTable } from "../context/TableContext";
import { useTableNavigation } from "../hooks/useTableNavigation";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingCart, Receipt, ChevronLeft, X } from "lucide-react";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";

interface MenuHeaderProps {
  restaurant: Restaurant;
  tableNumber?: string;
}

export default function MenuHeaderBack({
  restaurant,
  tableNumber,
}: MenuHeaderProps) {
  const router = useRouter();
  const { state } = useTable();
  const { navigateWithTable, goBack } = useTableNavigation();
  const pathname = usePathname();
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  const { user, isLoaded } = useUser();

  const handleBack = () => {
    router.back();
  };

  const handleCartClick = () => {
    navigateWithTable("/cart");
  };

  // Extraer participantes únicos de usuarios activos y órdenes de platillos
  const participants = Array.from(
    new Set([
      // Obtener usuarios activos (verificar que sea array)
      ...(Array.isArray(state.activeUsers) ? state.activeUsers.map((user) => user.guest_name) : []),
      // También obtener de platillos por si hay algún usuario no registrado en activeUsers
      ...(Array.isArray(state.dishOrders) ? state.dishOrders.map((order) => order.guest_name) : [])
    ])
  ).filter(Boolean);

  const visibleParticipants = participants.slice(0, 2);
  const remainingCount = participants.length - 2;

  // Generar inicial
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  // Generar colos segun el nombre (siempre el mismo color para ese nombre)
  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-red-500",
      "bg-yellow-500",
      "bg-teal-500",
      "bg-orange-500",
      "bg-cyan-500",
      "bg-emerald-500",
      "bg-violet-500",
      "bg-rose-500",
      "bg-lime-500",
      "bg-amber-500",
      "bg-sky-500",
      "bg-fuchsia-500",
      "bg-slate-500",
      "bg-zinc-500",
      "bg-neutral-500",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <header className="container mx-auto px-5 pt-5 z-10">
      <div className="relative flex items-center justify-between z-10">
        {/* Back */}
        <div className="flex items-center z-10">
          <div
            onClick={handleBack}
            className="size-10 bg-white border border-gray-300 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
          >
            <ChevronLeft className="text-primary" />
          </div>
        </div>

        {/* Xquisito Logo */}
        <div className="absolute left-1/2 transform -translate-x-1/2 size-10">
          <img src="/logo-short-green.webp" alt="Xquisito Logo" />
        </div>

        {/* Participantes */}
        {!isLoaded ? (
          // Loading
          <div className="flex items-center space-x-1">
            <div className="size-10 bg-gray-300 animate-pulse rounded-full border border-white shadow-sm"></div>
          </div>
        ) : participants.length > 0 ? (
          <div className="flex items-center space-x-1">
            {remainingCount > 0 && (
              <div
                onClick={() => setIsParticipantsModalOpen(true)}
                className="size-10 bg-white rounded-full flex items-center justify-center text-black text-base font-semibold border border-[#8e8e8e] shadow-sm cursor-pointer"
              >
                +{remainingCount}
              </div>
            )}
            {visibleParticipants.map((participant, index) => {
              return (
                <div
                  key={participant}
                  onClick={() => setIsParticipantsModalOpen(true)}
                  className={`size-10 rounded-full flex items-center justify-center text-white text-base font-semibold border border-white shadow-sm cursor-pointer overflow-hidden ${getAvatarColor(participant)}`}
                  style={{
                    marginLeft: remainingCount > 0 || index > 0 ? "-12px" : "0",
                  }}
                >
                  {getInitials(participant)}
                </div>
              );
            })}
          </div>
        ) : null}

        {/* Cart and order buttons - Available if needed */}
      </div>

      {/* Modal participantes */}
      {isParticipantsModalOpen && (
        <div
          className="fixed inset-0 flex items-end justify-center"
          style={{ zIndex: 99999 }}
        >
          {/* Fondo */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsParticipantsModalOpen(false)}
          ></div>

          {/* Modal */}
          <div className="relative bg-white rounded-t-4xl w-full mx-4">
            {/* Titulo */}
            <div className="px-6 pt-4">
              <div className="flex items-center justify-between pb-4 border-b border-[#8e8e8e]">
                <h3 className="text-lg font-semibold text-black">
                  Participantes
                </h3>
                <button
                  onClick={() => setIsParticipantsModalOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                >
                  <X className="size-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Lista de participantes */}
            <div className="px-6 py-4 space-y-3 max-h-80 overflow-y-auto">
              {participants.map((participant) => {
                return (
                  <div key={participant} className="flex items-center gap-3">
                    <div
                      className={`size-12 rounded-full flex items-center justify-center text-white text-base font-semibold overflow-hidden ${getAvatarColor(participant)}`}
                    >
                      {getInitials(participant)}
                    </div>
                    <div>
                      <p className="font-medium text-black">{participant}</p>
                      <p className="text-sm text-[#8e8e8e]">
                        {(() => {
                          const userOrders = Array.isArray(state.dishOrders)
                            ? state.dishOrders.filter((order) => order.guest_name === participant)
                            : [];

                          const dishCount = userOrders.length;
                          const totalValue = userOrders.reduce((sum, order) => sum + order.total_price, 0);

                          // También mostrar información de activeUsers si está disponible
                          const activeUser = Array.isArray(state.activeUsers)
                            ? state.activeUsers.find((user) => user.guest_name === participant)
                            : null;

                          if (dishCount === 0 && activeUser) {
                            return "Usuario activo en mesa";
                          }

                          return `${dishCount} ${dishCount === 1 ? "platillo" : "platillos"} • $${totalValue.toFixed(2)}`;
                        })()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
