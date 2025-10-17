"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Loader from "./components/UI/Loader";

// Restaurant ID por defecto para testing
const DEFAULT_RESTAURANT_ID = 3;
const DEFAULT_TABLE = 12;

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSignedIn, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded) return;

    // Check if user just signed in/up and has context
    const storedTable = sessionStorage.getItem("pendingTableRedirect");
    const storedRestaurant = sessionStorage.getItem("pendingRestaurantId");
    const isFromPaymentFlow = sessionStorage.getItem("signupFromPaymentFlow");
    const isFromPaymentSuccess = sessionStorage.getItem(
      "signupFromPaymentSuccess"
    );
    const isFromMenu = sessionStorage.getItem("signInFromMenu");

    console.log("🔍 Root page debugging:", {
      isLoaded,
      isSignedIn,
      storedTable,
      storedRestaurant,
      isFromPaymentFlow,
      isFromPaymentSuccess,
      isFromMenu,
      currentPath: window.location.pathname,
    });

    // Determinar restaurantId
    const restaurantParam = searchParams.get("restaurant");
    const restaurantId =
      restaurantParam || storedRestaurant || DEFAULT_RESTAURANT_ID;

    if (isSignedIn && storedTable && isFromMenu) {
      // User signed in from MenuView settings, redirect to dashboard with table
      console.log("✅ Redirecting to dashboard with table:", storedTable);
      sessionStorage.removeItem("signInFromMenu");
      sessionStorage.removeItem("pendingTableRedirect");
      sessionStorage.removeItem("pendingRestaurantId");
      router.replace(`/${restaurantId}/dashboard?table=${storedTable}`);
      return;
    }

    if (isSignedIn && storedTable && isFromPaymentFlow) {
      // User signed up during payment flow, redirect to payment-options with table
      console.log("✅ Redirecting to payment-options with table:", storedTable);
      sessionStorage.removeItem("pendingTableRedirect");
      sessionStorage.removeItem("signupFromPaymentFlow");
      sessionStorage.removeItem("pendingRestaurantId");
      router.replace(`/${restaurantId}/payment-options?table=${storedTable}`);
      return;
    }

    if (isSignedIn && isFromPaymentSuccess) {
      // User signed up from payment-success, redirect to dashboard
      console.log("✅ Redirecting to dashboard from payment-success");
      sessionStorage.removeItem("signupFromPaymentSuccess");
      sessionStorage.removeItem("pendingRestaurantId");
      router.replace(`/${restaurantId}/dashboard`);
      return;
    }

    // Check for table parameter in current URL
    const tableParam = searchParams.get("table");
    if (tableParam) {
      console.log(
        `✅ Redirecting to /${restaurantId}/menu?table=${tableParam}`
      );
      router.replace(`/${restaurantId}/menu?table=${tableParam}`);
      return;
    }

    // Default redirect to restaurant 3, table 12 for demo
    console.log(
      `✅ Default redirect to /${DEFAULT_RESTAURANT_ID}/menu?table=${DEFAULT_TABLE}`
    );
    router.replace(`/${DEFAULT_RESTAURANT_ID}/menu?table=${DEFAULT_TABLE}`);
  }, [router, searchParams, isSignedIn, isLoaded]);

  return <Loader />;
}
