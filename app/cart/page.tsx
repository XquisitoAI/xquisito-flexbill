'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useTable } from '../context/TableContext';
import CartView from "../components/CartView";

export default function CartPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { dispatch } = useTable();
  const tableNumber = searchParams?.get('table');

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

  return <CartView />;
}