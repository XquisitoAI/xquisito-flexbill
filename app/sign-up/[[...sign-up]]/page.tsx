"use client";

import { useState, useEffect } from "react";
import * as Clerk from "@clerk/elements/common";
import * as SignUp from "@clerk/elements/sign-up";
import { useUser, useSignUp } from "@clerk/nextjs";
import { useUserData } from "../../context/UserDataContext";
import { useRouter } from "next/navigation";
import { ScanFace, Mail, KeyRound, User } from "lucide-react";
import { useTableNavigation } from "@/app/hooks/useTableNavigation";

export default function SignUpPage() {
  const router = useRouter();
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");

  const { user } = useUser();
  const { signUp, isLoaded } = useSignUp();
  const { updateSignUpData } = useUserData();
  const { navigateWithTable } = useTableNavigation();

  const handleContinueSubmit = async () => {
    // This function is handled by the dashboard sync now
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a8b9b] to-[#153f43] flex flex-col justify-center items-center px-4">
      <div className="relative z-10 w-full max-w-md text-center flex flex-col items-center">
        <div className="mb-6">
          <img
            src="/logo-short-green.webp"
            alt="Xquisito Logo"
            className="size-18 justify-self-center"
          />
        </div>
        <div className="w-full">
          <SignUp.Root>
            <SignUp.Step name="start">
              <div className="mb-6 text-center">
                <h1 className="text-xl font-semibold text-white mb-2">
                  Crea una cuenta de Xquisito
                </h1>
              </div>

              {/* Personal Information */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Clerk.Field name="firstName" className="space-y-2">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <Clerk.Input
                        required
                        className="w-full pl-10 pr-3 py-2 text-gray-600 border bg-white border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a8b9b] focus:border-transparent"
                        placeholder="Nombre"
                      />
                    </div>
                    <Clerk.FieldError className="text-rose-400 text-xs" />
                  </Clerk.Field>

                  <Clerk.Field name="lastName" className="space-y-2">
                    <Clerk.Input
                      required
                      className="w-full px-3 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a8b9b] focus:border-transparent"
                      placeholder="Apellido"
                    />
                    <Clerk.FieldError className="text-rose-400 text-xs" />
                  </Clerk.Field>
                </div>

                <Clerk.Field name="emailAddress" className="space-y-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
                    <Clerk.Input
                      required
                      type="email"
                      className="w-full pl-10 pr-3 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a8b9b] focus:border-transparent"
                      placeholder="Email"
                    />
                  </div>
                  <Clerk.FieldError className="text-rose-400 text-xs" />
                </Clerk.Field>

                <Clerk.Field name="password" className="space-y-2 relative">
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
                    <Clerk.Input
                      required
                      type="password"
                      className="w-full pl-10 pr-3 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a8b9b] focus:border-transparent"
                      placeholder="Contraseña"
                    />
                  </div>
                  <Clerk.FieldError className="text-rose-400 text-xs" />
                </Clerk.Field>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      {/*<label className="block text-sm font-medium text-gray-700">Age *</label>*/}
                      <select
                        required
                        value={age}
                        onChange={(e) => {
                          setAge(e.target.value);
                          updateSignUpData({
                            age: e.target.value
                              ? parseInt(e.target.value)
                              : null,
                          });
                        }}
                        className="cursor-pointer w-full px-3 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a8b9b] focus:border-transparent"
                      >
                        <option value="" className="text-gray-600">
                          Edad
                        </option>
                        {Array.from({ length: 83 }, (_, i) => 18 + i).map(
                          (ageOption) => (
                            <option
                              key={ageOption}
                              value={ageOption}
                              className="text-gray-600"
                            >
                              {ageOption}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div className="space-y-2">
                      {/*<label className="block text-sm font-medium text-gray-700">Gender *</label>*/}
                      <select
                        required
                        value={gender}
                        onChange={(e) => {
                          setGender(e.target.value);
                          updateSignUpData({ gender: e.target.value || null });
                        }}
                        className="cursor-pointer w-full px-3 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a8b9b] focus:border-transparent"
                      >
                        <option value="" className="text-gray-600">
                          Género
                        </option>
                        <option value="male" className="text-gray-600">
                          Masculino
                        </option>
                        <option value="female" className="text-gray-600">
                          Femenino
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* CAPTCHA container */}
              <div id="clerk-captcha" className="mt-6"></div>

              <div className="flex items-center justify-center gap-3 mt-6">
                <SignUp.Action
                  submit
                  className="bg-black hover:bg-stone-950 w-full text-white py-3 rounded-full cursor-pointer transition-colors"
                >
                  Crear cuenta
                </SignUp.Action>
                <div className="p-3 border border-white hover:bg-white/10 rounded-full cursor-pointer">
                  <ScanFace className="size-6" />
                </div>
              </div>

              <div
                className="text-white text-sm my-8 underline cursor-pointer"
                onClick={() => {
                  navigateWithTable("/payment-options");
                }}
              >
                Continuar como invitado
              </div>

              {/* Social Login */}
              <div className="flex items-center justify-center gap-12 mb-6">
                <Clerk.Connection
                  name="google"
                  className="p-3 border border-white rounded-full hover:bg-white/10 transition-colors font-medium cursor-pointer"
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
                </Clerk.Connection>

                <Clerk.Connection
                  name="microsoft"
                  className="p-3 border border-white rounded-full hover:bg-white/10 transition-colors font-medium cursor-pointer"
                >
                  <svg className="size-6" viewBox="0 0 24 24">
                    <path fill="#f35325" d="M1 1h10v10H1z" />
                    <path fill="#81bc06" d="M13 1h10v10H13z" />
                    <path fill="#05a6f0" d="M1 13h10v10H1z" />
                    <path fill="#ffba08" d="M13 13h10v10H13z" />
                  </svg>
                </Clerk.Connection>
              </div>

              <div className="relative my-6">
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

              <div
                className="bg-black hover:bg-stone-950 w-full text-white py-3 rounded-full font-medium cursor-pointer transition-colors mt-6"
                onClick={() => router.push("/sign-in")}
              >
                Iniciar sesión
              </div>
            </SignUp.Step>

            <SignUp.Step name="continue">
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-white mb-2">
                  Completa tu perfil
                </h1>
                <p className="text-gray-600">Cuéntanos mas sobre ti</p>
              </div>

              {/* <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Age</label>
                    <select 
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option value="">Select age</option>
                      {Array.from({ length: 83 }, (_, i) => 18 + i).map(ageOption => (
                        <option key={ageOption} value={ageOption}>{ageOption}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Gender</label>
                    <select 
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="non-binary">Non-binary</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </div>
                </div>

                <Clerk.Field name="username" className="space-y-2">
                  <Clerk.Label className="block text-sm font-medium text-gray-700">Username (Optional)</Clerk.Label>
                  <Clerk.Input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                  <Clerk.FieldError className="text-red-600 text-xs" />
                </Clerk.Field>
              </div> */}

              <SignUp.Action
                submit
                className="bg-black hover:bg-stone-950 w-full text-white py-3 rounded-full font-medium cursor-pointer transition-colors mt-6"
                onSubmit={handleContinueSubmit}
              >
                Continue
              </SignUp.Action>
            </SignUp.Step>

            <SignUp.Step name="verifications">
              <SignUp.Strategy name="phone_code">
                <div className="mb-6 text-center">
                  <h1 className="text-2xl font-bold text-white mb-2">
                    Revisa tus mensajes
                  </h1>
                  <p className="text-gray-200">
                    Hemos enviado un código de verificación a tu teléfono
                  </p>
                </div>

                <Clerk.Field name="code" className="space-y-2">
                  <Clerk.Input
                    placeholder="Código"
                    className="w-full px-3 py-2 border bg-white text-black border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a8b9b] focus:border-transparent text-center tracking-widest"
                  />
                  <Clerk.FieldError className="text-rose-400 text-xs" />
                </Clerk.Field>

                <SignUp.Action
                  submit
                  className="bg-black hover:bg-stone-950 w-full text-white py-3 rounded-full font-medium cursor-pointer transition-colors mt-6"
                >
                  Verificar teléfono
                </SignUp.Action>
              </SignUp.Strategy>

              <SignUp.Strategy name="email_code">
                <div className="mb-6 text-center">
                  <h1 className="text-2xl font-bold text-white mb-2">
                    Revisa tu email
                  </h1>
                  <p className="text-gray-200">
                    Hemos enviado un código de verficación a tu correo
                  </p>
                </div>

                <Clerk.Field name="code" className="space-y-2">
                  <Clerk.Input
                    placeholder="Código"
                    className="w-full px-3 py-2 border bg-white text-black border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a8b9b] focus:border-transparent text-center tracking-widest"
                  />
                  <Clerk.FieldError className="text-rose-400 text-xs" />
                </Clerk.Field>

                <SignUp.Action
                  submit
                  className="bg-black hover:bg-stone-950 w-full text-white py-3 rounded-full font-medium cursor-pointer transition-colors mt-6"
                >
                  Verificar Email
                </SignUp.Action>
              </SignUp.Strategy>
            </SignUp.Step>
          </SignUp.Root>
        </div>
      </div>
    </div>
  );
}
