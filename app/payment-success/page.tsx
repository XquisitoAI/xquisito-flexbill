'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTable } from "../context/TableContext";
import { useTableNavigation } from "../hooks/useTableNavigation";
import { useGuest, useIsGuest } from "../context/GuestContext";
import MenuHeader from "../components/MenuHeader";
import { getRestaurantData } from "../utils/restaurantData";
import { apiService } from "../utils/api";

export default function PaymentSuccessPage() {
  const { state } = useTable();
  const { navigateWithTable } = useTableNavigation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const restaurantData = getRestaurantData();
  const isGuest = useIsGuest();
  const { guestId, tableNumber } = useGuest();
  
  // Get payment details from URL or localStorage
  const paymentId = searchParams.get('paymentId') || searchParams.get('orderId');
  const urlAmount = parseFloat(searchParams.get('amount') || '0');
  
  // Try to get stored payment details
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedPayment = localStorage.getItem('xquisito-pending-payment');
      if (storedPayment) {
        try {
          const parsed = JSON.parse(storedPayment);
          setPaymentDetails(parsed);
          // Clean up after retrieval
          localStorage.removeItem('xquisito-pending-payment');
        } catch (e) {
          console.error('Failed to parse stored payment details:', e);
        }
      }

      // Clear all session data after successful payment
      clearGuestSession();
    }
  }, []);

  const clearGuestSession = async () => {
    if (typeof window !== 'undefined') {
      // Use apiService method for consistent cleanup
      apiService.clearGuestSession();
      
      // Also clear any additional payment-related data
      localStorage.removeItem('xquisito-pending-payment');
      
      // For guest users, also cleanup eCartPay data
      if (isGuest && guestId) {
        try {
          await fetch('/api/payments/cleanup-guest', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              guestId: guestId
            })
          });
          console.log('🧹 Guest eCartPay data cleanup requested');
        } catch (error) {
          console.error('Failed to cleanup guest eCartPay data:', error);
        }
      }
      
      console.log('🧹 Guest session cleared after successful payment');
    }
  };
  
  const amount = paymentDetails?.amount || urlAmount;

  useEffect(() => {
    // Auto-redirect after 100 seconds to home page (session is cleared)
    const timer = setTimeout(() => {
      router.push('/');
    }, 100000);

    return () => clearTimeout(timer);
  }, [router]);

  const handleBackToMenu = () => {
    // Since session is cleared, redirect to home page to select table again
    router.push('/');
  };

  const handleOrderAgain = () => {
    // Since session is cleared, redirect to home page to start new session
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      <div className="max-w-md mx-auto px-4 py-8">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Success Message */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Payment Successful!
          </h1>
          <p className="text-gray-600 mb-4">
            Your payment has been processed successfully
          </p>
          
          {/* Payment Details */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-600">Amount Paid:</span>
              <span className="text-xl font-bold text-green-600">
                ${amount.toFixed(2)}
              </span>
            </div>
            
            {paymentId && (
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-600">Payment ID:</span>
                <span className="text-gray-800 font-mono text-sm">
                  {paymentId.substring(0, 12)}...
                </span>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Table:</span>
              <span className="text-gray-800">
                {state.tableNumber || tableNumber || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Guest User Indicator */}
        {isGuest && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-green-800 font-medium text-sm">Payment Complete</p>
                <p className="text-green-600 text-xs">
                  {tableNumber ? `Table ${tableNumber}` : 'Guest session'} • Thank you for your payment!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Thank You Message */}
        <div className="text-center mb-8">
          <p className="text-gray-600 mb-4">
            Thank you for dining with us! Your payment has been confirmed and you should receive a receipt shortly.
          </p>
          <p className="text-sm text-gray-500">
            Your session has been completed. You will be redirected to the home page in a few seconds...
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button 
            onClick={handleOrderAgain}
            className="w-full py-4 bg-teal-700 text-white rounded-lg font-semibold text-lg hover:bg-teal-800 transition-colors"
          >
            View Order
          </button>
          
          <button 
            onClick={handleBackToMenu}
            className="w-full py-4 bg-gray-200 text-gray-700 rounded-lg font-semibold text-lg hover:bg-gray-300 transition-colors"
          >
            Sign Up
          </button>
        </div>

        {/* Rating Prompt */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 mb-2">
            How was your experience?
          </p>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                className="text-gray-300 hover:text-yellow-400 transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}