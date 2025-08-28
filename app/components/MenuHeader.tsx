import { Restaurant } from "../interfaces/restaurante"

interface MenuHeaderProps {
  restaurant: Restaurant;
}

export default function MenuHeader({ restaurant }: MenuHeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-lg font-semibold text-gray-800">
              Table {restaurant.tableNumber}
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-600 transition-colors">
              <span className="text-white text-sm">☰</span>
            </div>
            
            <div className="relative">
              <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-600 transition-colors">
                <span className="text-white text-sm">🛒</span>
              </div>
              {restaurant.cartItemsCount > 0 && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  {restaurant.cartItemsCount}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}