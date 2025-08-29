import MenuHeader from './components/MenuHeader';
import MenuCategory from './components/MenuCategory';
import { menuData } from './utils/menuData';
import { restaurantData } from './utils/restaurantData';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      <MenuHeader restaurant={restaurantData} />
      
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
