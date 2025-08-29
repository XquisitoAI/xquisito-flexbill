'use client';

import { MenuItemData } from "../interfaces/menuItemData";
import { useRouter } from 'next/navigation';
import { useCart } from "../context/CartContext";

interface MenuItemProps {
  item: MenuItemData;
}

export default function MenuItem({ item }: MenuItemProps) {
  const router = useRouter();
  const { dispatch } = useCart();

  const handleImageClick = () => {
    router.push(`/dish/${item.id}`);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'ADD_ITEM', payload: item });
  };
  
  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition-shadow duration-300 relative">
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          <div 
            onClick={handleImageClick}
            className="w-16 h-16 bg-gradient-to-br from-orange-200 to-amber-200 rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition-transform duration-200"
          >
            <div className="text-2xl">🍽️</div>
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-800 leading-tight truncate">
            {item.name}
          </h3>
          <p className="text-gray-600 text-sm mt-1 line-clamp-2">
            {item.description}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-lg font-bold text-orange-600">
              ${item.price.toFixed(2)}
            </span>
          </div>
        </div>
        
        <div className="flex-shrink-0">
          <button 
            onClick={handleAddToCart}
            className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full flex items-center justify-center hover:from-orange-600 hover:to-red-600 transition-colors duration-300 text-lg font-bold cursor-pointer"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}