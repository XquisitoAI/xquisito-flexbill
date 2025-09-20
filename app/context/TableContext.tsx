"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import { MenuItemData } from "../interfaces/menuItemData";
import { tableApi, UserOrder } from "../services/tableApi";

// Interfaz para un item del carrito
export interface CartItem extends MenuItemData {
  quantity: number;
}

// Usar la interfaz UserOrder de la API

// Interfaz para trackear pagos realizados
export interface TablePayment {
  id: string;
  userName: string;
  amount: number;
  timestamp: string;
  paymentType: string;
}

// Estado de la mesa
interface TableState {
  tableNumber: string;
  orders: UserOrder[];
  currentUserName: string;
  currentUserItems: CartItem[];
  currentUserTotalItems: number;
  currentUserTotalPrice: number;
  isLoading: boolean;
  error: string | null;
  skipAutoLoad: boolean; // Flag para saltar carga automática de órdenes
  tablePayments: TablePayment[]; // Pagos realizados en la mesa
}

// Acciones del contexto de mesa
type TableAction =
  | { type: "SET_TABLE_NUMBER"; payload: string }
  | { type: "ADD_ITEM_TO_CURRENT_USER"; payload: MenuItemData }
  | { type: "REMOVE_ITEM_FROM_CURRENT_USER"; payload: number }
  | {
      type: "UPDATE_QUANTITY_CURRENT_USER";
      payload: { id: number; quantity: number };
    }
  | { type: "SET_CURRENT_USER_NAME"; payload: string }
  | { type: "SUBMIT_CURRENT_USER_ORDER" }
  | { type: "CLEAR_CURRENT_USER_CART" }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_ORDERS"; payload: UserOrder[] }
  | { type: "CLEAR_ORDERS" }
  | { type: "SET_SKIP_AUTO_LOAD"; payload: boolean }
  | { type: "ADD_TABLE_PAYMENT"; payload: TablePayment }
  | { type: "SET_TABLE_PAYMENTS"; payload: TablePayment[] };

// Estado inicial
const initialState: TableState = {
  tableNumber: "",
  orders: [],
  currentUserName: "",
  currentUserItems: [],
  currentUserTotalItems: 0,
  currentUserTotalPrice: 0,
  isLoading: false,
  error: null,
  skipAutoLoad: false,
  tablePayments: [],
};

// Función para calcular totales
const calculateTotals = (items: CartItem[]) => {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  return { totalItems, totalPrice };
};

// Reducer del contexto de mesa
function tableReducer(state: TableState, action: TableAction): TableState {
  switch (action.type) {
    case "SET_TABLE_NUMBER":
      return {
        ...state,
        tableNumber: action.payload,
      };

    case "ADD_ITEM_TO_CURRENT_USER": {
      const existingItem = state.currentUserItems.find(
        (item) => item.id === action.payload.id
      );

      let newItems: CartItem[];
      if (existingItem) {
        newItems = state.currentUserItems.map((item) =>
          item.id === action.payload.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        newItems = [
          ...state.currentUserItems,
          { ...action.payload, quantity: 1 },
        ];
      }

      const { totalItems, totalPrice } = calculateTotals(newItems);

      return {
        ...state,
        currentUserItems: newItems,
        currentUserTotalItems: totalItems,
        currentUserTotalPrice: totalPrice,
      };
    }

    case "REMOVE_ITEM_FROM_CURRENT_USER": {
      const newItems = state.currentUserItems.filter(
        (item) => item.id !== action.payload
      );
      const { totalItems, totalPrice } = calculateTotals(newItems);

      return {
        ...state,
        currentUserItems: newItems,
        currentUserTotalItems: totalItems,
        currentUserTotalPrice: totalPrice,
      };
    }

    case "UPDATE_QUANTITY_CURRENT_USER": {
      const newItems = state.currentUserItems
        .map((item) =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        )
        .filter((item) => item.quantity > 0);

      const { totalItems, totalPrice } = calculateTotals(newItems);

      return {
        ...state,
        currentUserItems: newItems,
        currentUserTotalItems: totalItems,
        currentUserTotalPrice: totalPrice,
      };
    }

    case "SET_CURRENT_USER_NAME":
      return {
        ...state,
        currentUserName: action.payload,
      };

    case "SUBMIT_CURRENT_USER_ORDER": {
      if (state.currentUserItems.length === 0 || !state.currentUserName) {
        return state;
      }

      // La creación de la orden se maneja en el provider con la API
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    }

    case "CLEAR_CURRENT_USER_CART":
      return {
        ...state,
        currentUserItems: [],
        currentUserTotalItems: 0,
        currentUserTotalPrice: 0,
      };

    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };

    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case "SET_ORDERS":
      console.log(
        "📋 SET_ORDERS action dispatched with",
        action.payload.length,
        "orders"
      );
      return {
        ...state,
        orders: action.payload,
        isLoading: false,
        error: null,
      };

    case "CLEAR_ORDERS":
      console.log(
        "🧹 CLEAR_ORDERS action dispatched - clearing",
        state.orders.length,
        "orders"
      );
      return {
        ...state,
        orders: [],
        isLoading: false,
        error: null,
      };

    case "SET_SKIP_AUTO_LOAD":
      console.log("🔧 SET_SKIP_AUTO_LOAD action dispatched:", action.payload);
      return {
        ...state,
        skipAutoLoad: action.payload,
      };

    case "ADD_TABLE_PAYMENT":
      console.log("💰 ADD_TABLE_PAYMENT action dispatched:", action.payload);
      return {
        ...state,
        tablePayments: [...state.tablePayments, action.payload],
      };

    case "SET_TABLE_PAYMENTS":
      console.log(
        "💰 SET_TABLE_PAYMENTS action dispatched with",
        action.payload.length,
        "payments"
      );
      return {
        ...state,
        tablePayments: action.payload,
      };

    default:
      return state;
  }
}

// Contexto de la mesa
const TableContext = createContext<{
  state: TableState;
  dispatch: React.Dispatch<TableAction>;
  submitOrder: (userName?: string) => Promise<void>;
  refreshOrders: () => Promise<void>;
  loadTableOrders: () => Promise<void>;
  addPayment: (payment: Omit<TablePayment, "id" | "timestamp">) => void;
  loadTablePayments: () => void;
  getTotalPaidAmount: () => number;
  getRemainingAmount: () => number;
} | null>(null);

// Provider del contexto de mesa
export function TableProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(tableReducer, initialState);

  // Cargar órdenes y pagos cuando se establece el número de mesa (si no se está saltando la carga automática)
  useEffect(() => {
    if (state.tableNumber && !state.skipAutoLoad) {
      loadTableOrders();
      loadTablePayments();
    }
  }, [state.tableNumber, state.skipAutoLoad]);

  const loadTableOrders = async () => {
    if (!state.tableNumber) return;

    console.log(
      "🔄 loadTableOrders called for table:",
      state.tableNumber,
      "skipAutoLoad:",
      state.skipAutoLoad
    );

    dispatch({ type: "SET_LOADING", payload: true });

    try {
      const response = await tableApi.getTableOrders(
        parseInt(state.tableNumber)
      );

      if (response.success && response.data) {
        console.log("📋 Orders loaded from API:", response.data.length);
        dispatch({ type: "SET_ORDERS", payload: response.data });
      } else {
        dispatch({
          type: "SET_ERROR",
          payload: response.error || "Failed to load orders",
        });
      }
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: "Network error occurred" });
    }
  };

  const submitOrder = async (userName?: string) => {
    const finalUserName = userName || state.currentUserName;

    if (
      !state.tableNumber ||
      !finalUserName ||
      state.currentUserItems.length === 0
    ) {
      return;
    }

    dispatch({ type: "SET_LOADING", payload: true });

    try {
      const orderData = {
        user_name: finalUserName,
        items: state.currentUserItems.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          description: item.description,
          images: item.images,
        })),
        total_items: state.currentUserTotalItems,
        total_price: state.currentUserTotalPrice,
      };

      const response = await tableApi.createUserOrder(
        parseInt(state.tableNumber),
        orderData
      );

      if (response.success) {
        // Actualizar el nombre del usuario en el estado si se pasó como parámetro
        if (userName) {
          dispatch({ type: "SET_CURRENT_USER_NAME", payload: finalUserName });
        }
        // Limpiar carrito actual
        dispatch({ type: "CLEAR_CURRENT_USER_CART" });
        // Recargar órdenes
        await loadTableOrders();
      } else {
        dispatch({
          type: "SET_ERROR",
          payload: response.error || "Failed to create order",
        });
      }
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: "Network error occurred" });
    }
  };

  const refreshOrders = async () => {
    await loadTableOrders();
  };

  // Funciones para manejo de pagos
  const loadTablePayments = () => {
    if (!state.tableNumber) return;

    const storageKey = `table_payments_${state.tableNumber}`;
    const storedPayments = sessionStorage.getItem(storageKey);

    if (storedPayments) {
      try {
        const payments: TablePayment[] = JSON.parse(storedPayments);
        dispatch({ type: "SET_TABLE_PAYMENTS", payload: payments });
      } catch (error) {
        console.error("Error loading table payments:", error);
      }
    }
  };

  const addPayment = (payment: Omit<TablePayment, "id" | "timestamp">) => {
    if (!state.tableNumber) return;

    const newPayment: TablePayment = {
      ...payment,
      id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    dispatch({ type: "ADD_TABLE_PAYMENT", payload: newPayment });

    // Guardar en sessionStorage
    const storageKey = `table_payments_${state.tableNumber}`;
    const updatedPayments = [...state.tablePayments, newPayment];
    sessionStorage.setItem(storageKey, JSON.stringify(updatedPayments));
  };

  const getTotalPaidAmount = (): number => {
    return state.tablePayments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
  };

  const getRemainingAmount = (): number => {
    const tableTotalPrice = state.orders.reduce(
      (sum, order) => sum + parseFloat(order.total_price.toString()),
      0
    );
    const totalPaid = getTotalPaidAmount();
    return Math.max(0, tableTotalPrice - totalPaid);
  };

  return (
    <TableContext.Provider
      value={{
        state,
        dispatch,
        submitOrder,
        refreshOrders,
        loadTableOrders,
        addPayment,
        loadTablePayments,
        getTotalPaidAmount,
        getRemainingAmount,
      }}
    >
      {children}
    </TableContext.Provider>
  );
}

// Hook personalizado para usar el contexto de mesa
export function useTable() {
  const context = useContext(TableContext);
  if (!context) {
    throw new Error("useTable must be used within a TableProvider");
  }
  return context;
}
