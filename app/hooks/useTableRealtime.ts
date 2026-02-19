"use client";

import { useEffect, useCallback, useRef } from "react";
import { useSocketContext } from "../context/SocketContext";
import type {
  DishOrder,
  TableSummary,
  ActiveUser,
} from "../services/table.service";
import type { SplitPayment } from "../services/tableApi";

// Payloads de eventos del servidor
interface DishCreatedPayload {
  dish: DishOrder;
  timestamp: string;
}

interface DishStatusPayload {
  dishId: string;
  status: DishOrder["status"];
  timestamp: string;
}

interface DishPaidPayload {
  dishId: string;
  paidBy: string;
  timestamp: string;
}

interface TableSummaryPayload {
  summary: TableSummary;
  timestamp: string;
}

interface UserJoinedPayload {
  user: ActiveUser;
  timestamp: string;
}

interface UserLeftPayload {
  userId: string;
  timestamp: string;
}

interface SplitUpdatePayload {
  splitPayments: SplitPayment[];
  timestamp: string;
}

interface UseTableRealtimeOptions {
  tableNumber: string | null;
  enabled?: boolean;
  onDishCreated?: (dish: DishOrder) => void;
  onDishStatusChanged?: (dishId: string, status: DishOrder["status"]) => void;
  onDishPaid?: (dishId: string, paidBy: string) => void;
  onSummaryUpdate?: (summary: TableSummary) => void;
  onUserJoined?: (user: ActiveUser) => void;
  onUserLeft?: (userId: string) => void;
  onSplitUpdate?: (splitPayments: SplitPayment[]) => void;
  onFullRefresh?: () => void;
}

export function useTableRealtime(options: UseTableRealtimeOptions) {
  const {
    tableNumber,
    enabled = true,
    onDishCreated,
    onDishStatusChanged,
    onDishPaid,
    onSummaryUpdate,
    onUserJoined,
    onUserLeft,
    onSplitUpdate,
    onFullRefresh,
  } = options;

  const { socket, isConnected, joinTable, leaveTable } = useSocketContext();
  const previousTableNumber = useRef<string | null>(null);

  // Unirse/abandonar sala de mesa
  useEffect(() => {
    if (!enabled || !isConnected || !tableNumber) return;

    // Si cambio el numero de mesa, abandonar la anterior
    if (
      previousTableNumber.current &&
      previousTableNumber.current !== tableNumber
    ) {
      leaveTable(previousTableNumber.current);
    }

    // Unirse a la nueva mesa
    joinTable(tableNumber);
    previousTableNumber.current = tableNumber;

    return () => {
      if (tableNumber) {
        leaveTable(tableNumber);
      }
    };
  }, [enabled, isConnected, tableNumber, joinTable, leaveTable]);

  // Escuchar eventos del socket
  useEffect(() => {
    if (!socket || !enabled) return;

    const handleDishCreated = (data: DishCreatedPayload) => {
      console.log("📦 Received dish created:", data);
      onDishCreated?.(data.dish);
    };

    const handleDishStatus = (data: DishStatusPayload) => {
      console.log("🔄 Received dish status change:", data);
      onDishStatusChanged?.(data.dishId, data.status);
    };

    const handleDishPaid = (data: DishPaidPayload) => {
      console.log("💰 Received dish paid:", data);
      onDishPaid?.(data.dishId, data.paidBy);
    };

    const handleSummaryUpdate = (data: TableSummaryPayload) => {
      console.log("📊 Received summary update:", data);
      onSummaryUpdate?.(data.summary);
    };

    const handleUserJoined = (data: UserJoinedPayload) => {
      console.log("👤 Received user joined:", data);
      onUserJoined?.(data.user);
    };

    const handleUserLeft = (data: UserLeftPayload) => {
      console.log("👋 Received user left:", data);
      onUserLeft?.(data.userId);
    };

    const handleSplitUpdate = (data: SplitUpdatePayload) => {
      console.log("💸 Received split update:", data);
      onSplitUpdate?.(data.splitPayments);
    };

    const handleFullRefresh = () => {
      console.log("🔄 Received full refresh signal");
      onFullRefresh?.();
    };

    // Registrar listeners
    socket.on("table:dish-created", handleDishCreated);
    socket.on("table:dish-status", handleDishStatus);
    socket.on("table:dish-paid", handleDishPaid);
    socket.on("table:summary-update", handleSummaryUpdate);
    socket.on("table:user-joined", handleUserJoined);
    socket.on("table:user-left", handleUserLeft);
    socket.on("table:split-update", handleSplitUpdate);
    socket.on("table:full-refresh", handleFullRefresh);

    return () => {
      // Limpiar listeners
      socket.off("table:dish-created", handleDishCreated);
      socket.off("table:dish-status", handleDishStatus);
      socket.off("table:dish-paid", handleDishPaid);
      socket.off("table:summary-update", handleSummaryUpdate);
      socket.off("table:user-joined", handleUserJoined);
      socket.off("table:user-left", handleUserLeft);
      socket.off("table:split-update", handleSplitUpdate);
      socket.off("table:full-refresh", handleFullRefresh);
    };
  }, [
    socket,
    enabled,
    onDishCreated,
    onDishStatusChanged,
    onDishPaid,
    onSummaryUpdate,
    onUserJoined,
    onUserLeft,
    onSplitUpdate,
    onFullRefresh,
  ]);

  return {
    isSocketConnected: isConnected,
  };
}
