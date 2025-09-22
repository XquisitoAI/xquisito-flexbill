"use client";

import { Restaurant } from "../interfaces/restaurante";
import { useTable } from "../context/TableContext";
import { useTableNavigation } from "../hooks/useTableNavigation";
import { usePathname } from "next/navigation";
import { ShoppingCart, Receipt } from "lucide-react";

interface MenuHeaderProps {
  restaurant: Restaurant;
  tableNumber?: string;
}

export default function MenuHeader({
  restaurant,
  tableNumber,
}: MenuHeaderProps) {
  const { state } = useTable();
  const { navigateWithTable } = useTableNavigation();
  const pathname = usePathname();

  const handleCartClick = () => {
    navigateWithTable("/cart");
  };

  const handleOrderClick = () => {
    navigateWithTable("/order");
  };

  return (
    <header className="container mx-auto px-5 pt-5 z-10">
      <div className="flex items-center justify-end z-10">
        {/*<div className="flex items-center z-10">
            <img src="/logo-short-green.webp" alt="Xquisito Logo" className="size-10 justify-self-center" />
            <span className="text-lg font-semibold text-gray-800">
              Table {tableNumber || restaurant.tableNumber}
            </span>
          </div>*/}

        <div className="flex items-center space-x-2 z-10">
          <div className="relative">
            <div
              onClick={handleOrderClick}
              className="size-10 bg-white border border-gray-300 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
            >
              <Receipt className="text-primary size-5" />
            </div>
            {state.orders &&
              state.orders.length > 0 &&
              state.orders.reduce((sum, order) => sum + order.total_items, 0) >
                0 && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  {state.orders.reduce(
                    (sum, order) => sum + order.total_items,
                    0
                  )}
                </div>
              )}
          </div>
          {/* 
          {pathname === "/order" ? (
            <div className="relative">
              <div className="size-10 bg-white border border-gray-300 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
                <Receipt className="text-primary" />
              </div>
              {state.orders &&
                state.orders.length > 0 &&
                state.orders.reduce(
                  (sum, order) => sum + order.total_items,
                  0
                ) > 0 && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                    {state.orders.reduce(
                      (sum, order) => sum + order.total_items,
                      0
                    )}
                  </div>
                )}
            </div>
          ) : (
            <div className="size-10 bg-white border border-gray-300 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
              <Receipt className="text-primary size-5" />
            </div>
          )}
            */}

          <div className="relative">
            <div
              onClick={handleCartClick}
              className="size-10 bg-white border border-gray-300 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
            >
              <ShoppingCart className="text-primary size-5" />
            </div>
            {state.currentUserTotalItems > 0 && (
              <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full size-5 flex items-center justify-center text-xs font-bold">
                {state.currentUserTotalItems}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
