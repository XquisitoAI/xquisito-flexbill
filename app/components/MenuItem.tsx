"use client";

import { MenuItemData } from "../interfaces/menuItemData";
import { useTable } from "../context/TableContext";
import { useTableNavigation } from "../hooks/useTableNavigation";
import { useFlyToCart } from "../hooks/useFlyToCart";
import { Plus, Minus } from "lucide-react";
import { useRef, useState, useEffect } from "react";

interface MenuItemProps {
  item: MenuItemData;
}

export default function MenuItem({ item }: MenuItemProps) {
  const { state, dispatch } = useTable();
  const { navigateWithTable } = useTableNavigation();
  const { flyToCart } = useFlyToCart();
  const plusButtonRef = useRef<HTMLDivElement>(null);
  const [localQuantity, setLocalQuantity] = useState(0);
  const [isPulsing, setIsPulsing] = useState(false);

  const handleImageClick = () => {
    navigateWithTable(`/dish/${item.id}`);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Update local quantity al instante
    setLocalQuantity((prev) => prev + 1);

    // Trigger pulse animation
    setIsPulsing(true);

    // Primero animacion, luego se agrega al carrito
    if (plusButtonRef.current) {
      flyToCart(plusButtonRef.current, () => {
        dispatch({ type: "ADD_ITEM_TO_CURRENT_USER", payload: item });
      });
    } else {
      dispatch({ type: "ADD_ITEM_TO_CURRENT_USER", payload: item });
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

    // Update local quantity
    setLocalQuantity((prev) => Math.max(0, prev - 1));

    const cartItem = state.currentUserItems.find(
      (cartItem) => cartItem.id === item.id
    );
    if (cartItem && cartItem.quantity > 1) {
      dispatch({
        type: "UPDATE_QUANTITY_CURRENT_USER",
        payload: { id: item.id, quantity: cartItem.quantity - 1 },
      });
    } else if (cartItem && cartItem.quantity === 1) {
      dispatch({ type: "REMOVE_ITEM_FROM_CURRENT_USER", payload: item.id });
    }
  };

  const currentQuantity =
    state.currentUserItems.find((cartItem) => cartItem.id === item.id)
      ?.quantity || 0;

  // Sync local quantity with state
  const displayQuantity = Math.max(localQuantity, currentQuantity);

  return (
    <div
      className="border-b border-gray-300 py-4 relative"
      onClick={handleImageClick}
    >
      <div className="flex items-center gap-4">
        {/* Image */}
        <div className="flex-shrink-0 cursor-pointer">
          <div className="size-36 bg-gray-300 rounded-xl flex items-center justify-center hover:scale-105 transition-transform duration-200">
            {item.images[0] ? (
              <img
                src={item.images[0]}
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
            <h3 className="text-lg font-medium text-black leading-tight">
              {item.name}
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
          <div className="flex gap-1 mt-1 mb-3">
            {item.features.map((feature, index) => (
              <div
                key={index}
                className="text-sm text-black font-medium border border-[#bfbfbf]/50 rounded-3xl px-3 py-1 shadow-sm"
              >
                {feature}
              </div>
            ))}
          </div>
          <p className="text-base line-clamp-3 leading-4 bg-gradient-to-b from-black to-black/30 bg-clip-text text-transparent">
            {item.description}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-base text-black">
              ${item.price.toFixed(2)} MXN
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
