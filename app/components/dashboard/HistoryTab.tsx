"use client";

import { JSX, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Loader2,
  ChevronRight,
  X,
  Calendar,
  CreditCard,
  Utensils,
} from "lucide-react";
import {
  Amex,
  Discover,
  Mastercard,
  Visa,
} from "react-payment-logos/dist/logo";

function getCardIcon(cardType: string): JSX.Element {
  const type = cardType.toLowerCase();

  switch (type) {
    case "visa":
      return <Visa style={{ width: "45px", height: "28px" }} />;
    case "mastercard":
      return <Mastercard style={{ width: "45px", height: "28px" }} />;
    case "amex":
      return <Amex style={{ width: "45px", height: "28px" }} />;
    case "discover":
      return <Discover style={{ width: "45px", height: "28px" }} />;
    default:
      return (
        <div
          style={{
            width: "45px",
            height: "28px",
            background: "linear-gradient(to right, #3b82f6, #a855f7)",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "10px",
            fontWeight: "bold",
          }}
        >
          💳
        </div>
      );
  }
}

interface OrderHistoryItem {
  dishOrderId: number;
  item: string;
  quantity: number;
  price: number;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  images: string[];
  customFields: any;
  extraPrice: number;
  createdAt: string;
  tableNumber: number;
  tableOrderId: number;
  tableOrderStatus: string;
  tableOrderDate: string;
  restaurantId: number | null;
  restaurantName: string;
  restaurantLogo: string | null;
  // Payment method info
  paymentMethodId?: number | null;
  paymentCardLastFour?: string | null;
  paymentCardType?: string | null;
}

export default function HistoryTab() {
  const { user } = useUser();
  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any>(null);

  // Bloquear scroll cuando el modal está abierto
  useEffect(() => {
    if (selectedOrderDetails) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedOrderDetails]);

  useEffect(() => {
    const fetchOrderHistory = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/users/${user.id}/order-history`
        );

        if (!response.ok) {
          throw new Error("Error al cargar el historial");
        }

        const data = await response.json();
        setOrders(data.data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderHistory();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <p className="text-gray-500">No tienes pedidos aún</p>
        </div>
      </div>
    );
  }

  // Datos de orden por tableOrderId
  const groupedOrders = Object.values(
    orders.reduce(
      (acc, order) => {
        const key = order.tableOrderId;
        if (!acc[key]) {
          acc[key] = {
            tableOrderId: order.tableOrderId,
            tableNumber: order.tableNumber,
            tableOrderDate: order.tableOrderDate,
            tableOrderStatus: order.tableOrderStatus,
            restaurantId: order.restaurantId,
            restaurantName: order.restaurantName,
            restaurantLogo: order.restaurantLogo,
            orders: [],
          };
        }
        acc[key].orders.push(order);
        return acc;
      },
      {} as Record<number, any>
    )
  ).sort(
    (a, b) =>
      new Date(b.tableOrderDate).getTime() -
      new Date(a.tableOrderDate).getTime()
  );

  return (
    <>
      <h1 className="text-gray-700 text-xl mb-3">Ordenes previas</h1>
      <div className="space-y-3">
        {groupedOrders.map((group: any) => {
          const totalAmount = group.orders.reduce(
            (sum: number, order: OrderHistoryItem) => sum + order.totalPrice,
            0
          );

          const totalQuantity = group.orders.reduce(
            (sum: number, order: OrderHistoryItem) => sum + order.quantity,
            0
          );

          return (
            <div
              key={group.tableOrderId}
              onClick={() => {
                setSelectedOrderId(group.tableOrderId);
                setSelectedOrderDetails(group);
              }}
              className="border border-gray-200 rounded-lg p-4 cursor-pointer"
            >
              {/* Header */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  {/* Logo */}
                  {group.restaurantLogo ? (
                    <img
                      src={group.restaurantLogo}
                      alt={group.restaurantName}
                      className="size-16 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="size-16 bg-teal-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">🍽️</span>
                    </div>
                  )}

                  {/* Order Info */}
                  <div className="flex-1">
                    <h3 className="text-black mb-1">{group.restaurantName}</h3>
                    <p className="text-sm text-gray-600 mb-1">
                      {totalQuantity}{" "}
                      {totalQuantity === 1 ? "articulo" : "articulos"} - $
                      {totalAmount.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(group.tableOrderDate).toLocaleDateString(
                        "es-MX",
                        {
                          day: "numeric",
                          month: "numeric",
                          year: "numeric",
                        }
                      )}{" "}
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        group.tableOrderStatus === "paid"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {group.tableOrderStatus === "paid"
                        ? "Pagado"
                        : "Pendiente"}
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {selectedOrderDetails && (
        <div
          className="fixed inset-0 bg-black/25 backdrop-blur-xs bg-opacity-50 z-999 flex items-center justify-center"
          onClick={() => {
            setSelectedOrderId(null);
            setSelectedOrderDetails(null);
          }}
        >
          <div
            className="bg-white w-full mx-4 rounded-4xl overflow-y-auto z-999"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex justify-end">
              <button
                onClick={() => {
                  setSelectedOrderId(null);
                  setSelectedOrderDetails(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full cursor-pointer transition-colors justify-end flex items-end mt-3 mr-3"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>
            {/* Header */}
            <div className="px-6 flex items-center justify-center mb-4">
              <div className="flex flex-col justify-center items-center gap-3">
                {selectedOrderDetails.restaurantLogo ? (
                  <img
                    src={selectedOrderDetails.restaurantLogo}
                    alt={selectedOrderDetails.restaurantName}
                    className="size-20 object-cover rounded-lg"
                  />
                ) : (
                  <div className="size-20 bg-teal-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🍽️</span>
                  </div>
                )}
                <div className="flex flex-col items-center justify-center">
                  <h2 className="text-xl text-black">
                    {selectedOrderDetails.restaurantName}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Mesa {selectedOrderDetails.tableNumber}
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 space-y-4">
              {/* Order Info */}
              <div className="border-t border-[#8e8e8e] pt-4">
                <h3 className="font-medium text-xl text-black mb-3">
                  Tu orden
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="w-4 h-4 text-gray-700" />
                    <span className="text-sm">
                      {new Date(
                        selectedOrderDetails.tableOrderDate
                      ).toLocaleDateString("es-MX", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Utensils className="w-4 h-4 text-gray-700" />
                    <span className="text-sm">
                      Mesa {selectedOrderDetails.tableNumber}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <CreditCard className="w-4 h-4 text-gray-700" />
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        selectedOrderDetails.tableOrderStatus === "paid"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {selectedOrderDetails.tableOrderStatus === "paid"
                        ? "Pagado"
                        : "Pendiente"}
                    </span>
                  </div>
                  {selectedOrderDetails.orders[0]?.paymentCardType && (
                    <div className="flex items-center gap-2 text-gray-700">
                      {getCardIcon(
                        selectedOrderDetails.orders[0].paymentCardType
                      )}
                      <span className="text-sm">
                        •••• •••• ••••{" "}
                        {selectedOrderDetails.orders[0].paymentCardLastFour}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Lista de platillos */}
              <div>
                <h3 className="font-semibold text-black mb-3 mt-6 pt-4 border-t border-[#8e8e8e]">
                  Platillos Ordenados:
                </h3>
                <div className="space-y-3 divide-y divide-[#8e8e8e]/50">
                  {selectedOrderDetails.orders.map((dish: OrderHistoryItem) => (
                    <div
                      key={dish.dishOrderId}
                      className="flex items-start gap-3 pt-3 first:pt-0 pb-3"
                    >
                      {/* Dish Info */}
                      <div className="flex-1">
                        <h4 className="font-medium text-black capitalize">
                          {dish.item}
                        </h4>
                        <p className="text-xs text-gray-600">
                          Cantidad: {dish.quantity}
                        </p>
                        <p className="text-xs text-gray-600">
                          ${dish.price.toFixed(2)} MXN
                        </p>
                        {dish.extraPrice > 0 && (
                          <p className="text-xs text-gray-600">
                            + Extras: ${dish.extraPrice.toFixed(2)} MXN
                          </p>
                        )}
                      </div>

                      {/* Total Price */}
                      <div className="text-right">
                        <p className="font-semibold text-black">
                          ${dish.totalPrice.toFixed(2)} MXN
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Summary */}
              <div className="flex justify-between items-center border-t border-[#8e8e8e] pt-4 mb-6">
                <span className="text-xl font-medium text-black">Total</span>
                <span className="text-xl font-medium text-black">
                  $
                  {selectedOrderDetails.orders
                    .reduce(
                      (sum: number, order: OrderHistoryItem) =>
                        sum + order.totalPrice,
                      0
                    )
                    .toFixed(2)}{" "}
                  MXN
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
