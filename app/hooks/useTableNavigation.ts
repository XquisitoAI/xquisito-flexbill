'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

export function useTableNavigation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tableNumber = searchParams?.get('table');

  // Función para navegar manteniendo el parámetro table
  const navigateWithTable = useCallback((path: string, replace: boolean = false) => {
    if (!tableNumber) {
      console.warn('No table number found in URL');
      return;
    }

    // Verificar si ya existe un query string en el path
    const separator = path.includes('?') ? '&' : '?';    
    const newUrl = `${path}${separator}table=${tableNumber}`;
    
    if (replace) {
      router.replace(newUrl);
    } else {
      router.push(newUrl);
    }
  }, [router, tableNumber]);

  // Función para ir hacia atrás manteniendo el contexto de mesa
  const goBack = useCallback(() => {
    if (!tableNumber) {
      router.back();
      return;
    }

    // En lugar de router.back(), navegar a la página principal del menú
    navigateWithTable('/menu');
  }, [router, tableNumber, navigateWithTable]);

  // Función para obtener URL completa con table parameter
  const getUrlWithTable = useCallback((path: string) => {
    if (!tableNumber) {
      return path;
    }
    return `${path}?table=${tableNumber}`;
  }, [tableNumber]);

  return {
    tableNumber,
    navigateWithTable,
    goBack,
    getUrlWithTable,
    hasTable: !!tableNumber
  };
}