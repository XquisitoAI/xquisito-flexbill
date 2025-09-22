"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Loader from "./components/Loader";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir automáticamente a la mesa 12 para demo
    router.replace("/menu?table=12");
  }, [router]);

  return <Loader />;
}
