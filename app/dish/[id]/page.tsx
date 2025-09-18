"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { findDishById } from "../../utils/menuData";
import { restaurantData } from "../../utils/restaurantData";
import { useTable } from "../../context/TableContext";
import { useTableNavigation } from "../../hooks/useTableNavigation";
import MenuHeaderBack from "@/app/components/MenuHeaderBack";
import { Minus, Plus } from "lucide-react";

export default function DishDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const dishId = parseInt(params.id as string);
  const { state, dispatch } = useTable();
  const { tableNumber, goBack } = useTableNavigation();

  useEffect(() => {
    if (!tableNumber) {
      // Redirigir a home si no hay número de mesa
      router.push("/");
      return;
    }

    if (isNaN(parseInt(tableNumber))) {
      // Redirigir si el número de mesa no es válido
      router.push("/");
      return;
    }

    // Establecer el número de mesa en el contexto
    dispatch({ type: "SET_TABLE_NUMBER", payload: tableNumber });
  }, [tableNumber, dispatch, router]);

  const dishData = findDishById(dishId);

  const handleAddToCart = () => {
    if (dishData) {
      dispatch({ type: "ADD_ITEM_TO_CURRENT_USER", payload: dishData.dish });
    }
  };

  const handleRemoveFromCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!dishData) return;
    const cartItem = state.currentUserItems.find(
      (cartItem) => cartItem.id === dishData.dish.id
    );
    if (cartItem && cartItem.quantity > 1) {
      dispatch({
        type: "UPDATE_QUANTITY_CURRENT_USER",
        payload: { id: dishData.dish.id, quantity: cartItem.quantity - 1 },
      });
    } else if (cartItem && cartItem.quantity === 1) {
      dispatch({ type: "REMOVE_ITEM_FROM_CURRENT_USER", payload: dishData.dish.id });
    }
  };

  const currentQuantity = dishData
    ? state.currentUserItems.find((cartItem) => cartItem.id === dishData.dish.id)
        ?.quantity || 0
    : 0;

  if (!tableNumber || isNaN(parseInt(tableNumber))) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Mesa Inválida
          </h1>
          <p className="text-gray-600">Por favor escanee el código QR</p>
        </div>
      </div>
    );
  }

  if (!dishData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a8b9b] to-[#153f43] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Platillo no encontrado
          </h1>
          <button
            onClick={() => goBack()}
            className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Volver al menú
          </button>
        </div>
      </div>
    );
  }

  const { dish, category } = dishData;

  return (
    <div className="min-h-screen bg-white relative">
      <img
        src={dish.images[0]}
        alt=""
        className="absolute top-0 left-0 w-full h-96 object-cover z-0"
      />

      <MenuHeaderBack restaurant={restaurantData} tableNumber={tableNumber} />

      <main className="mt-72 relative z-10">
        {/* Contenido principal */}
        <div className="bg-white rounded-t-4xl flex flex-col px-6">
          {/* Información del platillo */}
          <div className="mt-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-3xl font-semibold text-black">{dish.name}</h2>
              <span className="text-3xl font-semibold text-black">
                ${dish.price.toFixed(2)}
              </span>
            </div>

            <div className="flex gap-1 mt-1 mb-3">
              {dish.features.map((feature, index) => (
                <div
                  key={index}
                  className="text-sm text-black font-semibold border border-[#bfbfbf]/50 rounded-3xl px-3 py-1 shadow-sm"
                >
                  {feature}
                </div>
              ))}
            </div>

            <p className="text-black text-base leading-relaxed mb-6">
              {dish.description}
            </p>

            {/* Secciones adicionales */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="divide-y divide-[#8e8e8e]">
                <h3 className="font-bold text-black pb-2 mb-2 text-xl">
                  Ingredientes
                </h3>
                <p className="text-black">
                  Información de ingredientes próximamente...
                </p>
              </div>

              <div className="divide-y divide-[#8e8e8e]">
                <h3 className="font-bold text-black pb-2 mb-2 text-xl">
                  Extras
                </h3>
                <p className="text-black">Extras próximamente...</p>
              </div>
            </div>

            {/* Comentarios Textarea */}
            <div className="text-black">
              <span className="font-bold text-xl">
                ¿Algo que debamos saber?
              </span>
              <textarea
                name=""
                id=""
                className="h-24 text-base w-full bg-[#f9f9f9] border border-[#bfbfbf] px-3 py-2 rounded-lg resize-none focus:outline-none mt-2"
                placeholder="Alergias, instrucciones especiales, comentarios..."
              ></textarea>
            </div>

            <div className="flex gap-3 mt-6">
              {/* Botón de agregar al pedido */}
              <button
                onClick={handleAddToCart}
                className="bg-black hover:bg-stone-950 w-full text-white py-3 rounded-full cursor-pointer transition-colors mb-6"
              >
                Agregar al carrito
              </button>

              <div className="flex gap-2.5 px-6 py-3 h-fit bg-[#f9f9f9] rounded-full border border-[#8e8e8e]/50 font-thin items-center justify-center">
                <Minus
                  className={`size-4 ${currentQuantity > 0 ? "cursor-pointer text-black" : "cursor-no-drop text-black/50"}`}
                  onClick={
                    currentQuantity > 0 ? handleRemoveFromCart : undefined
                  }
                />
                <p className="text-black">{currentQuantity}</p>
                <Plus
                  className="size-4 cursor-pointer text-black"
                  onClick={handleAddToCart}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
