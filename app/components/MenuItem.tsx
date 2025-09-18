'use client';

import { MenuItemData } from "../interfaces/menuItemData";
import { useTable } from "../context/TableContext";
import { useTableNavigation } from "../hooks/useTableNavigation";
import { Plus, Minus } from "lucide-react";

interface MenuItemProps {
  item: MenuItemData;
}

export default function MenuItem({ item }: MenuItemProps) {
  const { dispatch } = useTable();
  const { navigateWithTable } = useTableNavigation();

  const handleImageClick = () => {
    navigateWithTable(`/dish/${item.id}`);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'ADD_ITEM_TO_CURRENT_USER', payload: item });
  };
  
  return (
    <div className="border-b border-gray-300 py-4 relative" onClick={handleImageClick}>
      <div className="flex items-center gap-4">

        {/* Image */}
        <div className="flex-shrink-0 cursor-pointer">
          <div 
            className="size-36 bg-gray-300 rounded-xl flex items-center justify-center hover:scale-105 transition-transform duration-200"
          >
            {item.images[0] ? (
              <img src={item.images[0]} alt="Dish preview"  className="w-full h-full object-cover rounded-xl"/>
            ) : (
              <img src={'/logo-short-green.webp'} alt="Logo Xquisito" className="size-18 object-contain"/>
            )}
            
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between">
            <h3 className="text-lg font-semibold text-black leading-tight">
              {item.name}
            </h3>
            <div className="flex gap-1.5 px-3 py-0.5 h-fit bg-[#f9f9f9] rounded-full border border-[#8e8e8e]/50 font-thin items-center justify-center">
              <Minus className="size-4 cursor-no-drop text-black/50" onClick={()=>{}}/>
              <p className="text-black">0</p>
              <Plus className="size-4 cursor-pointer text-black" onClick={handleAddToCart}/>
            </div>
          </div>
          <div className="flex gap-1 mt-1 mb-3">
            {item.features.map((feature, index)=>(
              <div key={index} className="text-sm text-black font-semibold border border-[#bfbfbf]/50 rounded-3xl px-3 py-1 shadow-sm">{feature}</div>
            ))}
          </div>
          <p className="text-black/70 text-base line-clamp-2 leading-4">
            {item.description}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-lg text-black">
              ${item.price.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}