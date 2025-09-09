'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTable } from "../context/TableContext";
import { useTableNavigation } from "../hooks/useTableNavigation";
import { useGuest, useIsGuest } from "../context/GuestContext";
import MenuHeader from "../components/MenuHeader";
import { getRestaurantData } from "../utils/restaurantData";
import { apiService } from "../utils/api";

export default function AddTipPage() {
  const { state } = useTable();
  const { goBack, navigateWithTable } = useTableNavigation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const restaurantData = getRestaurantData();
  const isGuest = useIsGuest();
  const { guestId, tableNumber } = useGuest();
  
  // Obtener datos de la URL
  const baseAmount = parseFloat(searchParams.get('amount') || '0');
  const selectedUsers = searchParams.get('users')?.split(',') || [];
  
  console.log('Raw users param:', searchParams.get('users'));
  
  // Estados para manejar la propina
  const [selectedTipPercentage, setSelectedTipPercentage] = useState<number | null>(null);
  const [customTipAmount, setCustomTipAmount] = useState<string>('');
  const [showCustomTip, setShowCustomTip] = useState(false);

  // Porcentajes de propina predefinidos
  const tipPercentages = [
    { label: 'No Tip', value: 0 },
    { label: '5%', value: 5 },
    { label: '18%', value: 18 },
    { label: '20%', value: 20 }
  ];

  const handleBack = () => {
    router.back();
  };

  const handleTipSelection = (percentage: number) => {
    setSelectedTipPercentage(percentage);
    setShowCustomTip(false);
    setCustomTipAmount('');
  };

  const handleCustomTip = () => {
    setShowCustomTip(true);
    setSelectedTipPercentage(null);
  };

  const calculateTipAmount = () => {
    if (showCustomTip && customTipAmount) {
      return parseFloat(customTipAmount) || 0;
    }
    if (selectedTipPercentage !== null) {
      return (baseAmount * selectedTipPercentage) / 100;
    }
    return 0;
  };

  const getTotalAmount = () => {
    return baseAmount + calculateTipAmount();
  };

  const handlePay = async () => {
    debugger
    const tipAmount = calculateTipAmount();
    const totalAmount = getTotalAmount();
    
    console.log('Payment Details:', {
      baseAmount,
      tipAmount,
      totalAmount,
      selectedUsers,
      tipType: showCustomTip ? 'custom' : `${selectedTipPercentage}%`
    });
    
    try {
      // Set guest and table info for API service
      if (isGuest && guestId) {
        apiService.setGuestInfo(guestId, state.tableNumber || tableNumber);
      }

      // Check if user has payment methods
      const paymentMethodsResult = await apiService.getPaymentMethods();
      
      if (!paymentMethodsResult.success) {
        throw new Error(paymentMethodsResult.error?.message || 'Failed to fetch payment methods');
      }

      if (!paymentMethodsResult.data?.paymentMethods || paymentMethodsResult.data.paymentMethods.length === 0) {
        // No payment methods, redirect to add card page
        navigateWithTable(`/add-card?amount=${totalAmount}&users=${selectedUsers.join(',')}&tip=${tipAmount}`);
        return;
      }

      // Use the first/default payment method
      const paymentMethods = paymentMethodsResult.data.paymentMethods;
      const defaultPaymentMethod = paymentMethods.find(pm => pm.isDefault) || paymentMethods[0];

      // Process payment
      const paymentResult = await apiService.processPayment({
        paymentMethodId: defaultPaymentMethod.id,
        amount: totalAmount,
        currency: 'USD',
        description: `Xquisito Restaurant Payment - Table ${state.tableNumber || 'N/A'} - Users: ${selectedUsers.join(', ')} - Tip: $${tipAmount.toFixed(2)}`,
        orderId: `order-${Date.now()}`,
        tableNumber: state.tableNumber,
        restaurantId: 'xquisito-main'
      });
      console.log('paymentResult', paymentResult);
      

      if (!paymentResult.success) {
        throw new Error(paymentResult.error?.message || 'Payment processing failed');
      }
      
      // eCartPay returns a payment link - redirect user to complete payment
      const order = paymentResult.data?.order || paymentResult.data?.payment;
      
      if (order?.payLink) {
        console.log('🔗 Redirecting to eCartPay payment link:', order.payLink);
        // Store order details for later reference
        if (typeof window !== 'undefined') {
          localStorage.setItem('xquisito-pending-payment', JSON.stringify({
            orderId: order.id,
            amount: totalAmount,
            users: selectedUsers,
            tableNumber: state.tableNumber
          }));
        }
        // Redirect to eCartPay payment page
        window.location.href = order.payLink;
      } else {
        throw new Error('Payment link not received from eCartPay');
      }

    } catch (error:any) {
      console.error('Payment error:', error);
      alert(`Payment failed: ${error.message}`);
    }
  };

  const isPayButtonEnabled = () => {
    if (showCustomTip) {
      return customTipAmount.trim() !== '' && !isNaN(parseFloat(customTipAmount));
    }
    return selectedTipPercentage !== null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MenuHeader restaurant={restaurantData} tableNumber={state.tableNumber} />
      
      {/* Back Button */}
      <div className="max-w-md mx-auto px-4 py-4">
        <button 
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Guest User Indicator */}
        {isGuest && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div>
                <p className="text-green-800 font-medium text-sm">Adding Tip</p>
                <p className="text-green-600 text-xs">
                  {tableNumber ? `Table ${tableNumber}` : 'Guest session'} • Show appreciation for great service
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Selected Users Info */}
        {selectedUsers.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 font-medium text-sm mb-1">Paying for:</p>
            <p className="text-blue-600 text-sm">{selectedUsers.join(', ')}</p>
            <p className="text-blue-800 font-medium text-sm mt-2">
              Subtotal: ${baseAmount.toFixed(2)}
            </p>
          </div>
        )}

        {/* Tip Selection Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 text-center mb-6">
            Add a tip for our staff
          </h2>
          
          {/* Tip Percentage Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {tipPercentages.map((tip) => (
              <button
                key={tip.value}
                onClick={() => handleTipSelection(tip.value)}
                className={`py-3 px-4 rounded-lg font-medium transition-colors ${
                  selectedTipPercentage === tip.value
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tip.label}
              </button>
            ))}
          </div>

          {/* Custom Amount Button */}
          <button
            onClick={handleCustomTip}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              showCustomTip
                ? 'bg-teal-700 text-white'
                : 'bg-teal-700 text-white hover:bg-teal-800'
            }`}
          >
            + Other amount
          </button>

          {/* Custom Tip Input */}
          {showCustomTip && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom tip amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={customTipAmount}
                  onChange={(e) => setCustomTipAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full pl-8 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Tip Amount Display */}
          {(selectedTipPercentage !== null || (showCustomTip && customTipAmount)) && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-center text-gray-600 text-sm">
                Adding tip: <span className="font-semibold">${calculateTipAmount().toFixed(2)}</span>
              </p>
            </div>
          )}
        </div>

        {/* Total Summary */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Subtotal:</span>
            <span className="text-gray-800">${baseAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Tip:</span>
            <span className="text-gray-800">${calculateTipAmount().toFixed(2)}</span>
          </div>
          <hr className="my-2" />
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-800">Total:</span>
            <span className="text-lg font-semibold text-gray-800">${getTotalAmount().toFixed(2)}</span>
          </div>
        </div>

        {/* Pay Button */}
        <button 
          onClick={handlePay}
          disabled={!isPayButtonEnabled()}
          className={`w-full py-4 rounded-lg font-semibold text-lg transition-colors ${
            isPayButtonEnabled()
              ? 'bg-teal-700 text-white hover:bg-teal-800'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Pay: ${getTotalAmount().toFixed(2)}
        </button>

        {/* Help Text */}
        {!isPayButtonEnabled() && (
          <p className="text-center text-gray-500 text-sm mt-4">
            Please select a tip option to continue
          </p>
        )}
      </div>
    </div>
  );
}