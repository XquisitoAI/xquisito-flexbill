"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Phone, User } from "lucide-react";
import { authService } from "@/app/services/auth.service";
import { useRestaurant } from "@/app/context/RestaurantContext";

type Step = "phone" | "verify" | "profile";

export default function SignUpPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { setRestaurantId } = useRestaurant();

  const restaurantId = params?.restaurantId as string;
  const tableNumber = searchParams.get("table");

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("+52");
  const [otp, setOtp] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

  // Store context
  useEffect(() => {
    if (tableNumber) {
      sessionStorage.setItem("pendingTableRedirect", tableNumber);
      sessionStorage.setItem("signupFromPaymentFlow", "true");
    }
    if (restaurantId) {
      sessionStorage.setItem("pendingRestaurantId", restaurantId);
      setRestaurantId(parseInt(restaurantId));
    }
  }, [tableNumber, restaurantId, setRestaurantId]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validar formato de teléfono
    if (!phone.startsWith("+52") || phone.length < 13) {
      setError("Por favor ingresa un número de teléfono válido mexicano");
      setLoading(false);
      return;
    }

    try {
      const response = await authService.sendPhoneOTP(phone);

      if (response.success) {
        setStep("verify");
        setCountdown(60);
      } else {
        setError(response.error || "Error al enviar el código");
      }
    } catch (err) {
      setError("Error al enviar el código OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (otp.length !== 6) {
      setError("El código debe tener 6 dígitos");
      setLoading(false);
      return;
    }

    try {
      const response = await authService.verifyPhoneOTP(phone, otp);

      if (response.success) {
        // Check if profile exists
        const profileResponse = await authService.getMyProfile();
        if (profileResponse.success && profileResponse.data?.profile) {
          const profile = profileResponse.data.profile;
          // If profile has firstName, redirect to menu
          if (profile.firstName) {
            if (tableNumber) {
              router.push(`/${restaurantId}/menu?table=${tableNumber}`);
            } else {
              router.push(`/${restaurantId}`);
            }
          } else {
            // Profile exists but incomplete, go to profile step
            setStep("profile");
          }
        } else {
          // No profile, go to profile step
          setStep("profile");
        }
      } else {
        setError(response.error || "Código inválido");
      }
    } catch (err) {
      setError("Error al verificar el código");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setError("");
    setLoading(true);

    try {
      const response = await authService.sendPhoneOTP(phone);

      if (response.success) {
        setCountdown(60);
      } else {
        setError(response.error || "Error al reenviar el código");
      }
    } catch (err) {
      setError("Error al reenviar el código");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await authService.createOrUpdateProfile({
        firstName,
        lastName,
        birthDate: birthDate || undefined,
        gender: gender as "male" | "female" | "other" | undefined,
      });

      if (response.success) {
        // Redirect to menu page with table number
        if (tableNumber) {
          router.push(`/${restaurantId}/menu?table=${tableNumber}`);
        } else {
          router.push(`/${restaurantId}`);
        }
      } else {
        setError(response.error || "Error al guardar el perfil");
      }
    } catch (err) {
      setError("Error al guardar el perfil");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a8b9b] to-[#153f43] flex flex-col justify-center items-center px-4">
      {/* Back Button */}
      <button
        onClick={() => {
          if (step === "verify") {
            setStep("phone");
            setOtp("");
            setError("");
          } else if (step === "profile") {
            // Can't go back from profile, user is already authenticated
            return;
          } else {
            router.back();
          }
        }}
        className="absolute top-4 md:top-6 lg:top-8 left-4 md:left-6 lg:left-8 p-2 md:p-3 text-white hover:bg-white/10 rounded-full transition-colors z-20"
      >
        <ArrowLeft className="size-5 md:size-6 lg:size-7" />
      </button>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <img
            src="/logo-short-green.webp"
            alt="Xquisito Logo"
            className="size-18 mx-auto mb-4"
          />
          <h1 className="text-2xl font-medium text-white">
            {step === "phone"
              ? "Ingresa tu número"
              : step === "verify"
                ? "Verifica tu código"
                : "Completa tu perfil"}
          </h1>
          <p className="text-gray-200 mt-2">
            {step === "phone"
              ? "Te enviaremos un código de verificación para tu registro"
              : step === "verify"
                ? `Enviamos un código al ${phone}`
                : "Cuéntanos un poco más sobre ti"}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-white text-sm">
            {error}
          </div>
        )}

        {/* Phone Input Step */}
        {step === "phone" && (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+52 1234567890"
                className="w-full pl-10 pr-3 py-3 text-gray-600 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a8b9b]"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black hover:bg-stone-950 text-white py-3 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Enviando..." : "Enviar código"}
            </button>
          </form>
        )}

        {/* OTP Verification Step */}
        {step === "verify" && (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="w-full px-3 py-3 text-gray-600 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a8b9b] text-center tracking-widest text-2xl"
              required
              disabled={loading}
              autoFocus
            />

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-black hover:bg-stone-950 text-white py-3 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Verificando..." : "Verificar código"}
            </button>

            {/* Resend Button */}
            <div className="text-center">
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={countdown > 0 || loading}
                className={`text-sm underline transition-colors ${
                  countdown > 0
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-white hover:text-gray-200 cursor-pointer"
                }`}
              >
                {countdown > 0
                  ? `Reenviar código en ${countdown}s`
                  : "¿No recibiste el código? Reenviar"}
              </button>
            </div>

            {/* Change Number */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setOtp("");
                  setError("");
                }}
                className="text-sm text-white hover:text-gray-200 underline"
              >
                Cambiar número
              </button>
            </div>
          </form>
        )}

        {/* Profile Completion Step */}
        {step === "profile" && (
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Nombre"
                  className="w-full pl-10 pr-3 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a8b9b]"
                  required
                  disabled={loading}
                />
              </div>

              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Apellido"
                className="w-full px-3 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a8b9b]"
                required
                disabled={loading}
              />
            </div>

            {/* Birth Date */}
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Fecha de nacimiento (opcional)
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="w-full px-3 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a8b9b]"
                disabled={loading}
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Género (opcional)
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a8b9b] cursor-pointer"
                disabled={loading}
              >
                <option value="">Selecciona...</option>
                <option value="male">Masculino</option>
                <option value="female">Femenino</option>
                <option value="other">Otro</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !firstName || !lastName}
              className="w-full bg-black hover:bg-stone-950 text-white py-3 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? "Guardando..." : "Continuar"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
