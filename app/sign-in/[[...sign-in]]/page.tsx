'use client';

import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center px-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="text-8xl font-bold text-gray-400 transform rotate-12 absolute top-10 left-10">
          X
        </div>
        <div className="text-8xl font-bold text-gray-400 transform -rotate-12 absolute top-20 right-10">
          Q
        </div>
        <div className="text-8xl font-bold text-gray-400 transform rotate-45 absolute bottom-32 left-20">
          X
        </div>
        <div className="text-8xl font-bold text-gray-400 transform -rotate-45 absolute bottom-40 right-20">
          Q
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600">Sign in to your Xquisito account</p>
        </div>
        
        <SignIn 
          appearance={{
            elements: {
              formButtonPrimary: 'bg-teal-700 hover:bg-teal-800 text-white',
              card: 'bg-white shadow-lg rounded-lg'
            }
          }}
          redirectUrl="/payment"
        />

        {/* XQUISITO Branding */}
        <div className="text-center mt-8">
          <h2 className="text-2xl font-bold text-gray-700 tracking-wider">
            XQUISITO
          </h2>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">
            DONDE LA TECNOLOGÍA SE ENCUENTRA CON EL BUEN COMER
          </p>
        </div>
      </div>
    </div>
  );
}