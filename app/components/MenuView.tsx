"use client";

import MenuHeader from "@/app/components/headers/MenuHeader";
import MenuCategory from "@/app/components/MenuCategory";
import ErrorScreen from "@/app/components/ErrorScreen";
import Loader from "@/app/components/UI/Loader";
import { Search, ShoppingCart, Settings } from "lucide-react";
import { useState, useMemo } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useTableNavigation } from "@/app/hooks/useTableNavigation";
import { useCart } from "@/app/context/CartContext";
import { useRestaurant } from "@/app/context/RestaurantContext";
import { DEFAULT_IMAGES } from "@/app/constants/images";

interface MenuViewProps {
  tableNumber?: string;
}

function MenuView({ tableNumber }: MenuViewProps) {
  const [filter, setFilter] = useState("Todo");
  const [searchQuery, setSearchQuery] = useState("");
  const { profile, isAuthenticated } = useAuth();
  const { navigateWithTable } = useTableNavigation();
  const { state: cartState } = useCart();
  const { restaurant, menu, loading, error } = useRestaurant();

  // Obtener categorías únicas del menú de la BD ordenadas por display_order
  const categorias = useMemo(() => {
    const categories = ["Todo"];
    if (menu && menu.length > 0) {
      // Ordenar secciones por display_order antes de extraer nombres
      const sortedSections = [...menu].sort(
        (a, b) => a.display_order - b.display_order
      );
      sortedSections.forEach((section) => {
        if (section.name) {
          categories.push(section.name);
        }
      });
    }
    return categories;
  }, [menu]);

  // Get gender from Supabase profile
  const gender = profile?.gender;
  const welcomeMessage = isAuthenticated
    ? gender === "female"
      ? "Bienvenida"
      : "Bienvenido"
    : "Bienvenido";

  // Total de items en el carrito - ahora desde CartContext
  const totalItems = cartState.totalItems;

  const handleSettingsClick = () => {
    if (isAuthenticated) {
      navigateWithTable("/dashboard");
    } else {
      sessionStorage.setItem("signInFromMenu", "true");
      navigateWithTable("/auth");
    }
  };

  const handlePepperClick = () => {
    navigateWithTable("/pepper");
  };

  const handleCartClick = () => {
    navigateWithTable("/cart");
  };

  // Filtrar menú según la categoría seleccionada y búsqueda
  const filteredMenu = useMemo(() => {
    let filtered = menu;

    // Filtrar por categoría
    if (filter !== "Todo") {
      filtered = filtered.filter((section) => section.name === filter);
    }

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered
        .map((section) => ({
          ...section,
          items: section.items.filter(
            (item) =>
              item.name.toLowerCase().includes(query) ||
              item.description?.toLowerCase().includes(query)
          ),
        }))
        .filter((section) => section.items.length > 0);
    }

    // Ordenar por display_order antes de retornar
    return [...filtered].sort((a, b) => a.display_order - b.display_order);
  }, [menu, filter, searchQuery]);

  // Mostrar loader mientras carga
  if (loading) {
    return <Loader />;
  }

  // Mostrar error si falla
  if (error) {
    return (
      <ErrorScreen
        title="Error al cargar el menú"
        description="No pudimos obtener la información del restaurante"
        detail={error}
      />
    );
  }

  // Mostrar mensaje si no hay restaurante
  if (!restaurant) {
    return (
      <ErrorScreen
        title="Restaurante no encontrado"
        description="No se pudo cargar la información del restaurante"
        detail="Por favor verifica el código QR"
      />
    );
  }

  return (
    <div className="min-h-screen bg-white relative">
      <div
        className="absolute top-0 left-0 w-full h-[230px] md:h-96 lg:h-[28rem] z-0 banner-mobile"
        style={{
          backgroundImage: `url(${restaurant.banner_url || DEFAULT_IMAGES.RESTAURANT_BANNER})`,
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat'
        }}
      ></div>

      <MenuHeader restaurant={restaurant} tableNumber={tableNumber} />

      <main className="mt-48 md:mt-64 lg:mt-80 relative z-10" style={{marginTop:'11rem'}}>
        <div className="bg-white rounded-t-4xl flex flex-col items-center px-6 md:px-8 lg:px-10">
          <div className="mt-6 md:mt-8 flex items-start justify-between w-full">
            {/* Settings Icon */}
            <div
              onClick={handleSettingsClick}
              className="bg-white rounded-full p-1.5 md:p-2 lg:p-2.5 border border-gray-400 shadow-sm cursor-pointer hover:bg-gray-50 transition-all active:scale-95"
            >
              <Settings
                className="size-5 md:size-6 lg:size-7 text-stone-800"
                strokeWidth={1.5}
              />
            </div>
            {/* Assistent Icon */}
            <div
              onClick={handlePepperClick}
              className="bg-white rounded-full text-black border border-gray-400 size-10 md:size-12 lg:size-14 cursor-pointer shadow-sm"
            >
              <video
                src="/videos/video-icon-pepper.webm"
                autoPlay
                loop
                muted
                playsInline
                disablePictureInPicture
                controls={false}
                controlsList="nodownload nofullscreen noremoteplayback"
                className="w-full h-full object-cover rounded-full"
              />
              {/*<img src="/logo-short-green.webp" alt="AI" className="size-6" />*/}
            </div>
          </div>

          {/* Name and photo */}
          <div className="mb-4 md:mb-6 flex flex-col items-center">
            <div className="size-28 md:size-36 lg:size-40 rounded-full bg-gray-200 overflow-hidden border border-gray-400 shadow-sm">
              <img
                src={restaurant.logo_url || DEFAULT_IMAGES.RESTAURANT_LOGO}
                alt="Profile Pic"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-black mt-3 md:mt-5 mb-6 md:mb-8 flex flex-col items-center">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium">
                ¡{welcomeMessage}
                {profile?.firstName ? ` ${profile.firstName}` : ""}!
              </h1>
              <h3 className="mt-1 text-black/70 text-xl md:text-2xl lg:text-3xl">
                Mesa {tableNumber}
              </h3>
            </div>
          </div>

          {/* Search Input */}
          <div className="w-full">
            <div className="flex items-center justify-center border-b border-black">
              <Search
                className="text-black size-5 md:size-6 lg:size-7"
                strokeWidth={1}
              />
              <input
                type="text"
                placeholder="Buscar artículo"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-black text-base md:text-lg lg:text-xl px-3 md:px-4 py-2 md:py-3 focus:outline-none"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 md:gap-3 mt-3 md:mt-5 mb-3 md:mb-5 w-full overflow-x-auto scrollbar-hide">
            {categorias.map((cat) => (
              <div
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-3 md:px-5 lg:px-6 py-1 md:py-2 text-sm md:text-base lg:text-lg rounded-full cursor-pointer whitespace-nowrap flex-shrink-0
                ${
                  filter === cat
                    ? "bg-black text-white hover:bg-slate-800"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {cat}
              </div>
            ))}
          </div>

          {/* Items */}
          {filteredMenu.length > 0 ? (
            filteredMenu.map((section) => (
              <MenuCategory
                key={section.id}
                section={section}
                showSectionName={filter === "Todo"}
              />
            ))
          ) : (
            <div className="text-center py-10 md:py-16">
              <p className="text-gray-500 text-base md:text-lg lg:text-xl">
                {searchQuery.trim()
                  ? `No se encontraron resultados para "${searchQuery}"`
                  : "No hay items disponibles"}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Carrito flotante */}
      {totalItems > 0 && (
        <div className="fixed bottom-6 md:bottom-8 lg:bottom-10 left-0 right-0 z-50 flex justify-center">
          <div
            onClick={handleCartClick}
            className="bg-gradient-to-r from-[#34808C] to-[#173E44] text-white rounded-full px-6 md:px-8 lg:px-10 py-4 md:py-5 lg:py-6 shadow-lg flex items-center gap-3 md:gap-4 cursor-pointer transition-all hover:scale-105 animate-bounce-in active:scale-90"
          >
            <ShoppingCart className="size-5 md:size-6 lg:size-7" />
            <span className="text-base md:text-lg lg:text-xl font-medium">
              Ver el carrito • {totalItems}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default MenuView;
