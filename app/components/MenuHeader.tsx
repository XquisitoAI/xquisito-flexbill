'use client';

import { Restaurant } from "../interfaces/restaurante";
import { useTable } from "../context/TableContext";
import { useTableNavigation } from "../hooks/useTableNavigation";
import { usePathname } from 'next/navigation';

interface MenuHeaderProps {
  restaurant: Restaurant;
  tableNumber?: string;
}

export default function MenuHeader({ restaurant, tableNumber }: MenuHeaderProps) {
  const { state } = useTable();
  const { navigateWithTable } = useTableNavigation();
  const pathname = usePathname();
  debugger

  const handleCartClick = () => {
    navigateWithTable('/cart');
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-lg font-semibold text-gray-800">
              Table {tableNumber || restaurant.tableNumber}
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            {pathname === '/order' ? (
              <div className="relative">
                <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-600 transition-colors">
                  <span className="text-white text-sm">Bill</span>
                </div>
                {state.orders && state.orders.length > 0 && state.orders.reduce((sum, order) => sum + order.total_items, 0) > 0 && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                    {state.orders.reduce((sum, order) => sum + order.total_items, 0)}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-600 transition-colors">
                <span className="text-white text-sm">Bill</span>
              </div>
            )}
            
            <div className="relative">
              <div 
                onClick={handleCartClick}
                className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-600 transition-colors"
              >
                <span className="text-white text-sm">🛒</span>
              </div>
              {state.currentUserTotalItems > 0 && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  {state.currentUserTotalItems}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}