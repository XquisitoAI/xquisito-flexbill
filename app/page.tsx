"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir automáticamente a la mesa 12 para demo
    router.replace("/menu?table=12");
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a8b9b] to-[#153f43] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-pulse">
          <img
            src="/logo-short-green.webp"
            alt="Xquisito Logo"
            className="size-24 justify-self-center"
          />
        </div>
        {/*<h1 className="text-2xl font-bold text-primary mb-4">Redirigiendo...</h1>
        <p className="text-primary">Por favor espere</p>*/}
      </div>
    </div>
  );
}
