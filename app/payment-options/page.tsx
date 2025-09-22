"use client";

import { useTable } from "../context/TableContext";
import { useTableNavigation } from "../hooks/useTableNavigation";
import { getRestaurantData } from "../utils/restaurantData";
import MenuHeaderBack from "../components/MenuHeaderBack";
import {
  ChevronRight,
  DollarSign,
  ListTodo,
  ReceiptText,
  Users,
} from "lucide-react";

export default function PaymentOptionsPage() {
  const { state } = useTable();
  const { navigateWithTable } = useTableNavigation();
  const restaurantData = getRestaurantData();

  // Total de la mesa
  const tableTotalPrice = state.orders.reduce(
    (sum, order) => sum + parseFloat(order.total_price.toString()),
    0
  );

  const handlePayFullBill = () => {
    navigateWithTable("/tip-selection?type=full-bill");
  };

  const handleSelectItems = () => {
    navigateWithTable("/tip-selection?type=select-items");
  };

  const handleEqualShares = () => {
    navigateWithTable("/tip-selection?type=equal-shares");
  };

  const handleChooseAmount = () => {
    navigateWithTable("/tip-selection?type=choose-amount");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a8b9b] to-[#153f43] flex flex-col">
      <MenuHeaderBack
        restaurant={restaurantData}
        tableNumber={state.tableNumber}
      />

      <div className="px-4 w-full fixed bottom-0 left-0 right-0">
        <div className="left-4 right-4 bg-gradient-to-tl from-[#0a8b9b] to-[#1d727e] rounded-t-4xl translate-y-7 z-0">
          <div className="py-6 px-8 flex flex-col justify-center">
            <h1 className="font-bold text-white text-3xl leading-7 mt-2 mb-6">
              Elige cómo quieres pagar la cuenta
            </h1>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="bg-white rounded-t-4xl z-5 flex flex-col px-8">
            {/* Opciones de pago */}
            <div className="flex flex-col my-8">
              {/* Option 1: Pagar cuenta completa */}
              <button
                onClick={handlePayFullBill}
                className="w-full bg-white cursor-pointer border-b border-[#8e8e8e]"
              >
                <div className="flex items-center gap-4 py-4">
                  <div className="size-16 rounded-sm border border-black flex items-center justify-center">
                    <ReceiptText
                      className="text-black size-9"
                      strokeWidth={1}
                    />
                  </div>
                  <h3 className="flex-1 text-left text-black">
                    Pagar cuenta completa
                  </h3>
                  <div className="text-black">
                    <ChevronRight className="size-5" />
                  </div>
                </div>
              </button>

              {/* Option 2: Seleccionar items */}
              <button
                onClick={handleSelectItems}
                className="w-full bg-white cursor-pointer border-b border-[#8e8e8e]"
              >
                <div className="flex items-center gap-4 py-4">
                  <div className="size-16 rounded-sm border border-black flex items-center justify-center">
                    <ListTodo className="text-black size-9" strokeWidth={1} />
                  </div>
                  <h3 className="flex-1 text-left text-black">
                    Seleccionar alimentos
                  </h3>
                  <div className="text-black">
                    <ChevronRight className="size-5" />
                  </div>
                </div>
              </button>

              {/* Option 3: Dividir en partes iguales */}
              <button
                onClick={handleEqualShares}
                className="w-full bg-white cursor-pointer border-b border-[#8e8e8e]"
              >
                <div className="flex items-center gap-4 py-4">
                  <div className="size-16 rounded-sm border border-black flex items-center justify-center">
                    <Users className="text-black size-9" strokeWidth={1} />
                  </div>
                  <h3 className="flex-1 text-left text-black">
                    Dividir en partes iguales
                  </h3>
                  <div className="text-black">
                    <ChevronRight className="size-5" />
                  </div>
                </div>
              </button>

              {/* Option 4: Elegir monto a pagar */}
              <button
                onClick={handleChooseAmount}
                className="w-full bg-white cursor-pointer"
              >
                <div className="flex items-center gap-4 pt-4">
                  <div className="size-16 rounded-sm border border-black flex items-center justify-center">
                    <DollarSign className="text-black size-9" strokeWidth={1} />
                  </div>
                  <h3 className="flex-1 text-left text-black">
                    Elegir monto a pagar
                  </h3>
                  <div className="text-black">
                    <ChevronRight className="size-5" />
                  </div>
                </div>
              </button>
            </div>
          </div>
          {/* Total - Fixed to bottom */}
          <div className="bg-white px-8 pb-6">
            <div className="border-t border-[#8e8e8e] pt-6">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-black">
                  Total de la mesa {state.tableNumber}
                </span>
                <span className="text-lg font-bold text-black">
                  ${tableTotalPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
