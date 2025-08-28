import { MenuItemData } from "./menuItemData";

export interface Category {
  id: number;
  category: string;
  icon: string;
  items: MenuItemData[];
}