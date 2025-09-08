'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService, PaymentMethod } from '../utils/api';
import { useGuest } from './GuestContext';

interface PaymentContextType {
  paymentMethods: PaymentMethod[];
  isLoading: boolean;
  hasPaymentMethods: boolean;
  addPaymentMethod: (paymentMethod: PaymentMethod) => void;
  refreshPaymentMethods: () => Promise<void>;
  removePaymentMethod: (paymentMethodId: string) => void;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

interface PaymentProviderProps {
  children: ReactNode;
}

export function PaymentProvider({ children }: PaymentProviderProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { isGuest, guestId } = useGuest();

  const hasPaymentMethods = paymentMethods.length > 0;

  const refreshPaymentMethods = async () => {
    if (!isGuest || !guestId) {
      setPaymentMethods([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.getPaymentMethods();
      if (response.success && response.data?.paymentMethods) {
        setPaymentMethods(response.data.paymentMethods);
      } else {
        setPaymentMethods([]);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      setPaymentMethods([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addPaymentMethod = (paymentMethod: PaymentMethod) => {
    setPaymentMethods(prev => [...prev, paymentMethod]);
  };

  const removePaymentMethod = (paymentMethodId: string) => {
    setPaymentMethods(prev => prev.filter(pm => pm.id !== paymentMethodId));
  };

  // Load payment methods when guest context changes
  useEffect(() => {
    refreshPaymentMethods();
  }, [isGuest, guestId]);

  const value: PaymentContextType = {
    paymentMethods,
    isLoading,
    hasPaymentMethods,
    addPaymentMethod,
    refreshPaymentMethods,
    removePaymentMethod,
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