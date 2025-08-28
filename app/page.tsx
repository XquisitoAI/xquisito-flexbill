import MenuHeader from './components/MenuHeader';
import MenuCategory from './components/MenuCategory';

// Datos de ejemplo del restaurante
const restaurantData = {
  id: 'newId',
  name: "Café Delicias",
  description: "Sabores auténticos que despiertan tus sentidos",
  logo: "/restaurant-logo.png",
  tableNumber: 12,
  cartItemsCount:2
};

// Datos de ejemplo del menú
const menuData = [
  {
    id: 1,
    category: "Desayunos",
    icon: "🍳",
    items: [
      {
        id: 1,
        name: "Huevos Benedictinos",
        description: "Huevos pochados sobre pan tostado con salsa holandesa",
        price: 12.99,
        image: "/breakfast-1.jpg"
      },
      {
        id: 2,
        name: "Pancakes Americanos",
        description: "Stack de 3 pancakes con miel de maple y frutos rojos",
        price: 9.99,
        image: "/breakfast-2.jpg"
      },
      {
        id: 3,
        name: "Avocado Toast",
        description: "Pan artesanal con aguacate, tomate cherry y semillas",
        price: 8.99,
        image: "/breakfast-3.jpg"
      }
    ]
  },
  {
    id: 2,
    category: "Bebidas",
    icon: "☕",
    items: [
      {
        id: 4,
        name: "Cappuccino Artesanal",
        description: "Espresso con leche vaporizada y arte latte",
        price: 4.99,
        image: "/drink-1.jpg"
      },
      {
        id: 5,
        name: "Smoothie Tropical",
        description: "Mango, piña, coco y un toque de jengibre",
        price: 6.99,
        image: "/drink-2.jpg"
      },
      {
        id: 6,
        name: "Té Chai Latte",
        description: "Mezcla de especias con leche cremosa",
        price: 5.99,
        image: "/drink-3.jpg"
      }
    ]
  }
];

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
