"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Loader from "./components/Loader";

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSignedIn, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded) return;

    // Check if user just signed in and has table context
    const storedTable = sessionStorage.getItem('pendingTableRedirect');

    if (isSignedIn && storedTable) {
      // User just signed in, redirect to payment-options with table
      sessionStorage.removeItem('pendingTableRedirect');
      router.replace(`/payment-options?table=${storedTable}`);
      return;
    }

    // Check for table parameter in current URL
    const tableParam = searchParams.get('table');
    if (tableParam) {
      router.replace(`/menu?table=${tableParam}`);
      return;
    }

    // Default redirect to table 12 for demo
    router.replace("/menu?table=12");
  }, [router, searchParams, isSignedIn, isLoaded]);

  return <Loader />;
}
