import { MenuItemData } from "../interfaces/menuItemData";

interface MenuItemProps {
  item: MenuItemData;
}

export default function MenuItem({ item }: MenuItemProps) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="aspect-video bg-gradient-to-br from-orange-200 to-amber-200 flex items-center justify-center">
        <div className="text-6xl opacity-60">🍽️</div>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-gray-800 leading-tight">
            {item.name}
          </h3>
          <span className="text-2xl font-bold text-orange-600 ml-2">
            ${item.price.toFixed(2)}
          </span>
        </div>
        
        <p className="text-gray-600 text-sm leading-relaxed">
          {item.description}
        </p>
        
        <div className="mt-4">
          <button className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold py-2 px-4 rounded-lg hover:from-orange-600 hover:to-red-600 transition-colors duration-300">
            Agregar al Pedido
          </button>
        </div>
      </div>
    </div>
  );
}