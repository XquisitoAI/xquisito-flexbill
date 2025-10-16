"use client";

import {
  MenuItem as MenuItemDB,
  MenuItemData,
} from "../interfaces/menuItemData";
import { useTable } from "../context/TableContext";
import { useTableNavigation } from "../hooks/useTableNavigation";
import { useFlyToCart } from "../hooks/useFlyToCart";
import { useRestaurant } from "../context/RestaurantContext";
import { Plus, Minus } from "lucide-react";
import { useRef, useState, useEffect, useMemo } from "react";
import RestaurantClosedModal from "./RestaurantClosedModal";

interface MenuItemProps {
  item: MenuItemDB | MenuItemData;
}

export default function MenuItem({ item }: MenuItemProps) {
  // Adaptar el item de BD al formato legacy
  const adaptedItem: MenuItemData = useMemo(() => {
    // Si ya tiene el formato legacy, devolverlo tal cual
    if ("images" in item && "features" in item) {
      return item as MenuItemData;
    }

    // Convertir de formato BD a formato legacy
    const dbItem = item as MenuItemDB;
    return {
      id: dbItem.id,
      name: dbItem.name,
      description: dbItem.description || "",
      price: Number(dbItem.price),
      images: dbItem.image_url ? [dbItem.image_url] : [],
      discount: dbItem.discount,
      features: [], // Los custom_fields podrían mapearse aquí si es necesario
    };
  }, [item]);
  const { state, dispatch } = useTable();
  const { navigateWithTable } = useTableNavigation();
  const { flyToCart } = useFlyToCart();
  const { isOpen, restaurant } = useRestaurant();
  const plusButtonRef = useRef<HTMLDivElement>(null);
  const [localQuantity, setLocalQuantity] = useState(0);
  const [isPulsing, setIsPulsing] = useState(false);
  const [showClosedModal, setShowClosedModal] = useState(false);

  // Verificar si el item tiene custom fields
  const hasCustomFields = useMemo(() => {
    const dbItem = item as MenuItemDB;
    if (dbItem.custom_fields) {
      if (typeof dbItem.custom_fields === "string") {
        try {
          const parsed = JSON.parse(dbItem.custom_fields);
          return Array.isArray(parsed) && parsed.length > 0;
        } catch {
          return false;
        }
      }
      return (
        Array.isArray(dbItem.custom_fields) && dbItem.custom_fields.length > 0
      );
    }
    return false;
  }, [item]);

  const handleImageClick = () => {
    navigateWithTable(`/dish/${adaptedItem.id}`);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Verificar si el restaurante está abierto
    if (!isOpen) {
      setShowClosedModal(true);
      return;
    }

    // Si tiene custom fields, navegar a la página de detalle
    if (hasCustomFields) {
      navigateWithTable(`/dish/${adaptedItem.id}`);
      return;
    }

    // Calcular precio con descuento aplicado
    const finalPrice = adaptedItem.discount > 0
      ? adaptedItem.price * (1 - adaptedItem.discount / 100)
      : adaptedItem.price;

    // Crear item con precio con descuento
    const itemWithDiscount = {
      ...adaptedItem,
      price: finalPrice,
    };

    // Si no tiene custom fields, agregar directamente al carrito
    setLocalQuantity((prev) => prev + 1);
    setIsPulsing(true);

    if (plusButtonRef.current) {
      flyToCart(plusButtonRef.current, () => {
        dispatch({ type: "ADD_ITEM_TO_CURRENT_USER", payload: itemWithDiscount });
      });
    } else {
      dispatch({ type: "ADD_ITEM_TO_CURRENT_USER", payload: itemWithDiscount });
    }
  };

  // Reset pulse animation
  useEffect(() => {
    if (isPulsing) {
      const timer = setTimeout(() => setIsPulsing(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isPulsing]);

  const handleRemoveFromCart = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Si hay múltiples variaciones, navegar al carrito
    const itemsWithSameId = state.currentUserItems.filter(
      (cartItem) => cartItem.id === adaptedItem.id
    );
    if (itemsWithSameId.length > 1) {
      navigateWithTable("/cart");
      return;
    }

    // Update local quantity
    setLocalQuantity((prev) => Math.max(0, prev - 1));

    const cartItem = state.currentUserItems.find(
      (cartItem) => cartItem.id === adaptedItem.id
    );
    if (cartItem && cartItem.quantity > 1) {
      dispatch({
        type: "UPDATE_QUANTITY_CURRENT_USER",
        payload: {
          id: adaptedItem.id,
          quantity: cartItem.quantity - 1,
          customFields: cartItem.customFields,
        },
      });
    } else if (cartItem && cartItem.quantity === 1) {
      dispatch({
        type: "REMOVE_ITEM_FROM_CURRENT_USER",
        payload: adaptedItem.id,
      });
    }
  };

  // Sumar todas las cantidades de items con el mismo id (considerando diferentes custom fields)
  const currentQuantity = state.currentUserItems
    .filter((cartItem) => cartItem.id === adaptedItem.id)
    .reduce((sum, item) => sum + item.quantity, 0);

  // Sync local quantity with state
  const displayQuantity = Math.max(localQuantity, currentQuantity);

  return (
    <>
      <RestaurantClosedModal
        isOpen={showClosedModal}
        onClose={() => setShowClosedModal(false)}
        openingHours={restaurant?.opening_hours}
        restaurantName={restaurant?.name}
        restaurantLogo={restaurant?.logo_url}
      />
      <div
        className="border-b border-gray-300 py-4 relative"
        onClick={handleImageClick}
      >
      <div className="flex items-center gap-4">
        {/* Image */}
        <div className="flex-shrink-0 cursor-pointer">
          <div className="size-36 bg-gray-300 rounded-xl flex items-center justify-center hover:scale-105 transition-transform duration-200">
            {adaptedItem.images[0] ? (
              <img
                src={adaptedItem.images[0]}
                alt="Dish preview"
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <img
                src={"/logo-short-green.webp"}
                alt="Logo Xquisito"
                className="size-18 object-contain"
              />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between">
            <h3 className="text-lg font-medium text-black leading-tight capitalize">
              {adaptedItem.name}
            </h3>
            <div
              className={`flex gap-1.5 px-3 py-0.5 h-fit rounded-full border items-center justify-center border-[#8e8e8e]/50 text-black transition-all ${isPulsing ? "bg-[#eab3f4]/50" : "bg-[#f9f9f9]"}`}
              onClick={(e) => e.stopPropagation()}
            >
              <Minus
                className={`size-4 ${displayQuantity > 0 ? "cursor-pointer" : "cursor-no-drop"}`}
                onClick={displayQuantity > 0 ? handleRemoveFromCart : undefined}
              />
              <p className="font-normal">{displayQuantity}</p>
              <div ref={plusButtonRef}>
                <Plus
                  className="size-4 cursor-pointer"
                  onClick={handleAddToCart}
                />
              </div>
            </div>
          </div>
          {adaptedItem.features.length > 0 && (
            <div className="flex gap-1 mt-1 mb-3">
              {adaptedItem.features.map((feature, index) => (
                <div
                  key={index}
                  className="text-sm text-black font-medium border border-[#bfbfbf]/50 rounded-3xl px-3 py-1 shadow-sm"
                >
                  {feature}
                </div>
              ))}
            </div>
          )}
          <p className="text-base line-clamp-3 leading-4 bg-gradient-to-b from-black to-black/30 bg-clip-text text-transparent">
            {adaptedItem.description}
          </p>
          <div className="flex items-center justify-between mt-2">
            {adaptedItem.discount > 0 ? (
              <div className="text-base text-black flex flex-col">
                <div>
                  <span className="text-black line-through text-xs">
                    ${adaptedItem.price} MXN
                  </span>
                </div>
                <div className="-translate-y-1">
                  $
                  {(
                    adaptedItem.price *
                    (1 - adaptedItem.discount / 100)
                  ).toFixed(2)}{" "}
                  MXN
                </div>
              </div>
            ) : (
              <span className="text-base text-black">
                ${adaptedItem.price.toFixed(2)} MXN
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
