import MenuItem from "./MenuItem";
import { Category } from "../interfaces/category";

interface MenuCategoryProps {
  category: Category;
}

export default function MenuCategory({ category }: MenuCategoryProps) {
  return (
    <section className="w-full">
      {/*<div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <span className="text-4xl">{category.icon}</span>
          {category.category}
        </h2>
      </div>*/}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6">
        {category.items.map((item) => (
          <MenuItem key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
