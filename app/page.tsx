'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir automáticamente a la mesa 12 para demo
    router.replace('/menu?table=12');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Redirigiendo...</h1>
        <p className="text-gray-600">Por favor espere</p>
      </div>
    </div>
  );
}
