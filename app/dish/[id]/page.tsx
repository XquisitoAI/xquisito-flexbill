'use client';

import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { findDishById } from '../../utils/menuData';
import MenuHeader from '../../components/MenuHeader';
import { restaurantData } from '../../utils/restaurantData';
import { useTable } from '../../context/TableContext';
import { useTableNavigation } from '../../hooks/useTableNavigation';

export default function DishDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const dishId = parseInt(params.id as string);
  const { dispatch } = useTable();
  const { tableNumber, goBack } = useTableNavigation();

  useEffect(() => {
    if (!tableNumber) {
      // Redirigir a home si no hay número de mesa
      router.push('/');
      return;
    }

    if (isNaN(parseInt(tableNumber))) {
      // Redirigir si el número de mesa no es válido
      router.push('/');
      return;
    }

    // Establecer el número de mesa en el contexto
    dispatch({ type: 'SET_TABLE_NUMBER', payload: tableNumber });
  }, [tableNumber, dispatch, router]);

  const dishData = findDishById(dishId);

  console.log(dishData)

  const handleAddToCart = () => {
    if (dishData) {
      dispatch({ type: 'ADD_ITEM_TO_CURRENT_USER', payload: dishData.dish });
    }
  };

  if (!tableNumber || isNaN(parseInt(tableNumber))) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Mesa Inválida</h1>
          <p className="text-gray-600">Por favor escanee el código QR</p>
        </div>
      </div>
    );
  }

  if (!dishData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Platillo no encontrado</h1>
          <button 
            onClick={() => goBack()}
            className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Volver al menú
          </button>
        </div>
      </div>
    );
  }

  const { dish, category } = dishData;  

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      <MenuHeader restaurant={restaurantData} tableNumber={tableNumber} />
      
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
        {/* Header con botón de regreso */}
        <div className="flex items-center mb-6">
          <button 
            onClick={() => goBack()}
            className="p-2 rounded-full bg-white shadow-lg hover:shadow-xl transition-shadow"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="ml-4">
            <h1 className="text-2xl font-bold text-gray-800">Detalles del Platillo</h1>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <span className="text-lg">{category.icon}</span>
              {category.category}
            </p>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Imagen del platillo */}
          <div className="h-64 bg-gradient-to-br from-orange-200 to-amber-200 flex items-center justify-center">
            <div className="text-8xl opacity-80">🍽️</div>
          </div>

          {/* Información del platillo */}
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-3xl font-bold text-gray-800">{dish.name}</h2>
              <span className="text-3xl font-bold text-orange-600">${dish.price.toFixed(2)}</span>
            </div>

            <p className="text-gray-600 text-lg leading-relaxed mb-6">
              {dish.description}
            </p>

            {/* Secciones adicionales */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-bold text-gray-800 mb-2">Ingredientes</h3>
                <p className="text-gray-600 text-sm">Información de ingredientes próximamente...</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-bold text-gray-800 mb-2">Información Nutricional</h3>
                <p className="text-gray-600 text-sm">Información nutricional próximamente...</p>
              </div>
            </div>

            {/* Botón de agregar al pedido */}
            <button 
              onClick={handleAddToCart}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-4 px-6 rounded-xl hover:from-orange-600 hover:to-red-600 transition-colors duration-300 text-lg cursor-pointer"
            >
              Agregar al Pedido - ${dish.price.toFixed(2)}
            </button>
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}