"use client";

import { useUser, UserButton, useClerk } from "@clerk/nextjs";
import { useTable } from "../context/TableContext";
import { useUserData } from "../context/UserDataContext";
import { useTableNavigation } from "../hooks/useTableNavigation";
import { useUserSync } from "../hooks/useUserSync";
import MenuHeader from "../components/MenuHeader";
import { getRestaurantData } from "../utils/restaurantData";
import { useRouter } from "next/navigation";
import {
  Check,
  CreditCard,
  LogOut,
  ShoppingCart,
  SquareMenu,
  TriangleAlert,
  X,
  Wallet,
} from "lucide-react";
import MenuHeaderBack from "../components/MenuHeaderBack";

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const { state } = useTable();
  const { signUpData, clearSignUpData } = useUserData();
  const { navigateWithTable } = useTableNavigation();
  const { saveUserToBackend, isSyncing, syncStatus, isUserSynced, userData } =
    useUserSync(signUpData);
  const restaurantData = getRestaurantData();
  const { signOut } = useClerk();
  const router = useRouter();

  // Get gender Clerk
  const gender = signUpData?.gender || user?.unsafeMetadata?.gender;
  const welcomeMessage = user
    ? gender === "female"
      ? "Bienvenida"
      : "Bienvenido"
    : "Bienvenido";

  const handleContinueToPayment = () => {
    navigateWithTable("/payment-options");
  };

  const handleSignOut = async () => {
    try {
      // Construct the redirect URL with table context
      const redirectUrl = state.tableNumber
        ? `/menu?table=${state.tableNumber}`
        : "/menu";

      console.log("🚪 Signing out and redirecting to:", redirectUrl);

      // Sign out with custom redirect URL
      await signOut({
        redirectUrl: redirectUrl,
      });
    } catch (error) {
      console.error("❌ Error during sign out:", error);
      // Fallback: navigate manually if sign out fails
      navigateWithTable("/menu");
    }
  };

  // Loading state
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a8b9b] to-[#153f43] flex items-center justify-center">
        <div className="animate-pulse">
          <img
            src="/logo-short-green.webp"
            alt="Xquisito Logo"
            className="size-24 justify-self-center"
          />
        </div>
      </div>
    );
  }

  // Not authenticated (shouldn't happen but good fallback)
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a8b9b] to-[#153f43] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-medium text-white mb-4">
            Acceso denegado
          </h1>
          <p className="text-white mb-6">
            Inicia sesión para acceder a tu perfil
          </p>
          <button
            onClick={() => navigateWithTable("/checkout")}
            className="bg-black hover:bg-stone-950 w-full text-white py-3 rounded-full cursor-pointer transition-colors"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a8b9b] to-[#153f43]">
      <MenuHeaderBack
        restaurant={restaurantData}
        tableNumber={state.tableNumber}
      />

      <div className="mt-6 bg-white rounded-t-4xl p-6">
        {/* Welcome Header */}
        <div className="items-center justify-center">
          <div className="justify-self-end">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10",
                },
              }}
            />
          </div>

          <div className="flex flex-col items-center">
            <div className="size-28 rounded-full bg-gray-200 overflow-hidden border border-gray-400 shadow-sm">
              <img
                src={
                  user?.imageUrl ||
                  "https://t4.ftcdn.net/jpg/02/15/84/43/360_F_215844325_ttX9YiIIyeaR7Ne6EaLLjMAmy4GvPC69.jpg"
                }
                alt="Profile Pic"
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-black text-3xl font-medium mt-3 mb-6">
              ¡{welcomeMessage}
              {user?.firstName ? ` ${user.firstName}` : ""}!
            </h1>
          </div>
        </div>

        {/* Sync Status Alert */}
        {!isUserSynced && (
          <div className="border border-yellow-600/50 rounded-lg py-1.5 px-2 bg-yellow-50/30 mb-3">
            <div className="flex items-center gap-2">
              <div className="size-6 bg-yellow-500 rounded-full flex items-center justify-center">
                <TriangleAlert className="size-4" />
              </div>
              <div>
                <p className="text-yellow-800 text-sm">
                  {isSyncing
                    ? "Sincronizando datos de tu perfil..."
                    : "Sincronización de datos pendiente"}
                </p>
                {/*<p className="text-yellow-600 text-xs">
                  {isSyncing
                    ? "Espere mientras guardamos su información"
                    : "Tus datos de perfil se guardarán automáticamente"}
                </p>*/}
              </div>
              {!isSyncing && (
                <button
                  onClick={saveUserToBackend}
                  className="ml-auto px-3 py-1 bg-yellow-500 text-white text-xs rounded-md hover:bg-yellow-600 transition-colors cursor-pointer"
                >
                  Sync
                </button>
              )}
            </div>
          </div>
        )}

        {syncStatus === "success" && (
          <div className="bg-green-50 border border-green-200 rounded-lg py-1.5 px-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="size-6 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="size-4" />
              </div>
              <p className="text-green-800 text-sm">
                Profile data synchronized successfully!
              </p>
            </div>
          </div>
        )}

        {syncStatus === "error" && (
          <div className="bg-red-50 border border-red-200 rounded-lg py-1.5 px-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="size-6 bg-red-500 rounded-full flex items-center justify-center">
                <X className="size-4" />
              </div>
              <div>
                <p className="text-red-800 text-sm">
                  Error al sincronizar los datos del perfil
                </p>
                {/*<p className="text-red-600 text-xs">
                  Check the console for more details
                </p>*/}
              </div>
              <button
                onClick={saveUserToBackend}
                disabled={isSyncing}
                className="ml-auto px-3 py-1 bg-red-500 text-white text-xs rounded-md hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        {/* User Information Card */}
        <div className="grid md:grid-cols-2 gap-x-6 mb-6">
          <div className="divide-y divide-[#8e8e8e]">
            <div className="flex items-center justify-between mb-4 pb-2">
              <h2 className="font-medium text-black text-xl">
                Información del perfil
              </h2>
              <div className="flex items-center gap-1">
                <div
                  className={`w-2 h-2 rounded-full ${isUserSynced ? "bg-green-500" : "bg-yellow-500"}`}
                ></div>
                <span className="text-xs text-gray-500">
                  {isUserSynced ? "Synced" : "Pendiente"}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Nombre completo</label>
                <p className="text-black/80 text-sm bg-gray-100 px-3 py-1 rounded-xl">
                  {user.fullName || "Desconocido"}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Email</label>
                <p className="text-black/80 text-sm bg-gray-100 px-3 py-1 rounded-xl">
                  {user.emailAddresses[0]?.emailAddress || "Desconocido"}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Telefono</label>
                <p className="text-black/80 text-sm bg-gray-100 px-3 py-1 rounded-xl">
                  {user.phoneNumbers[0]?.phoneNumber || "Desconocido"}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Miembro desde</label>
                <p className="text-black/80 text-sm bg-gray-100 px-3 py-1 rounded-xl">
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : "Unknown"}
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-[#8e8e8e] mt-6">
            <h2 className="font-medium text-black pb-2 mb-2 text-xl">
              Detalles de la cuenta
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-500">ID de usuario</label>
                <p className="text-black/80 bg-gray-100 px-3 py-1 rounded-xl text-sm font-mono">
                  {user.id}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">
                  Nombre de usuario
                </label>
                <p className="text-black/80 text-sm bg-gray-100 px-3 py-1 rounded-xl">
                  {user.username || "No establecido"}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">
                  Email verificado
                </label>
                <p className="text-black/80">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${
                      user.emailAddresses[0]?.verification?.status ===
                      "verified"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {user.emailAddresses[0]?.verification?.status === "verified"
                      ? "Verificado"
                      : "Pendiente"}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">
                  Último inicio de sesión
                </label>
                <p className="text-black/80 text-sm bg-gray-100 px-3 py-1 rounded-xl">
                  {user.lastSignInAt
                    ? new Date(user.lastSignInAt).toLocaleString()
                    : "Desconocido"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="divide-y divide-[#8e8e8e]">
          <h2 className="font-medium text-black pb-2 mb-2 text-xl">
            ¿Qué te gustaría hacer?
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            <button
              onClick={handleContinueToPayment}
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-teal-50 hover:border-teal-300 transition-colors group cursor-pointer"
            >
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center group-hover:bg-teal-200">
                <CreditCard className="size-5 text-teal-700" />
              </div>
              <div className="text-left">
                <p className="text-black">Continuar con el pago</p>
                <p className="text-sm text-gray-600">Paga tu pedido</p>
              </div>
            </button>

            <button
              onClick={() => router.push("/menu")}
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors group cursor-pointer"
            >
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200">
                <SquareMenu className="size-5 text-gray-700" />
              </div>
              <div className="text-left">
                <p className="text-black">Ver menú</p>
                <p className="text-sm text-gray-600">
                  Explora nuestros platillos
                </p>
              </div>
            </button>

            <button
              onClick={() => navigateWithTable("/cart")}
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors group cursor-pointer"
            >
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200">
                <ShoppingCart className="size-5 text-gray-700" />
              </div>
              <div className="text-left">
                <p className="text-black">Ver carrito</p>
                <p className="text-sm text-gray-600">Revisa tu pedido</p>
              </div>
            </button>

            <button
              onClick={() => navigateWithTable("/saved-cards")}
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors group cursor-pointer"
            >
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200">
                <Wallet className="size-5 text-purple-700" />
              </div>
              <div className="text-left">
                <p className="text-black">Mis tarjetas</p>
                <p className="text-sm text-gray-600">
                  Gestionar métodos de pago
                </p>
              </div>
            </button>
          </div>
        </div>
        {/* Sign Out Option */}
        <div className="mt-6 pt-6 border-t border-[#8e8e8e]">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 border border-red-400 rounded-xl px-4 py-2 hover:bg-red-50 text-red-600 hover:text-red-800 transition-colors cursor-pointer"
          >
            <LogOut className="size-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
