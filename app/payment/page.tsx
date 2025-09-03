'use client';

import { useRouter } from 'next/navigation';
import { useTable } from "../context/TableContext";
import { useTableNavigation } from "../hooks/useTableNavigation";
import MenuHeader from "../components/MenuHeader";
import { getRestaurantData } from "../utils/restaurantData";
import { useState } from 'react';

export default function PaymentPage() {
  const { state } = useTable();
  const { goBack, navigateWithTable } = useTableNavigation();
  const router = useRouter();
  const restaurantData = getRestaurantData();
  const [name, setName] = useState(state.currentUserName);
  const [email, setEmail] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('mastercard');

  debugger

  // Calcular total de la mesa
  const tableTotalPrice = state.orders.reduce((sum, order) => sum + parseFloat(order.total_price.toString()), 0);

  const handleBack = () => {
    // goBack();
    router.back();
  };

  const handlePayment = () => {
    if (!name.trim()) {
      alert('Please enter your name');
      return;
    }
    
    console.log('Processing payment...', {
      name,
      email,
      paymentMethod: selectedPayment,
      total: tableTotalPrice,
      tableNumber: state.tableNumber,
      orders: state.orders
    });
    
    alert(`Payment of $${tableTotalPrice.toFixed(2)} processed successfully! Thank you ${name}!`);
  };

  const handleChangeMethod = () => {
    // Toggle between payment methods for demo
    setSelectedPayment(selectedPayment === 'mastercard' ? 'visa' : 'mastercard');
  };

  const handleSplitBill = () => {
    // Navegar a la página de choose to pay
    navigateWithTable('/choose-to-pay');
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
        {/* Your details */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Your details</h2>
          <p className="text-sm text-gray-600 mb-6">Need a receipt? Enter your email</p>
          
          <div className="space-y-4">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email (optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mail@gmail.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-sm font-medium text-gray-800 mb-4">Select your payment method</h3>
          
          {/* Selected Payment Method */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-5 bg-gradient-to-r from-red-500 to-yellow-500 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">MC</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {selectedPayment === 'mastercard' ? 'Mastercard' : 'Visa'}
                </p>
                <p className="text-xs text-gray-500">
                  ****{selectedPayment === 'mastercard' ? '3484' : '1234'}
                </p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>

          {/* Change Method Button */}
          <button 
            onClick={handleChangeMethod}
            className="w-full bg-gray-800 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors mb-3"
          >
            Change method
          </button>

          {/* Split Bill Option */}
          <button 
            onClick={handleSplitBill}
            className="w-full bg-gray-800 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors mb-3"
          >
            Split Bill
          </button>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-gray-800">Total</span>
            <span className="text-lg font-bold text-gray-800">
              ${tableTotalPrice.toFixed(2)}
            </span>
          </div>
          {/* {state.tableNumber && (
            <p className="text-sm text-gray-500 mt-2">
              Table {state.tableNumber} • {state.orders.length} orders
            </p>
          )} */}
        </div>

        {/* Pay Button */}
        <button 
          onClick={handlePayment}
          className="w-full bg-teal-700 text-white py-4 rounded-lg font-semibold text-lg hover:bg-teal-800 transition-colors"
        >
          Pay: ${tableTotalPrice.toFixed(2)}
        </button>
      </div>
    </div>
  );
}