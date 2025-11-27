"use client";

import { useState, Suspense, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { ScanFace, Phone, ArrowLeft, MessageSquare, RotateCcw } from "lucide-react";
import { useTableNavigation } from "@/app/hooks/useTableNavigation";
import { useRestaurant } from "@/app/context/RestaurantContext";
import { usePasskeySupport } from "@/app/hooks/usePasskeySupport";
import { authService } from "@/app/services/auth.service";

function SignInContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { navigateWithTable } = useTableNavigation();
  const { setRestaurantId } = useRestaurant();

  // Auth state (replacing Clerk hooks)
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoaded, setIsLoaded] = useState(true);
  const [hasRedirected, setHasRedirected] = useState(false);

  // SMS Authentication states
  const [authStep, setAuthStep] = useState<"phone" | "code">("phone");
  const [countryCode, setCountryCode] = useState("+52"); // Default Mexico
  const [phoneNumber, setPhoneNumber] = useState("");
  const [fullPhoneNumber, setFullPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);

  // Passkey states (keep for later implementation)
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeyError, setPasskeyError] = useState("");
  const { isSupported: passkeySupported } = usePasskeySupport();

  // Temporarily commented - Old form states for email/password
  /*
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Password reset states
  const [forgotPasswordStep, setForgotPasswordStep] = useState<
    "idle" | "email" | "code" | "password"
  >("idle");
  const [resetEmail, setResetEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  */

  const tableNumber = searchParams.get("table");
  const restaurantId = params?.restaurantId as string;

  // Store table number and restaurant ID for post-signin redirect
  useEffect(() => {
    if (tableNumber) {
      sessionStorage.setItem("pendingTableRedirect", tableNumber);
    }
    if (restaurantId) {
      sessionStorage.setItem("pendingRestaurantId", restaurantId);
      setRestaurantId(parseInt(restaurantId));
    }
  }, [tableNumber, restaurantId, setRestaurantId]);

  // Countdown timer for SMS resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (authStep === "code" && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [authStep, countdown]);

  const handleSignInSuccess = useCallback(() => {
    navigateWithTable("/payment-options");
  }, [navigateWithTable]);

  useEffect(() => {
    if (isLoaded && isSignedIn && !hasRedirected) {
      setHasRedirected(true);
      // Prevent any automatic navigation by Clerk
      const timer = setTimeout(() => {
        handleSignInSuccess();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoaded, isSignedIn, hasRedirected, handleSignInSuccess]);

  // Intercept if user gets redirected to root after sign-in
  useEffect(() => {
    if (
      isSignedIn &&
      tableNumber &&
      window.location.pathname === "/" &&
      !hasRedirected
    ) {
      setHasRedirected(true);
      handleSignInSuccess();
    }
  }, [isSignedIn, tableNumber, hasRedirected, handleSignInSuccess]);

  // Send SMS code function
  const handleSendSMSCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;

    setIsLoading(true);
    setError("");

    try {
      const fullPhone = countryCode + phoneNumber;
      setFullPhoneNumber(fullPhone);

      console.log("🚀 Sending SMS code to:", fullPhone);

      // Connect with backend API
      const response = await authService.sendOTPCode(fullPhone);

      if (response.success) {
        console.log("✅ SMS sent successfully:", response.message);

        // Move to code verification step
        setAuthStep("code");
        setCountdown(60);
        setCanResend(false);
      } else {
        throw new Error(response.error || "Error al enviar código SMS");
      }

    } catch (err: any) {
      console.error("❌ SMS send error:", err);
      setError(err.message || "Error al enviar código SMS");
    } finally {
      setIsLoading(false);
    }
  };

  // Verify SMS code function
  const handleVerifySMSCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length < 4) {
      setError("Por favor ingresa el código completo");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      console.log("🔍 Verifying SMS code:", {
        phone: fullPhoneNumber,
        code: verificationCode
      });

      // Connect with backend API
      const response = await authService.verifyOTPCode(fullPhoneNumber, verificationCode);

      if (response.success) {
        console.log("Response:", response);
        console.log("✅ SMS verification successful:", response.message);

        // Store session data
        authService.storeSession(response.data.session);

        // Set user as signed in
        setIsSignedIn(true);

        console.log("👤 User authenticated:", {
          id: response.data.user.id,
          phone: response.data.user.phone,
          accountType: response.data.user.accountType
        });

      } else {
        throw new Error(response.error || "Código incorrecto. Inténtalo de nuevo.");
      }

    } catch (err: any) {
      console.error("❌ SMS verification error:", err);
      setError(err.message || "Código incorrecto. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  // Resend SMS code function
  const handleResendCode = async () => {
    setIsLoading(true);
    setError("");
    setCanResend(false);
    setCountdown(60);

    try {
      console.log("🔄 Resending SMS code to:", fullPhoneNumber);

      // Connect with backend API - same endpoint as initial send
      const response = await authService.sendOTPCode(fullPhoneNumber);

      if (response.success) {
        console.log("✅ SMS resent successfully:", response.message);
      } else {
        throw new Error(response.error || "Error al reenviar código");
      }

    } catch (err: any) {
      console.error("❌ SMS resend error:", err);
      setError(err.message || "Error al reenviar código");
      // Reset resend availability if there's an error
      setCanResend(true);
      setCountdown(0);
    } finally {
      setIsLoading(false);
    }
  };

  /* TEMPORARILY COMMENTED - OLD FUNCTIONS FOR EMAIL/PASSWORD AUTH

  // Password reset functions
  const handleForgotPasswordEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // TODO: Conectar con backend API para password reset
      console.log("Requesting password reset for:", resetEmail);

      // Temporary simulation
      await new Promise(resolve => setTimeout(resolve, 1000));

      setForgotPasswordStep("code");
    } catch (err: any) {
      setError(err.message || "Error al enviar el código");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordStep("password");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // TODO: Conectar con backend API para confirmar password reset
      console.log("Resetting password with code:", code);

      // Temporary simulation
      await new Promise(resolve => setTimeout(resolve, 1000));

      setForgotPasswordStep("idle");
      alert("Contraseña actualizada exitosamente");
    } catch (err: any) {
      setError(err.message || "Error al actualizar la contraseña");
    } finally {
      setIsLoading(false);
    }
  };

  // OAuth sign-in functions
  const handleSocialLogin = async (provider: 'google' | 'microsoft' | 'facebook') => {
    setIsLoading(true);
    setError("");

    try {
      // TODO: Conectar con backend API para OAuth
      console.log("Starting OAuth flow for:", provider);

      // Temporary simulation
      await new Promise(resolve => setTimeout(resolve, 1000));

      // In real implementation, this would redirect to OAuth provider
      window.location.href = `/api/auth/oauth/${provider}`;

    } catch (err: any) {
      console.error("OAuth error:", err);
      setError(err.message || `Error al conectar con ${provider}`);
      setIsLoading(false);
    }
  };

  // Passkey sign-in function
  const handlePasskeySignIn = async () => {
    if (!passkeySupported) {
      setPasskeyError("Tu navegador no soporta autenticación biométrica");
      return;
    }

    setPasskeyLoading(true);
    setPasskeyError("");

    try {
      // TODO: Implementar WebAuthn API manual para Passkeys
      console.log("Attempting passkey authentication");

      // Temporary simulation
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulate passkey success
      setIsSignedIn(true);

    } catch (err: any) {
      console.error("Error en autenticación con Passkey:", err);
      setPasskeyError("Error en autenticación biométrica");
    } finally {
      setPasskeyLoading(false);
    }
  };

  */

  //  TEMPORARILY COMMENTED - PASSWORD RESET HTML
  // if (forgotPasswordStep !== "idle") {
  //   return (
  //     <div className="min-h-screen bg-gradient-to-br from-[#0a8b9b] to-[#153f43] flex flex-col justify-center items-center px-4">
  //       {/* Back Button */}
  //       <button
  //         onClick={() => router.back()}
  //         className="absolute top-4 md:top-6 lg:top-8 left-4 md:left-6 lg:left-8 p-2 md:p-3 text-white hover:bg-white/10 rounded-full transition-colors z-20"
  //       >
  //         <ArrowLeft className="size-5 md:size-6 lg:size-7" />
  //       </button>

  //       <div className="relative z-10 w-full max-w-md text-center flex flex-col items-center">
  //         <div className="mb-6">
  //           <img
  //             src="/logo-short-green.webp"
  //             alt="Xquisito Logo"
  //             className="size-18 justify-self-center"
  //           />
  //         </div>
  //         <div className="w-full">
  //           {forgotPasswordStep === "email" && (
  //             <form onSubmit={handleForgotPasswordEmail}>
  //               <div className="mb-6 text-center">
  //                 <h1 className="text-xl font-medium text-white mb-2">
  //                   Recupera tu contraseña
  //                 </h1>
  //                 <p className="text-gray-200 text-sm">
  //                   Ingresa tu email para recibir un código
  //                 </p>
  //               </div>

  //               <div className="relative mb-4">
  //                 <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
  //                 <input
  //                   required
  //                   type="email"
  //                   value={resetEmail}
  //                   onChange={(e) => setResetEmail(e.target.value)}
  //                   className="w-full pl-10 pr-3 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a8b9b] focus:border-transparent"
  //                   placeholder="Email"
  //                 />
  //               </div>

  //               {error && <p className="text-rose-400 text-xs mb-4">{error}</p>}

  //               <button
  //                 type="submit"
  //                 className="bg-black hover:bg-stone-950 w-full text-white py-3 rounded-full cursor-pointer transition-colors"
  //               >
  //                 Enviar código
  //               </button>

  //               <button
  //                 type="button"
  //                 onClick={() => setForgotPasswordStep("idle")}
  //                 className="text-white text-sm underline cursor-pointer mt-4 block text-center w-full"
  //               >
  //                 Volver al inicio de sesión
  //               </button>
  //             </form>
  //           )}

  //           {forgotPasswordStep === "code" && (
  //             <form onSubmit={handleVerifyCode}>
  //               <div className="mb-6 text-center">
  //                 <h1 className="text-xl font-medium text-white mb-2">
  //                   Revisa tu email
  //                 </h1>
  //                 <p className="text-gray-200 text-sm">
  //                   Hemos enviado un código de verificación a {resetEmail}
  //                 </p>
  //               </div>

  //               <input
  //                 required
  //                 type="text"
  //                 value={code}
  //                 onChange={(e) => setCode(e.target.value)}
  //                 className="w-full px-3 py-2 border bg-white text-black border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a8b9b] focus:border-transparent text-center tracking-widest mb-4"
  //                 placeholder="Código"
  //               />

  //               <button
  //                 type="submit"
  //                 className="bg-black hover:bg-stone-950 w-full text-white py-3 rounded-full cursor-pointer transition-colors"
  //               >
  //                 Continuar
  //               </button>
  //             </form>
  //           )}

  //           {forgotPasswordStep === "password" && (
  //             <form onSubmit={handleResetPassword}>
  //               <div className="mb-6 text-center">
  //                 <h1 className="text-xl font-medium text-white mb-2">
  //                   Nueva contraseña
  //                 </h1>
  //                 <p className="text-gray-200 text-sm">
  //                   Ingresa tu nueva contraseña
  //                 </p>
  //               </div>

  //               <div className="relative mb-4">
  //                 <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
  //                 <input
  //                   required
  //                   type="password"
  //                   value={newPassword}
  //                   onChange={(e) => setNewPassword(e.target.value)}
  //                   className="w-full pl-10 pr-3 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a8b9b] focus:border-transparent"
  //                   placeholder="Nueva contraseña"
  //                 />
  //               </div>

  //               {error && <p className="text-rose-400 text-xs mb-4">{error}</p>}

  //               <button
  //                 type="submit"
  //                 className="bg-black hover:bg-stone-950 w-full text-white py-3 rounded-full cursor-pointer transition-colors"
  //               >
  //                 Actualizar contraseña
  //               </button>
  //             </form>
  //           )}
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a8b9b] to-[#153f43] flex flex-col justify-center items-center px-4">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="absolute top-4 md:top-6 lg:top-8 left-4 md:left-6 lg:left-8 p-2 md:p-3 text-white hover:bg-white/10 rounded-full transition-colors z-20"
      >
        <ArrowLeft className="size-5 md:size-6 lg:size-7" />
      </button>

      <div className="relative z-10 w-full max-w-md text-center flex flex-col items-center mb-12">
        <div className="mb-6">
          <img
            src="/logo-short-green.webp"
            alt="Xquisito Logo"
            className="size-18 justify-self-center"
          />
        </div>
        <div className="w-full">
          {authStep === "phone" ? (
            // PHONE NUMBER INPUT STEP
            <form onSubmit={handleSendSMSCode}>
              <div className="mb-6 text-center">
                <h1 className="text-xl font-medium text-white mb-2">
                  Accede con tu teléfono
                </h1>
                <p className="text-gray-200 text-sm">
                  Te enviaremos un código de verificación
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    {/* Country Code Selector */}
                    <div className="relative">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="w-20 pl-3 pr-8 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a8b9b] focus:border-transparent appearance-none"
                        disabled={isLoading}
                      >
                        <option value="+52">🇲🇽 +52</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+34">🇪🇸 +34</option>
                        <option value="+54">🇦🇷 +54</option>
                        <option value="+57">🇨🇴 +57</option>
                        <option value="+58">🇻🇪 +58</option>
                      </select>
                    </div>

                    {/* Phone Number Input */}
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
                      <input
                        required
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => {
                          // Only allow numbers
                          const value = e.target.value.replace(/\D/g, '');
                          setPhoneNumber(value);
                        }}
                        className="w-full pl-10 pr-3 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a8b9b] focus:border-transparent"
                        placeholder="Número de teléfono"
                        disabled={isLoading}
                        maxLength={10}
                      />
                    </div>
                  </div>
                  <p className="text-gray-300 text-xs">
                    Ejemplo: {countryCode === "+52" ? "5512345678" : countryCode === "+1" ? "2125551234" : "123456789"}
                  </p>
                </div>
              </div>

              {error && (
                <div className="text-rose-400 text-xs mt-2 text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !phoneNumber || phoneNumber.length < 8}
                className="bg-black hover:bg-stone-950 disabled:opacity-50 disabled:cursor-not-allowed w-full text-white py-3 rounded-full cursor-pointer transition-colors flex items-center justify-center mt-4"
              >
                {isLoading ? (
                  <>
                    <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Enviando código...
                  </>
                ) : (
                  <>
                    <MessageSquare className="size-4 mr-2" />
                    Enviar código por SMS
                  </>
                )}
              </button>
            </form>
          ) : (
            // CODE VERIFICATION STEP
            <form onSubmit={handleVerifySMSCode}>
              <div className="mb-6 text-center">
                <h1 className="text-xl font-medium text-white mb-2">
                  Verifica tu teléfono
                </h1>
                <p className="text-gray-200 text-sm">
                  Código enviado a {fullPhoneNumber}
                </p>
                <button
                  type="button"
                  onClick={() => setAuthStep("phone")}
                  className="text-gray-300 text-xs underline mt-1 hover:text-white transition-colors"
                >
                  Cambiar número
                </button>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <input
                    required
                    type="text"
                    value={verificationCode}
                    onChange={(e) => {
                      // Only allow numbers and limit to 6 characters
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setVerificationCode(value);
                    }}
                    className="w-full px-3 py-3 text-center text-lg tracking-widest bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a8b9b] focus:border-transparent"
                    placeholder="000000"
                    disabled={isLoading}
                    maxLength={6}
                  />
                </div>
              </div>

              {error && (
                <div className="text-rose-400 text-xs mt-2 text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || verificationCode.length < 4}
                className="bg-black hover:bg-stone-950 disabled:opacity-50 disabled:cursor-not-allowed w-full text-white py-3 rounded-full cursor-pointer transition-colors flex items-center justify-center mt-4"
              >
                {isLoading ? (
                  <>
                    <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Verificando...
                  </>
                ) : (
                  "Verificar código"
                )}
              </button>

              {/* Resend Code Button */}
              <div className="text-center mt-4">
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={isLoading}
                    className="text-white text-sm underline hover:text-gray-200 transition-colors disabled:opacity-50"
                  >
                    <RotateCcw className="size-3 inline mr-1" />
                    Reenviar código
                  </button>
                ) : (
                  <p className="text-gray-300 text-sm">
                    Reenviar código en {countdown}s
                  </p>
                )}
              </div>
            </form>
          )}

          {/* TEMPORARILY COMMENTED - PASSWORD RESET AND SOCIAL LOGIN
            <button
              type="button"
              onClick={() => setForgotPasswordStep("email")}
              className="text-white text-sm underline cursor-pointer my-6 block mx-auto"
            >
              Olvidaste tu contraseña
            </button>

            <div className="flex items-center justify-center gap-12">
              <button
                type="button"
                onClick={() => handleSocialLogin('google')}
                disabled={isLoading}
                className="p-3 border border-white rounded-full hover:bg-white/10 transition-colors font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title="Continuar con Google"
              >
                <svg className="size-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => handleSocialLogin('microsoft')}
                disabled={isLoading}
                className="p-3 border border-white rounded-full hover:bg-white/10 transition-colors font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title="Continuar con Microsoft"
              >
                <svg className="size-6" viewBox="0 0 24 24">
                  <path fill="#f35325" d="M1 1h10v10H1z" />
                  <path fill="#81bc06" d="M13 1h10v10H13z" />
                  <path fill="#05a6f0" d="M1 13h10v10H1z" />
                  <path fill="#ffba08" d="M13 13h10v10H13z" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => handleSocialLogin('facebook')}
                disabled={isLoading}
                className="p-3 border border-white rounded-full hover:bg-white/10 transition-colors font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title="Continuar con Facebook"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="size-6"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="#1877F2"
                    d="M24 12c0-6.627-5.373-12-12-12S0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854V15.47H7.078V12h3.047V9.356c0-3.007 1.792-4.668 4.533-4.668 1.312 0 2.686.234 2.686.234v2.953H15.83c-1.491 0-1.956.925-1.956 1.874V12h3.328l-.532 3.47h-2.796v8.385C19.612 22.954 24 17.99 24 12z"
                  />
                  <path
                    fill="#fff"
                    d="M16.671 15.47L17.203 12h-3.328V9.749c0-.949.465-1.874 1.956-1.874h1.513V4.922s-1.374-.234-2.686-.234c-2.741 0-4.533 1.66-4.533 4.668V12H7.078v3.47h3.047v8.385a12.09 12.09 0 003.75 0V15.47h2.796z"
                  />
                </svg>
              </button>
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center pr-5">
                <div className="w-1/2 border-t border-white" />
              </div>
              <div className="absolute inset-0 flex items-center  justify-end pl-5">
                <div className="w-1/2 border-t border-white" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 text-white">ó</span>
              </div>
            </div>
          */}

          {/* <button
            type="button"
            onClick={() => {
              navigateWithTable("/sign-up");
            }}
            disabled={isLoading}
            className="bg-black hover:bg-stone-950 disabled:opacity-50 disabled:cursor-not-allowed w-full text-white py-3 rounded-full font-normal cursor-pointer transition-colors"
          >
            Crear cuenta
          </button> */}
          
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInContent />
    </Suspense>
  );
}
