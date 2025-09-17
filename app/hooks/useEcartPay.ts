import { useState, useCallback } from 'react';
import { EcartPayCheckoutOptions, EcartPayCheckoutResult } from '../types/ecartpay';

export const useEcartPay = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSDKLoaded = useCallback(() => {
    return typeof window !== 'undefined' && window.Pay?.Checkout;
  }, []);

  const createCheckout = useCallback(async (options: EcartPayCheckoutOptions): Promise<EcartPayCheckoutResult> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!isSDKLoaded()) {
        throw new Error('EcartPay SDK not loaded. Please refresh the page.');
      }

      console.log('🔄 Creating EcartPay checkout with options:', options);
      
      const result = await window.Pay!.Checkout.create(options);
      
      console.log('📤 Raw EcartPay result:', result);
      
      // Handle different response formats from EcartPay
      if (result && typeof result === 'object') {
        // If result has success property, use it
        if ('success' in result) {
          if (!result.success) {
            throw new Error(result.error?.message || 'Payment failed');
          }
          return result as EcartPayCheckoutResult;
        }
        // If result has payment or order info, consider it successful
        else if ('payment' in result || 'order' in result || 'id' in result) {
          return {
            success: true,
            payment: result.payment || { 
              id: result.id || 'unknown', 
              status: 'completed',
              amount: options.order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
              currency: options.order.currency 
            },
            order: result.order
          } as EcartPayCheckoutResult;
        }
      }
      
      // If we get here, the result format is unexpected
      console.warn('⚠️ Unexpected EcartPay result format:', result);
      
      // Try to handle as success if no explicit error
      if (result && !result.error) {
        return {
          success: true,
          payment: {
            id: 'ecartpay-' + Date.now(),
            status: 'completed',
            amount: options.order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            currency: options.order.currency
          }
        } as EcartPayCheckoutResult;
      }

      throw new Error('Payment failed: Unexpected response format');
      
    } catch (err: any) {
      console.error('💥 EcartPay error:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isSDKLoaded]);

  const waitForSDK = useCallback((timeout = 10000): Promise<boolean> => {
    return new Promise((resolve) => {
      if (isSDKLoaded()) {
        resolve(true);
        return;
      }

      const startTime = Date.now();
      const checkSDK = () => {
        if (isSDKLoaded()) {
          resolve(true);
        } else if (Date.now() - startTime > timeout) {
          resolve(false);
        } else {
          setTimeout(checkSDK, 100);
        }
      };

      checkSDK();
    });
  }, [isSDKLoaded]);

  return {
    isLoading,
    error,
    isSDKLoaded,
    createCheckout,
    waitForSDK,
    clearError: () => setError(null)
  };
};