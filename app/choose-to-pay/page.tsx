'use client';

import { useRouter } from 'next/navigation';
import { useTable } from "../context/TableContext";
import { useTableNavigation } from "../hooks/useTableNavigation";
import MenuHeader from "../components/MenuHeader";
import { getRestaurantData } from "../utils/restaurantData";

export default function ChooseToPayPage() {
  const { state } = useTable();
  const { goBack, navigateWithTable } = useTableNavigation();
  const restaurantData = getRestaurantData();
  const router = useRouter();

  const handleBack = () => {
    // goBack();
    router.back();
  };

  const handleSplitEqually = () => {
    // Navegar a la página de seleccionar total a pagar
    navigateWithTable('/select-total-pay');
  };

  const handleSelectItems = () => {
    // Lógica para seleccionar items específicos
    console.log('Select Items selected');
    alert('Select specific items to pay for...');
  };

  return (
    <div className="min-h-screen bg-gray-100">
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

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
          <div className="grid grid-cols-2 gap-4">
            {/* Split Equally Button */}
            <button 
              onClick={handleSplitEqually}
              className="bg-gray-800 text-white py-8 px-6 rounded-xl font-medium text-center hover:bg-gray-700 transition-colors flex flex-col items-center justify-center"
            >
              {/* <div className="mb-2">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div> */}
              <span>Split Equally</span>
            </button>

            {/* Select Items Button */}
            <button 
              onClick={handleSelectItems}
              className="bg-gray-800 text-white py-8 px-6 rounded-xl font-medium text-center hover:bg-gray-700 transition-colors flex flex-col items-center justify-center"
            >
              {/* <div className="mb-2">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div> */}
              <span>Select Items</span>
            </button>
          </div>
        </div>

        {/* Table Information */}
        {/* {state.tableNumber && (
          <div className="mt-6 text-center text-gray-600">
            <p className="text-sm">
              Table {state.tableNumber} • {state.orders.length} orders
            </p>
            <p className="text-xs mt-1">
              Total: ${state.orders.reduce((sum, order) => sum + parseFloat(order.total_price.toString()), 0).toFixed(2)}
            </p>
          </div>
        )} */}
      </div>
    </div>
  );
}