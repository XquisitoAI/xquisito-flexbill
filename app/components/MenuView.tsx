'use client';

import MenuHeader from './MenuHeader';
import MenuCategory from './MenuCategory';
import { menuData } from '../utils/menuData';
import { restaurantData } from '../utils/restaurantData';

interface MenuViewProps {
  tableNumber?: string;
}

export default function MenuView({ tableNumber }: MenuViewProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      <MenuHeader restaurant={restaurantData} tableNumber={tableNumber} />
      
      <main className="container mx-auto px-4 py-6">
        <div className="space-y-8">
          {menuData.map((category) => (
            <MenuCategory key={category.id} category={category} />
          ))}
        </div>
      </main>
      
      <footer className="bg-white/80 backdrop-blur-sm mt-12 py-6 text-center text-gray-600">
        <p className="text-sm">
          Powered by <span className="font-semibold text-orange-600">Xquisito</span>
        </p>
      </footer>
    </div>
  );
}