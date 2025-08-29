import { MenuItemData } from "../interfaces/menuItemData";
import { Category } from "../interfaces/category";

// Datos del menú
export const menuData: Category[] = [
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

// Función para buscar un plato por ID
export function findDishById(id: number): { dish: MenuItemData; category: Category } | null {
  for (const category of menuData) {
    const dish = category.items.find(item => item.id === id);
    if (dish) {
      return { dish, category };
    }
  }
  return null;
}