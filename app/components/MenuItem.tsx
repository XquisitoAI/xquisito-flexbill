"use client";

import { MenuItemData } from "../interfaces/menuItemData";
import { useTable } from "../context/TableContext";
import { useTableNavigation } from "../hooks/useTableNavigation";
import { Plus, Minus } from "lucide-react";

interface MenuItemProps {
  item: MenuItemData;
}

export default function MenuItem({ item }: MenuItemProps) {
  const { state, dispatch } = useTable();
  const { navigateWithTable } = useTableNavigation();

  const handleImageClick = () => {
    navigateWithTable(`/dish/${item.id}`);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: "ADD_ITEM_TO_CURRENT_USER", payload: item });
  };

  const handleRemoveFromCart = (e: React.MouseEvent) => {
    e.stopPropagation();
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
            <h3 className="text-lg font-semibold text-black leading-tight">
              {item.name}
            </h3>
            <div
              className="flex gap-1.5 px-3 py-0.5 h-fit bg-[#f9f9f9] rounded-full border border-[#8e8e8e]/50 font-thin items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Minus
                className={`size-4 ${currentQuantity > 0 ? "cursor-pointer text-black" : "cursor-no-drop text-black/50"}`}
                onClick={currentQuantity > 0 ? handleRemoveFromCart : undefined}
              />
              <p className="text-black">{currentQuantity}</p>
              <Plus
                className="size-4 cursor-pointer text-black"
                onClick={handleAddToCart}
              />
            </div>
          </div>
          <div className="flex gap-1 mt-1 mb-3">
            {item.features.map((feature, index) => (
              <div
                key={index}
                className="text-sm text-black font-semibold border border-[#bfbfbf]/50 rounded-3xl px-3 py-1 shadow-sm"
              >
                {feature}
              </div>
            ))}
          </div>
          <p className="text-black/70 text-base line-clamp-2 leading-4">
            {item.description}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-lg text-black">${item.price.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
