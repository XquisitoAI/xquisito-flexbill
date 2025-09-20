"use client";

import { useTable } from "../context/TableContext";
import { useTableNavigation } from "../hooks/useTableNavigation";
import { useGuest } from "../context/GuestContext";
import { apiService } from "../utils/api";
import { SignInButton, SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Loader from "../components/Loader";
import { ChevronRight } from "lucide-react";

export default function CheckoutPage() {
  const { state } = useTable();
  const { navigateWithTable } = useTableNavigation();
  const { setAsGuest } = useGuest();
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // Redirect authenticated users automatically
  useEffect(() => {
    if (isLoaded && user) {
      console.log(
        "🔐 User authenticated on checkout page, redirecting to payment..."
      );
      // Use navigateWithTable to preserve table context
      navigateWithTable("/payment-options");
    }
  }, [isLoaded, user, navigateWithTable]);

  const handleContinueAsGuest = () => {
    // Initialize guest session using context
    try {
      // Set user as guest with table number from context
      const tableNum = state.tableNumber?.toString() || undefined;
      setAsGuest(tableNum);

      // Navigate to payment options page as guest
      navigateWithTable("/payment-options");
    } catch (error) {
      console.error("❌ Error initializing guest session:", error);
      // Still navigate even if there's an error
      navigateWithTable("/payment-options");
    }
  };

  return (
    <>
      <SignedOut>
        <div className="min-h-screen bg-gradient-to-br from-[#0a8b9b] to-[#153f43] flex flex-col justify-center items-center px-4">
          <div className="relative z-10 w-full">
            {/* Welcome Card */}
            <div className="bg-white rounded-4xl shadow-lg p-6">
              <h1 className="text-2xl font-medium text-gray-800 text-center mb-6">
                ¡Bienvenido!
              </h1>

              <div className="space-y-3">
                {/* Sign In Button */}
                <SignInButton
                  mode="modal"
                  fallbackRedirectUrl={`/payment-options${state.tableNumber ? `?table=${state.tableNumber}` : ""}`}
                  forceRedirectUrl={`/payment-options${state.tableNumber ? `?table=${state.tableNumber}` : ""}`}
                >
                  <button className="flex items-center justify-between bg-black hover:bg-stone-950 w-full text-white py-3 px-4 rounded-full font-medium cursor-pointer transition-colors mt-3">
                    <span className="">Sign In</span>
                    <ChevronRight className="size-4 text-white" />
                  </button>
                </SignInButton>

                {/* Sign Up Button */}
                <button
                  onClick={() => navigateWithTable("/sign-up")}
                  className="flex items-center justify-between bg-black hover:bg-stone-950 w-full text-white py-3 px-4 rounded-full font-medium cursor-pointer transition-colors"
                >
                  <span className="">Sign Up</span>
                  <ChevronRight className="size-4 text-white" />
                </button>

                {/* Continue as Guest */}
                <button
                  onClick={handleContinueAsGuest}
                  className="flex items-center justify-between bg-black hover:bg-stone-950 w-full text-white py-3 px-4 rounded-full font-medium cursor-pointer transition-colors"
                >
                  <span className="">Continue as Guest</span>
                  <ChevronRight className="size-4 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <Loader />
      </SignedIn>
    </>
  );
}
