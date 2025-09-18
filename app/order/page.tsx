'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useTable } from '../context/TableContext';
import OrderStatus from "../components/OrderStatus";

export default function OrderPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { dispatch, loadTableOrders } = useTable();
  const tableNumber = searchParams?.get('table');
  const resetSession = searchParams?.get('reset');

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

    // Si NO hay reset, permitir carga normal
    if (resetSession !== 'true') {
      dispatch({ type: 'SET_SKIP_AUTO_LOAD', payload: false });
    }

    // Establecer el número de mesa en el contexto
    dispatch({ type: 'SET_TABLE_NUMBER', payload: tableNumber });
  }, [tableNumber, resetSession, dispatch, router]);

  // useEffect separado SOLO para el reset, que se ejecuta una sola vez
  useEffect(() => {
    if (resetSession === 'true') {
      console.log('🧹 Resetting session for new order at table', tableNumber);

      // Evitar carga automática de órdenes anteriores
      dispatch({ type: 'SET_SKIP_AUTO_LOAD', payload: true });

      // Limpiar las órdenes INMEDIATAMENTE
      dispatch({ type: 'CLEAR_ORDERS' });

      // Limpiar el carrito del usuario actual
      dispatch({ type: 'CLEAR_CURRENT_USER_CART' });

      // Limpiar el nombre del usuario actual para empezar fresco
      dispatch({ type: 'SET_CURRENT_USER_NAME', payload: '' });

      // Limpiar errores previos
      dispatch({ type: 'SET_ERROR', payload: null });

      // Limpiar la URL del parámetro reset para evitar loops
      const url = new URL(window.location.href);
      url.searchParams.delete('reset');
      window.history.replaceState({}, '', url.toString());

      console.log('✅ Session reset completed - orders cleared, ready for new session');
    }
  }, []); // Solo se ejecuta una vez al montar el componente

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

  return <OrderStatus />;
}