'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService, PaymentMethod } from '../utils/api';
import { useGuest } from './GuestContext';
import { useAuth } from './AuthContext';
import { authService } from '../services/auth.service';

interface PaymentContextType {
  paymentMethods: PaymentMethod[];
  isLoading: boolean;
  hasPaymentMethods: boolean;
  addPaymentMethod: (paymentMethod: PaymentMethod) => void;
  refreshPaymentMethods: () => Promise<void>;
  removePaymentMethod: (paymentMethodId: string) => void;
  setDefaultPaymentMethod: (paymentMethodId: string) => Promise<void>;
  deletePaymentMethod: (paymentMethodId: string) => Promise<void>;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

interface PaymentProviderProps {
  children: ReactNode;
}

export function PaymentProvider({ children }: PaymentProviderProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { isGuest, guestId, setAsAuthenticated } = useGuest();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const hasPaymentMethods = paymentMethods.length > 0;

  const refreshPaymentMethods = async () => {
    // Only fetch if auth is loaded (either registered user or guest)
    if (authLoading) {
      setPaymentMethods([]);
      return;
    }

    // For registered users - prioritize user over guest session
    if (isAuthenticated && user) {
      console.log('🔐 Fetching payment methods for registered user:', user.id);

      // Get current user with token from authService
      const currentUser = authService.getCurrentUser();
      const userToken = currentUser?.token;

      console.log('🔑 User token available:', !!userToken);

      // Wait for token to be available
      if (!userToken) {
        console.log('⏳ Token not yet available, skipping payment methods request');
        setPaymentMethods([]);
        return;
      }

      setIsLoading(true);
      try {
        // Ensure auth token is set in apiService
        apiService.setAuthToken(userToken);
        console.log('🔑 Auth token set in apiService before payment request');

        const response = await apiService.getPaymentMethods();
        if (response.success && response.data?.paymentMethods) {
          setPaymentMethods(response.data.paymentMethods);
          console.log('💳 Loaded payment methods for registered user:', response.data.paymentMethods.length);
        } else {
          setPaymentMethods([]);
          console.log('💳 No payment methods found for registered user');
        }
      } catch (error) {
        console.error('❌ Error fetching payment methods for registered user:', error);
        setPaymentMethods([]);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // For guests, ensure we have a guest ID
    if (isGuest && guestId) {
      console.log('👥 Fetching payment methods for guest:', guestId);
      setIsLoading(true);
      try {
        const response = await apiService.getPaymentMethods();
        if (response.success && response.data?.paymentMethods) {
          setPaymentMethods(response.data.paymentMethods);
          console.log('💳 Loaded payment methods for guest:', response.data.paymentMethods.length);
        } else {
          setPaymentMethods([]);
          console.log('💳 No payment methods found for guest');
        }
      } catch (error) {
        console.error('❌ Error fetching payment methods for guest:', error);
        setPaymentMethods([]);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // No valid authentication context
    console.log('⚠️ No valid authentication context for payment methods');
    setPaymentMethods([]);
  };

  const addPaymentMethod = (paymentMethod: PaymentMethod) => {
    setPaymentMethods(prev => [...prev, paymentMethod]);
  };

  const removePaymentMethod = (paymentMethodId: string) => {
    setPaymentMethods(prev => prev.filter(pm => pm.id !== paymentMethodId));
  };

  const setDefaultPaymentMethod = async (paymentMethodId: string) => {
    // Only registered users can set default payment methods
    if (!user) {
      console.log('⚠️ setDefaultPaymentMethod: Only registered users can set default payment methods');
      throw new Error('Only registered users can set default payment methods');
    }

    console.log('🔧 Setting default payment method for registered user:', paymentMethodId);
    try {
      // Get Clerk auth token
      const token = await getToken();
      if (token) {
        apiService.setAuthToken(token);
      }

      const response = await apiService.setDefaultPaymentMethod(paymentMethodId);
      if (response.success) {
        // Update local state to reflect the new default
        setPaymentMethods(prev =>
          prev.map(pm => ({
            ...pm,
            isDefault: pm.id === paymentMethodId
          }))
        );
        console.log('✅ Default payment method set successfully:', paymentMethodId);
      } else {
        throw new Error(response.error?.message || 'Failed to set default payment method');
      }
    } catch (error) {
      console.error('❌ Error setting default payment method:', error);
      throw error;
    }
  };

  const deletePaymentMethod = async (paymentMethodId: string) => {
    // Only registered users can delete saved payment methods
    if (!user) {
      console.log('⚠️ deletePaymentMethod: Only registered users can delete saved payment methods');
      throw new Error('Only registered users can delete saved payment methods');
    }

    console.log('🗑️ Deleting payment method for registered user:', paymentMethodId);
    try {
      // Get Clerk auth token
      const token = await getToken();
      if (token) {
        apiService.setAuthToken(token);
      }

      const response = await apiService.deletePaymentMethod(paymentMethodId);
      if (response.success) {
        removePaymentMethod(paymentMethodId);
        console.log('✅ Payment method deleted successfully:', paymentMethodId);
      } else {
        throw new Error(response.error?.message || 'Failed to delete payment method');
      }
    } catch (error) {
      console.error('❌ Error deleting payment method:', error);
      throw error;
    }
  };

  // Load payment methods when user context changes
  useEffect(() => {
    if (!authLoading) {
      // If user is authenticated, clear any guest session
      if (isAuthenticated && user && isGuest) {
        console.log('🔐 User authenticated - clearing guest session');
        setAsAuthenticated(user.id);
      }

      console.log('🔄 PaymentContext - Context changed:', {
        isLoaded: !authLoading,
        hasUser: !!user,
        userId: user?.id,
        isGuest,
        guestId
      });

      // Delay refreshPaymentMethods to ensure token is set
      setTimeout(() => {
        refreshPaymentMethods();
      }, 100); // Small delay to ensure token is configured
    }
  }, [authLoading, isAuthenticated, user?.id, isGuest, guestId, setAsAuthenticated]);

  const value: PaymentContextType = {
    paymentMethods,
    isLoading,
    hasPaymentMethods,
    addPaymentMethod,
    refreshPaymentMethods,
    removePaymentMethod,
    setDefaultPaymentMethod,
    deletePaymentMethod,
  };

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
}

// Custom hook to use payment context
export function usePayment(): PaymentContextType {
  const context = useContext(PaymentContext);
  if (context === undefined) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
}

// Helper hook to check if user has payment methods
export function useHasPaymentMethods(): boolean {
  const { hasPaymentMethods } = usePayment();
  return hasPaymentMethods;
}