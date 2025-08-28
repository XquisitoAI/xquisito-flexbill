import MenuItem from './MenuItem';
import { Category } from '../interfaces/category';

interface MenuCategoryProps {
  category: Category;
}

export default function MenuCategory({ category }: MenuCategoryProps) {
  return (
    <section className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <span className="text-4xl">{category.icon}</span>
          {category.category}
        </h2>
        <div className="h-1 bg-gradient-to-r from-orange-400 to-red-500 rounded-full w-24 mt-2"></div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {category.items.map((item) => (
          <MenuItem key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}