// API configuration and helper functions for Xquisito frontend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export interface PaymentMethod {
  id: string;
  lastFourDigits: string;
  cardType: string;
  expiryMonth: number;
  expiryYear: number;
  cardholderName: string;
  isDefault: boolean;
  createdAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    type: string;
    message: string;
    details?: any;
  };
}

export interface AddPaymentMethodRequest {
  fullName: string;
  email: string;
  cardNumber: string;
  expDate: string;
  cvv: string;
  country: string;
  postalCode: string;
}

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async makeRequest<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      
      const defaultOptions: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      };

      // Add guest identification headers
      // In a real app, you might get these from context or localStorage
      const guestId = this.getGuestId();
      if (guestId) {
        defaultOptions.headers['x-guest-id'] = guestId;
      }

      // Add table number if available
      const tableNumber = this.getTableNumber();
      if (tableNumber) {
        defaultOptions.headers['x-table-number'] = tableNumber;
      }

      // TODO: Add authentication token when auth is implemented
      // if (authToken) {
      //   defaultOptions.headers['Authorization'] = `Bearer ${authToken}`;
      // }

      const response = await fetch(url, {
        ...defaultOptions,
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            type: 'http_error',
            message: data.error?.message || `HTTP Error: ${response.status}`,
            details: data
          }
        };
      }

      return {
        success: true,
        data: data
      };

    } catch (error) {
      console.error('API Request failed:', error);
      
      return {
        success: false,
        error: {
          type: 'network_error',
          message: error instanceof Error ? error.message : 'Network error occurred',
          details: error
        }
      };
    }
  }

  // Payment Methods API
  async addPaymentMethod(paymentData: AddPaymentMethodRequest): Promise<ApiResponse<{paymentMethod: PaymentMethod}>> {
    return this.makeRequest('/payment-methods', {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
  }

  async getPaymentMethods(): Promise<ApiResponse<{paymentMethods: PaymentMethod[]}>> {
    return this.makeRequest('/payment-methods');
  }

  async deletePaymentMethod(paymentMethodId: string): Promise<ApiResponse<{message: string}>> {
    return this.makeRequest(`/payment-methods/${paymentMethodId}`, {
      method: 'DELETE'
    });
  }

  async setDefaultPaymentMethod(paymentMethodId: string): Promise<ApiResponse<{message: string}>> {
    return this.makeRequest(`/payment-methods/${paymentMethodId}/default`, {
      method: 'PUT'
    });
  }

  // Payment Processing API
  async processPayment(paymentData: {
    paymentMethodId: string;
    amount: number;
    currency?: string;
    description?: string;
    orderId?: string;
    tableNumber?: string;
    restaurantId?: string;
  }): Promise<ApiResponse<any>> {
    console.log('🔄 Processing payment with apiService:', {
      url: `${this.baseURL}/payments`,
      paymentData: { 
        ...paymentData, 
        paymentMethodId: paymentData.paymentMethodId?.substring(0, 10) + '...' 
      }
    });
    
    return this.makeRequest('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
  }

  async getPaymentHistory(): Promise<ApiResponse<any>> {
    return this.makeRequest('/payments/history');
  }

  // Helper methods for guest identification
  private getGuestId(): string | null {
    // Try to get existing guest ID from localStorage first
    if (typeof window !== 'undefined') {
      let guestId = localStorage.getItem('xquisito-guest-id');
      
      if (!guestId) {
        // Generate new guest ID
        guestId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('xquisito-guest-id', guestId);
      }
      
      return guestId;
    }
    return null;
  }

  private getTableNumber(): string | null {
    // Get table number from localStorage or context
    if (typeof window !== 'undefined') {
      return localStorage.getItem('xquisito-table-number');
    }
    return null;
  }

  // Method to explicitly set guest and table info (for better context integration)
  setGuestInfo(guestId?: string, tableNumber?: string): void {
    if (typeof window !== 'undefined') {
      if (guestId) {
        localStorage.setItem('xquisito-guest-id', guestId);
      }
      if (tableNumber) {
        localStorage.setItem('xquisito-table-number', tableNumber);
      }
    }
  }

  // Method to set table number (call this when user scans QR or selects table)
  setTableNumber(tableNumber: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('xquisito-table-number', tableNumber);
    }
  }

  // Method to clear guest session
  clearGuestSession(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('xquisito-guest-id');
      localStorage.removeItem('xquisito-table-number');
    }
  }
}

export const apiService = new ApiService();

// Utility functions for payment data validation
export const validateCardNumber = (cardNumber: string): boolean => {
  const cleaned = cardNumber.replace(/\s/g, '');
  
  // Basic Luhn algorithm validation
  let sum = 0;
  let shouldDouble = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i]);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0 && cleaned.length >= 13 && cleaned.length <= 19;
};

export const getCardType = (cardNumber: string): string => {
  const cleaned = cardNumber.replace(/\s/g, '');
  
  const patterns = {
    visa: /^4[0-9]{12}(?:[0-9]{3})?$/,
    mastercard: /^5[1-5][0-9]{14}$/,
    amex: /^3[47][0-9]{13}$/,
    discover: /^6(?:011|5[0-9]{2})[0-9]{12}$/
  };

  for (const [type, pattern] of Object.entries(patterns)) {
    if (pattern.test(cleaned)) {
      return type;
    }
  }

  return 'unknown';
};

export const formatCardNumber = (cardNumber: string): string => {
  const cleaned = cardNumber.replace(/\s/g, '');
  const groups = cleaned.match(/.{1,4}/g) || [];
  return groups.join(' ').substr(0, 19); // Max 16 digits + 3 spaces
};

export const formatExpiryDate = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length >= 2) {
    return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
  }
  return cleaned;
};

export default apiService;