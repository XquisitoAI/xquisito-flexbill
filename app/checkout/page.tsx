'use client';

import { useTable } from "../context/TableContext";
import { useTableNavigation } from "../hooks/useTableNavigation";
import { useGuest } from "../context/GuestContext";
import { apiService } from "../utils/api";
import { SignInButton, SignedIn, SignedOut, useUser } from '@clerk/nextjs';
import { useEffect } from 'react';

export default function CheckoutPage() {
  const { state } = useTable();
  const { navigateWithTable } = useTableNavigation();
  const { setAsGuest } = useGuest();
  const { user, isLoaded } = useUser();

  // Redirect authenticated users automatically
  useEffect(() => {
    if (isLoaded && user) {
      navigateWithTable('/payment');
    }
  }, [isLoaded, user, navigateWithTable]);

  const handleContinueAsGuest = () => {    
    // Initialize guest session using context
    try {
      // Set user as guest with table number from context
      const tableNum = state.tableNumber?.toString() || undefined;
      setAsGuest(tableNum);
      
      // Navigate to payment page as guest
      navigateWithTable('/payment');
            
    } catch (error) {
      console.error('❌ Error initializing guest session:', error);
      // Still navigate even if there's an error
      navigateWithTable('/payment');
    }
  };

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

      <div className="relative z-10 w-full max-w-sm">
        {/* Welcome Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-2xl font-medium text-gray-800 text-center mb-6">
            Welcome
          </h1>
          
          <div className="space-y-3">
            <SignedOut>
              {/* Sign In Button */}
              <SignInButton mode="modal">
                <button className="w-full flex items-center justify-between bg-white border border-gray-300 rounded-lg px-4 py-3 hover:bg-gray-50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    <span className="text-gray-800 font-medium">Sign In</span>
                  </div>
                  <div className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center group-hover:border-gray-400">
                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              </SignInButton>

              {/* Sign Up Button */}
              <button 
                onClick={() => navigateWithTable('/sign-up')}
                className="w-full flex items-center justify-between bg-white border border-gray-300 rounded-lg px-4 py-3 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span className="text-gray-800 font-medium">Sign Up</span>
                </div>
                <div className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center group-hover:border-gray-400">
                  <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              {/* Continue as Guest */}
              <button 
                onClick={handleContinueAsGuest}
                className="w-full flex items-center justify-between bg-white border border-gray-300 rounded-lg px-4 py-3 hover:bg-gray-50 transition-colors group"
              >
                <span className="text-gray-600 font-medium">Continue as Guest</span>
                <div className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center group-hover:border-gray-400">
                  <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </SignedOut>

            <SignedIn>
              {/* User is already signed in, they should be redirected automatically */}
              <div className="text-center py-4 text-gray-600">
                <p>Welcome back! Redirecting...</p>
              </div>
            </SignedIn>
          </div>
        </div>

        {/* XQUISITO Branding */}
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-700 tracking-wider">
            XQUISITO
          </h2>
          <p className="text-sm text-gray-500 mt-2 uppercase tracking-wide">
            DONDE LA TECNOLOGÍA SE ENCUENTRA CON EL BUEN COMER
          </p>
        </div>
      </div>
    </div>
  );
}