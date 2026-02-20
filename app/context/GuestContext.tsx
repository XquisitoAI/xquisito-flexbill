"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  Suspense,
} from "react";
import { apiService } from "../utils/api";
import { useSearchParams } from "next/navigation";
import { authService } from "../services/auth.service";
import { useAuth } from "./AuthContext";

interface GuestContextType {
  isGuest: boolean;
  guestId: string | null;
  tableNumber: string | null;
  guestName: string | null;
  setAsGuest: (tableNumber?: string) => void;
  setAsAuthenticated: (userId: string) => void;
  clearGuestSession: () => void;
  setGuestName: (name: string) => void;
}

const GuestContext = createContext<GuestContextType | undefined>(undefined);

interface GuestProviderProps {
  children: ReactNode;
}

function GuestProviderInternal({ children }: GuestProviderProps) {
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [tableNumber, setTableNumber] = useState<string | null>(null);
  const [guestName, setGuestName] = useState<string | null>(null);
  const [hasLinkedOrders, setHasLinkedOrders] = useState<boolean>(false);
  const searchParams = useSearchParams();

  // Use AuthContext directly instead of maintaining separate user state
  const { user, profile, isLoading: authLoading } = useAuth();
  const isLoaded = !authLoading;

  // Consolidated effect: Handle authentication state and guest/table context
  useEffect(() => {
    if (!isLoaded) {
      console.log(
        "⏳ GuestContext: Waiting for auth to load before handling guest session",
      );
      return; // CRITICAL: Wait for auth to load - THIS PREVENTS RACE CONDITIONS
    }

    const tableParam = searchParams?.get("table");
    const storedGuestId = localStorage.getItem("xquisito-guest-id");
    const storedTableNumber = localStorage.getItem("xquisito-table-number");
    const storedRestaurantId = localStorage.getItem("xquisito-restaurant-id");

    console.log("🔍 GuestContext: Auth loaded, processing session", {
      hasUser: !!user,
      hasTableParam: !!tableParam,
      hasStoredGuest: !!storedGuestId,
    });

    if (user) {
      // PRIORITY 1: User is authenticated
      console.log(
        "🔐 Authenticated user detected - managing session transition",
      );

      // Step 1: Link guest orders if they exist and haven't been linked yet
      if (storedGuestId && user?.id && !hasLinkedOrders) {
        console.log("🔗 Linking guest orders to authenticated user:", {
          guestId: storedGuestId,
          userId: user.id,
          tableNumber: storedTableNumber,
          restaurantId: storedRestaurantId,
        });

        // Obtener nombre del perfil para actualizar los pedidos vinculados
        const userName =
          profile?.firstName && profile?.lastName
            ? `${profile.firstName} ${profile.lastName}`
            : profile?.firstName || undefined;

        apiService
          .linkGuestOrdersToUser(
            storedGuestId,
            user.id,
            storedTableNumber || undefined,
            storedRestaurantId || undefined,
            userName,
          )
          .then((response) => {
            if (response.success) {
              console.log(
                "✅ Guest orders linked successfully:",
                response.data,
              );
              setHasLinkedOrders(true);
            } else {
              console.error("❌ Failed to link guest orders:", response.error);
            }
          })
          .catch((error) => {
            console.error("❌ Error linking guest orders:", error);
          });
      }

      // Step 2: Clear guest session but preserve table context
      if (isGuest) {
        console.log("🗑️ Clearing guest session for authenticated user");
        clearGuestSession();
      }

      // Step 3: Set table context for authenticated user
      if (tableParam) {
        localStorage.setItem("xquisito-table-number", tableParam);
        apiService.setTableNumber(tableParam);
        setTableNumber(tableParam);
        console.log(
          "📍 Table context preserved for authenticated user:",
          tableParam,
        );
      }

      // Ensure we're not in guest mode
      setIsGuest(false);
      setGuestId(null);

      return; // Exit early for authenticated users
    }

    // PRIORITY 2: No authenticated user - handle guest session
    // Priority 2a: If URL has table parameter, set up guest session
    if (tableParam) {
      console.log(
        "👤 Table parameter detected:",
        tableParam,
        "- Setting up guest session",
      );

      // Use existing guest ID if available, or create new one
      const guestIdToUse = storedGuestId || generateGuestId();

      // Store to localStorage FIRST to ensure persistence
      localStorage.setItem("xquisito-table-number", tableParam);
      localStorage.setItem("xquisito-guest-id", guestIdToUse);

      // Restore guest name from localStorage if available
      const storedGuestName = localStorage.getItem("xquisito-guest-name");

      setIsGuest(true);
      setGuestId(guestIdToUse);
      setTableNumber(tableParam);
      setGuestName(storedGuestName);
      apiService.setTableNumber(tableParam);
      console.log("👤 Guest session configured:", {
        guestId: guestIdToUse,
        tableNumber: tableParam,
        guestName: storedGuestName,
        wasRestored: !!storedGuestId,
      });
      return;
    }

    // Priority 2b: Restore existing guest session (only if no table param)
    if (storedGuestId && storedTableNumber) {
      const storedGuestName = localStorage.getItem("xquisito-guest-name");
      setIsGuest(true);
      setGuestId(storedGuestId);
      setTableNumber(storedTableNumber);
      setGuestName(storedGuestName);
      console.log("🔄 Restored guest session:", {
        guestId: storedGuestId,
        tableNumber: storedTableNumber,
        guestName: storedGuestName,
      });
      return;
    }

    // Priority 3: No table param and no valid stored session - stay as non-guest
    console.log(
      "ℹ️ No table parameter and no valid guest session - staying as non-guest",
    );
  }, [isLoaded, user, searchParams, hasLinkedOrders]);

  const setAsGuest = (newTableNumber?: string) => {
    // Generate guest ID through apiService (which handles localStorage)
    const generatedGuestId = generateGuestId();

    // Ensure localStorage is updated immediately
    localStorage.setItem("xquisito-guest-id", generatedGuestId);

    setIsGuest(true);
    setGuestId(generatedGuestId);

    if (newTableNumber) {
      localStorage.setItem("xquisito-table-number", newTableNumber);
      apiService.setTableNumber(newTableNumber);
      setTableNumber(newTableNumber);
    }

    console.log("👤 Set as guest user:", {
      guestId: generatedGuestId,
      tableNumber: newTableNumber,
    });
  };

  const setAsAuthenticated = (userId: string) => {
    // Get auth token and set it in ApiService
    const currentUser = authService.getCurrentUser();
    if (currentUser?.token) {
      apiService.setAuthToken(currentUser.token);
      console.log("🔑 Auth token set in ApiService for user:", userId);
    }

    // Clear guest session when user authenticates
    clearGuestSession();
    console.log("🔐 Set as authenticated user:", userId);
  };

  const clearGuestSession = () => {
    // IMPORTANT: DO NOT remove guest-id immediately
    // It's needed for payment methods migration which happens after cart migration
    // The guest-id will be removed by PaymentContext after all migrations complete
    console.log(
      "ℹ️ Guest session clearing - preserving guest-id for payment methods migration",
    );

    localStorage.removeItem("xquisito-guest-name");

    // Only clear table context if user is not authenticated
    if (!user) {
      localStorage.removeItem("xquisito-table-number");
      localStorage.removeItem("xquisito-restaurant-id");
      setTableNumber(null);
    }

    // Immediately clear guest state
    setIsGuest(false);
    setGuestId(null);
    setGuestName(null);

    console.log(
      "🗑️ Guest session cleared, guest-id preserved for migrations, table context preserved for authenticated user",
    );
  };

  const setGuestNameHandler = (name: string) => {
    setGuestName(name);
    localStorage.setItem("xquisito-guest-name", name);
    console.log("👤 Guest name set:", name);
  };

  // Helper function to generate guest ID
  const generateGuestId = (): string => {
    if (typeof window !== "undefined") {
      let guestId = localStorage.getItem("xquisito-guest-id");

      if (!guestId) {
        guestId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem("xquisito-guest-id", guestId);
      }

      return guestId;
    }
    return `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const value: GuestContextType = {
    isGuest,
    guestId,
    tableNumber,
    guestName,
    setAsGuest,
    setAsAuthenticated,
    clearGuestSession,
    setGuestName: setGuestNameHandler,
  };

  return (
    <GuestContext.Provider value={value}>{children}</GuestContext.Provider>
  );
}

export function GuestProvider({ children }: GuestProviderProps) {
  return (
    <Suspense fallback={<div style={{ display: "none" }} />}>
      <GuestProviderInternal>{children}</GuestProviderInternal>
    </Suspense>
  );
}

// Custom hook to use guest context
export function useGuest(): GuestContextType {
  const context = useContext(GuestContext);
  if (context === undefined) {
    throw new Error("useGuest must be used within a GuestProvider");
  }
  return context;
}

// Helper hook to check if user is guest
export function useIsGuest(): boolean {
  const { isGuest } = useGuest();
  return isGuest;
}

// Helper hook to get guest info
export function useGuestInfo(): {
  guestId: string | null;
  tableNumber: string | null;
} {
  const { guestId, tableNumber } = useGuest();
  return { guestId, tableNumber };
}
