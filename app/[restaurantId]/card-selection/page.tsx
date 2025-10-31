"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTable } from "../../context/TableContext";
import { useTableNavigation } from "../../hooks/useTableNavigation";
import { useGuest, useIsGuest } from "../../context/GuestContext";
import { usePayment } from "../../context/PaymentContext";
import { useRestaurant } from "../../context/RestaurantContext";
import { getRestaurantData } from "../../utils/restaurantData";
import { useEffect, useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useEcartPay } from "../../hooks/useEcartPay";
import MenuHeaderBack from "../../components/headers/MenuHeaderBack";
import { apiService } from "../../utils/api";
import PaymentAnimation from "../../components/UI/PaymentAnimation";
import Loader from "../../components/UI/Loader";

import { Plus, Trash2, Loader2, CircleAlert, X } from "lucide-react";
import { getCardTypeIcon } from "../../utils/cardIcons";

export default function CardSelectionPage() {
  const params = useParams();
  const { setRestaurantId } = useRestaurant();
  const restaurantId = params?.restaurantId as string;

  useEffect(() => {
    if (restaurantId && !isNaN(parseInt(restaurantId))) {
      setRestaurantId(parseInt(restaurantId));
    }
  }, [restaurantId, setRestaurantId]);

  const { state, dispatch, loadTableData } = useTable();
  const { navigateWithTable } = useTableNavigation();
  const searchParams = useSearchParams();

  // Establecer tableNumber desde URL si no está en el estado
  useEffect(() => {
    const tableFromUrl = searchParams?.get("table");
    if (tableFromUrl && !state.tableNumber) {
      console.log(
        "🔧 Card selection: Setting table number from URL:",
        tableFromUrl
      );
      dispatch({ type: "SET_TABLE_NUMBER", payload: tableFromUrl });
    }
  }, [searchParams, state.tableNumber, dispatch]);
  const restaurantData = getRestaurantData();
  const isGuest = useIsGuest();
  const { guestId, tableNumber, setAsAuthenticated } = useGuest();
  const { hasPaymentMethods, paymentMethods, deletePaymentMethod } =
    usePayment();
  const { user, isLoaded } = useUser();

  const paymentType = searchParams.get("type") || "full-bill";
  const totalAmountCharged = parseFloat(searchParams.get("amount") || "0"); // Total cobrado al cliente
  const baseAmount = parseFloat(searchParams.get("baseAmount") || "0"); // Monto base (consumo)
  const tipAmount = parseFloat(searchParams.get("tipAmount") || "0"); // Propina
  const ivaTip = parseFloat(searchParams.get("ivaTip") || "0"); // IVA propina (no pagado por cliente)
  const xquisitoCommissionClient = parseFloat(
    searchParams.get("xquisitoCommissionClient") || "0"
  );
  const ivaXquisitoClient = parseFloat(
    searchParams.get("ivaXquisitoClient") || "0"
  );
  const xquisitoCommissionRestaurant = parseFloat(
    searchParams.get("xquisitoCommissionRestaurant") || "0"
  );
  const xquisitoCommissionTotal = parseFloat(
    searchParams.get("xquisitoCommissionTotal") || "0"
  );
  const ecartCommissionTotal = parseFloat(
    searchParams.get("ecartCommissionTotal") || "0"
  );
  const userName = searchParams.get("userName");
  const selectedItemsParam = searchParams.get("selectedItems");

  // Calcular valores faltantes
  const xquisitoClientCharge = xquisitoCommissionClient + ivaXquisitoClient;

  // IVA sobre la comisión del restaurante (16% de xquisitoCommissionRestaurant)
  const ivaXquisitoRestaurant = xquisitoCommissionRestaurant * 0.16;

  // Cargo total al restaurante (comisión + IVA)
  const xquisitoRestaurantCharge =
    xquisitoCommissionRestaurant + ivaXquisitoRestaurant;

  // Subtotal para comisión es el consumo base + propina
  const subtotalForCommission = baseAmount + tipAmount;

  // Tasa aplicada (% total de comisión Xquisito sobre el subtotal)
  const xquisitoRateApplied =
    subtotalForCommission > 0
      ? (xquisitoCommissionTotal / subtotalForCommission) * 100
      : 0;

  const {
    createCheckout,
    isLoading: paymentLoading,
    error: paymentError,
    waitForSDK,
  } = useEcartPay();

  // Determinar el nombre a usar: prioridad a userName de URL, luego state.currentUserName, luego nombre de usuario autenticado
  const effectiveName =
    userName ||
    state.currentUserName ||
    user?.fullName ||
    user?.firstName ||
    "";

  const [name, setName] = useState(effectiveName);
  const [email, setEmail] = useState("");
  const [selectedPayment, setSelectedPayment] = useState("mastercard");
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<
    string | null
  >(null);
  const [paymentMethodType, setPaymentMethodType] = useState<"saved" | "new">(
    "new"
  );
  const [paymentAttempts, setPaymentAttempts] = useState(0);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);
  const [showPaymentAnimation, setShowPaymentAnimation] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [showTotalModal, setShowTotalModal] = useState(false);

  useEffect(() => {
    if (isLoaded && user) {
      setAsAuthenticated(user.id);
    }
  }, [isLoaded, user, setAsAuthenticated]);

  useEffect(() => {
    // Actualizar nombre cuando cambie effectiveName
    const newName =
      userName ||
      state.currentUserName ||
      user?.fullName ||
      user?.firstName ||
      "";
    if (newName && newName !== name) {
      setName(newName);
      console.log(
        "🔧 Updated name:",
        newName,
        "from userName:",
        userName,
        "state.currentUserName:",
        state.currentUserName
      );
    }

    // Configurar usuarios seleccionados según el tipo de pago
    if (userName) {
      setSelectedUsers([userName]);
    }

    // Configurar items seleccionados para select-items
    if (paymentType === "select-items" && selectedItemsParam) {
      setSelectedItems(
        selectedItemsParam.split(",").filter((item) => item.trim() !== "")
      );
    }
  }, [userName, state.currentUserName, user, paymentType, selectedItemsParam]);

  // Cargar datos de la mesa si no existen en el contexto
  useEffect(() => {
    const loadData = async () => {
      if (state.tableNumber) {
        // Si no hay datos cargados o están desactualizados, cargar
        if (
          !state.dishOrders ||
          state.dishOrders.length === 0 ||
          !state.tableSummary
        ) {
          console.log("🔄 Card selection: Loading table data (missing data)");
          await loadTableData();
        } else {
          console.log("✅ Card selection: Data already loaded");
        }
      } else if (!state.tableNumber) {
        console.log("⚠️ Card selection: Waiting for table number...");
      }
    };
    loadData();
  }, [state.tableNumber, state.dishOrders, state.tableSummary]);

  // Calcular totales basados en el nuevo sistema de platillos
  const dishOrders = Array.isArray(state.dishOrders) ? state.dishOrders : [];

  // Total de la mesa basado en platillos
  const tableTotalPrice = dishOrders.reduce((sum, dish) => {
    return sum + (dish.total_price || 0);
  }, 0);

  // Platillos no pagados
  const unpaidDishes = dishOrders.filter(
    (dish) => dish.payment_status === "not_paid" || !dish.payment_status
  );

  const unpaidAmount = unpaidDishes.reduce((sum, dish) => {
    return sum + (dish.total_price || 0);
  }, 0);

  // Set default payment method when payment methods are loaded (only once)
  useEffect(() => {
    if (hasPaymentMethods && paymentMethods.length > 0) {
      // Solo establecer la tarjeta por defecto si no hay ninguna seleccionada
      if (!selectedPaymentMethodId) {
        const defaultMethod =
          paymentMethods.find((pm) => pm.isDefault) || paymentMethods[0];
        setSelectedPaymentMethodId(defaultMethod.id);
      }
      setPaymentMethodType("saved");
    } else {
      setPaymentMethodType("new");
      setSelectedPaymentMethodId(null);
    }
    // Set loading to false once we have payment methods data
    setIsLoadingInitial(false);
  }, [hasPaymentMethods, paymentMethods]);

  const handlePaymentSuccess = async (
    paymentId: string,
    amount: number,
    paymentType: string
  ): Promise<void> => {
    try {
      setIsProcessing(true);

      // Trigger exit animations before processing
      setIsAnimatingOut(true);

      // En el nuevo sistema de platillos, necesitamos marcar platillos específicos como pagados
      // Esto dependerá del tipo de pago y los platillos involucrados

      if (paymentType === "user-items" && userName) {
        // Pagar solo los platillos del usuario específico
        const userDishes = dishOrders.filter(
          (dish) =>
            dish.guest_name === userName &&
            (dish.payment_status === "not_paid" || !dish.payment_status)
        );

        for (const dish of userDishes) {
          try {
            await apiService.payDishOrder(
              dish.dish_order_id,
              selectedPaymentMethodId
            );
          } catch (error) {
            console.error(`Error paying dish ${dish.dish_order_id}:`, error);
          }
        }
      } else if (paymentType === "select-items") {
        // Pagar solo los platillos seleccionados específicamente
        for (const dishId of selectedItems) {
          try {
            await apiService.payDishOrder(dishId, selectedPaymentMethodId);
          } catch (error) {
            console.error(`Error paying selected dish ${dishId}:`, error);
          }
        }
      } else if (paymentType === "equal-shares") {
        // Para división equitativa, usar paySplitAmount para rastrear qué usuario pagó
        try {
          if (user && user.id) {
            await apiService.paySplitAmount(
              restaurantId,
              state.tableNumber,
              user.id,
              null,
              selectedPaymentMethodId
            );
          } else if (isGuest && name.trim()) {
            await apiService.paySplitAmount(
              restaurantId,
              state.tableNumber,
              null,
              name.trim(),
              selectedPaymentMethodId
            );
          }
        } catch (error) {
          console.error("Error paying split amount:", error);
        }
      } else if (
        paymentType === "full-bill" ||
        paymentType === "choose-amount"
      ) {
        // Para cuenta completa o monto personalizado, usar el monto exacto
        try {
          if (user && user.id) {
            await apiService.payTableAmount(
              restaurantId,
              state.tableNumber,
              baseAmount,
              user.id,
              null,
              selectedPaymentMethodId
            );
            console.log("hollaaaaaaaaaaa");
          } else {
            await apiService.payTableAmount(
              restaurantId,
              state.tableNumber,
              baseAmount,
              null,
              name.trim(),
              selectedPaymentMethodId
            );
          }
        } catch (error) {
          console.error("Error paying table amount:", error);
        }
      }

      // Recargar datos de la mesa después del pago para reflejar cambios
      console.log("🔄 Reloading table data after payment...");
      await loadTableData();

      // Store payment success data for payment-success page
      if (typeof window !== "undefined") {
        // Get payment method details
        const selectedMethod = paymentMethods.find(
          (pm) => pm.id === selectedPaymentMethodId
        );

        const successData = {
          paymentId,
          amount,
          paymentType,
          userName: userName || name,
          tableNumber: state.tableNumber,
          dishOrders: dishOrders, // Todos los dish orders de la mesa
          tableSummary: state.tableSummary, // Resumen completo de la mesa
          baseAmount,
          tipAmount,
          ivaTip,
          xquisitoCommissionClient,
          ivaXquisitoClient,
          xquisitoCommissionRestaurant,
          xquisitoRestaurantCharge,
          xquisitoCommissionTotal,
          totalAmountCharged,
          dishCount:
            paymentType === "user-items"
              ? dishOrders.filter((d) => d.guest_name === userName).length
              : paymentType === "select-items"
                ? selectedItems.length
                : unpaidDishes.length,
          alreadyProcessed: true,
          // Payment method details
          cardLast4: selectedMethod?.lastFourDigits,
          cardBrand: selectedMethod?.cardType,
        };

        console.log(
          "💾 Storing payment success data for payment-success page:",
          successData
        );
        localStorage.setItem(
          "xquisito-completed-payment",
          JSON.stringify(successData)
        );
      }
      // Get table_order_id from any dish order (all dishes from the same table share the same table_order_id)
      const tableOrderId =
        dishOrders.length > 0 && dishOrders[0].table_order_id
          ? dishOrders[0].table_order_id
          : null;

      console.log(
        "📊 Recording payment transaction with table_order_id:",
        tableOrderId
      );

      // Record payment transaction
      if (tableOrderId && selectedPaymentMethodId) {
        try {
          await apiService.recordPaymentTransaction({
            payment_method_id: selectedPaymentMethodId,
            restaurant_id: parseInt(restaurantId),
            id_table_order: tableOrderId,
            id_tap_orders_and_pay: null,
            base_amount: baseAmount,
            tip_amount: tipAmount,
            iva_tip: ivaTip,
            xquisito_commission_total: xquisitoCommissionTotal,
            xquisito_commission_client: xquisitoCommissionClient,
            xquisito_commission_restaurant: xquisitoCommissionRestaurant,
            iva_xquisito_client: ivaXquisitoClient,
            iva_xquisito_restaurant: ivaXquisitoRestaurant,
            xquisito_client_charge:
              xquisitoCommissionClient + ivaXquisitoClient,
            xquisito_restaurant_charge: xquisitoRestaurantCharge,
            xquisito_rate_applied: xquisitoRateApplied,
            total_amount_charged: totalAmountCharged,
            subtotal_for_commission: subtotalForCommission,
            currency: "MXN",
          });
          console.log("✅ Payment transaction recorded successfully");
        } catch (transactionError) {
          console.error(
            "❌ Error recording payment transaction:",
            transactionError
          );
          // Don't throw - continue with payment flow even if transaction recording fails
        }
      } else {
        console.warn(
          "⚠️ Cannot record transaction - missing table_order_id or payment_method_id"
        );
      }
    } catch (error) {
      console.error("❌ Error processing payment success:", error);
      setIsProcessing(false);
    }
  };

  const handleAnimationComplete = useCallback(() => {
    // Navigate after animation completes
    const paymentId = "completed";
    navigateWithTable(
      `/payment-success?paymentId=${paymentId}&amount=${baseAmount}&type=${paymentType}&processed=true`
    );
  }, [navigateWithTable, baseAmount, paymentType]);

  const handlePayment = async (): Promise<void> => {
    // Validar selección de tarjeta si hay métodos de pago disponibles
    if (hasPaymentMethods && !selectedPaymentMethodId) {
      alert("Por favor selecciona una tarjeta de pago");
      return;
    }

    setIsProcessing(true);

    try {
      // Set guest and table info for API service
      if (isGuest && guestId) {
        apiService.setGuestInfo(
          guestId,
          state.tableNumber || tableNumber || undefined
        );
      }

      // Check if user has payment methods
      const paymentMethodsResult = await apiService.getPaymentMethods();

      if (!paymentMethodsResult.success) {
        throw new Error(
          paymentMethodsResult.error?.message ||
            "Failed to fetch payment methods"
        );
      }

      if (
        !paymentMethodsResult.data?.paymentMethods ||
        paymentMethodsResult.data.paymentMethods.length === 0
      ) {
        // No payment methods, redirect to add card page
        setIsProcessing(false);

        const queryParams = new URLSearchParams({
          amount: totalAmountCharged.toString(), // Total cobrado al cliente
          baseAmount: baseAmount.toString(), // Monto base (consumo)
          tipAmount: tipAmount.toString(),
          ivaTip: ivaTip.toString(),
          xquisitoCommissionClient: xquisitoCommissionClient.toString(),
          ivaXquisitoClient: ivaXquisitoClient.toString(),
          xquisitoCommissionRestaurant: xquisitoCommissionRestaurant.toString(),
          xquisitoRestaurantCharge: xquisitoRestaurantCharge.toString(),
          xquisitoCommissionTotal: xquisitoCommissionTotal.toString(),
          type: paymentType,
          ...(userName && { userName }),
        });

        navigateWithTable(`/add-card?${queryParams.toString()}`);
        return;
      }

      // Determinar qué método de pago usar
      const paymentMethods = paymentMethodsResult.data.paymentMethods;
      let paymentMethodToUse;

      console.log("🔍 Debug payment method selection:");
      console.log("- isGuest:", isGuest);
      console.log("- selectedPaymentMethodId:", selectedPaymentMethodId);
      console.log(
        "- available paymentMethods:",
        paymentMethods.map((pm) => ({
          id: pm.id,
          isDefault: pm.isDefault,
          cardType: pm.cardType,
        }))
      );

      if (!isGuest && selectedPaymentMethodId) {
        // Usuario registrado: usar tarjeta seleccionada
        paymentMethodToUse = paymentMethods.find(
          (pm) => pm.id === selectedPaymentMethodId
        );
        console.log("- paymentMethodToUse (selected):", paymentMethodToUse);
        if (!paymentMethodToUse) {
          throw new Error("Tarjeta seleccionada no encontrada");
        }
      } else {
        // Usuario invitado o fallback: usar tarjeta predeterminada/primera
        paymentMethodToUse =
          paymentMethods.find((pm) => pm.isDefault) || paymentMethods[0];
        console.log(
          "- paymentMethodToUse (default/first):",
          paymentMethodToUse
        );
      }

      // Process payment directly with selected/default payment method
      const paymentData = {
        paymentMethodId: paymentMethodToUse.id,
        amount: totalAmountCharged,
        currency: "MXN",
        description: `Xquisito Restaurant Payment - Table ${tableNumber || state.tableNumber || "N/A"}${userName ? ` - ${userName}` : ""} - Tip: $${tipAmount.toFixed(2)} - Commission: $${(xquisitoCommissionClient + ivaXquisitoClient).toFixed(2)}`,
        orderId: `order-${Date.now()}-attempt-${paymentAttempts + 1}`,
        tableNumber: tableNumber || state.tableNumber,
        restaurantId: "xquisito-main",
      };

      console.log("💳 Sending payment request:", paymentData);
      const paymentResult = await apiService.processPayment(paymentData);

      if (!paymentResult.success) {
        console.error("❌ Payment failed:", paymentResult.error);
        throw new Error(
          paymentResult.error?.message || "Payment processing failed"
        );
      }

      const payment = paymentResult.data?.payment;
      const order = paymentResult.data?.order;

      if (
        payment?.type === "direct_charge" ||
        (payment && !payment.payLink && !order?.payLink)
      ) {
        console.log(
          "💳 Direct payment successful, proceeding to handlePaymentSuccess"
        );
        await handlePaymentSuccess(payment.id, baseAmount, paymentType); // Usar baseAmount, no totalAmountWithTip

        // Show payment animation after processing
        setShowPaymentAnimation(true);
        return;
      }

      // Check if we have a payLink (fallback to EcartPay verification)
      const payLink = order?.payLink || payment?.payLink;
      if (payLink) {
        // Store order details for later reference
        if (typeof window !== "undefined") {
          // Get payment method details
          const selectedMethod = paymentMethods.find(
            (pm) => pm.id === selectedPaymentMethodId
          );

          const paymentData = {
            orderId: order?.id || payment?.id,
            amount: baseAmount, // Monto base para BD (consumo)
            paymentType,
            userName: userName || name,
            tableNumber: state.tableNumber,
            dishOrders: dishOrders, // Todos los dish orders de la mesa
            tableSummary: state.tableSummary, // Resumen completo de la mesa
            baseAmount,
            tipAmount,
            ivaTip,
            xquisitoCommissionClient,
            ivaXquisitoClient,
            xquisitoCommissionRestaurant,
            xquisitoRestaurantCharge,
            xquisitoCommissionTotal,
            totalAmountCharged, // Total cobrado al cliente
            // Payment method details
            cardLast4: selectedMethod?.lastFourDigits,
            cardBrand: selectedMethod?.cardType,
          };

          console.log("💾 Storing payment data in localStorage:", paymentData);
          localStorage.setItem(
            "xquisito-pending-payment",
            JSON.stringify(paymentData)
          );
        }

        setPaymentAttempts((prev) => prev + 1);

        // Show user-friendly message before redirect
        const shouldRedirect = confirm(
          `Tu método de pago requiere verificación a través de EcartPay.\n\n` +
            `Esto es normal en modo de pruebas. En producción, este paso usualmente se omite.\n\n` +
            `Haz clic en OK para completar la verificación, o Cancelar para intentar de nuevo.`
        );

        if (shouldRedirect) {
          window.location.href = payLink;
        } else {
          setIsProcessing(false);
        }
        return;
      }

      if (payment || order) {
        const paymentId = payment?.id || order?.id || "completed";
        console.log(
          "✅ Payment completed successfully (no verification needed):",
          paymentId
        );
        await handlePaymentSuccess(paymentId, baseAmount, paymentType); // Usar baseAmount, no totalAmountWithTip

        // Show payment animation after processing
        setShowPaymentAnimation(true);
        return;
      }

      throw new Error("Formato de respuesta de pago inesperado");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      console.error("Payment error:", error);
      alert(`Error en el pago: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddCard = (): void => {
    const queryParams = new URLSearchParams({
      amount: totalAmountCharged.toString(), // Total cobrado al cliente
      baseAmount: baseAmount.toString(), // Monto base (consumo)
      tipAmount: tipAmount.toString(),
      ivaTip: ivaTip.toString(),
      xquisitoCommissionClient: xquisitoCommissionClient.toString(),
      ivaXquisitoClient: ivaXquisitoClient.toString(),
      xquisitoCommissionRestaurant: xquisitoCommissionRestaurant.toString(),
      xquisitoRestaurantCharge: xquisitoRestaurantCharge.toString(),
      xquisitoCommissionTotal: xquisitoCommissionTotal.toString(),
      type: paymentType,
      scan: "true", // Auto-abrir scanner
      ...(userName && { userName }),
    });

    navigateWithTable(`/add-card?${queryParams.toString()}`);
  };

  const handleDeleteCard = async (paymentMethodId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta tarjeta?")) {
      return;
    }

    setDeletingCardId(paymentMethodId);
    try {
      await deletePaymentMethod(paymentMethodId);
    } catch (error) {
      alert("Error al eliminar la tarjeta. Intenta de nuevo.");
    } finally {
      setDeletingCardId(null);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const textOnlyRegex = /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s'-]*$/;

    if (textOnlyRegex.test(value)) {
      setName(value);
    }
  };

  if (isLoadingInitial) {
    return <Loader />;
  }

  return (
    <>
      <PaymentAnimation
        isActive={showPaymentAnimation}
        onAnimationComplete={handleAnimationComplete}
      />

      <div className="min-h-screen bg-gradient-to-br from-[#0a8b9b] to-[#153f43] flex flex-col">
        {/* Fixed Header */}
        <div
          className="fixed top-0 left-0 right-0 z-50"
          style={{ zIndex: 999 }}
        >
          <div className={isAnimatingOut ? "animate-fade-out" : ""}>
            <MenuHeaderBack
              restaurant={restaurantData}
              tableNumber={state.tableNumber}
            />
          </div>
        </div>

        {/* Spacer for fixed header */}
        <div className="h-20"></div>

        <div
          className={`w-full flex-1 flex flex-col justify-end ${isAnimatingOut ? "animate-slide-down" : ""}`}
        >
          <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center">
            <div className="flex flex-col relative mx-4 w-full">
              <div className="left-4 right-4 bg-gradient-to-tl from-[#0a8b9b] to-[#1d727e] rounded-t-4xl translate-y-7 z-0">
                <div className="py-6 px-8 flex flex-col justify-center">
                  <h1 className="font-medium text-white text-3xl leading-7 mt-2 mb-6">
                    Selecciona tu método de pago
                  </h1>
                </div>
              </div>

              <div className="bg-white rounded-t-4xl relative z-10 flex flex-col px-6 flex-1 py-8">
                {/* Payment Summary */}
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-black font-medium">Tu parte</span>
                    <span className="text-black font-medium">
                      ${baseAmount.toFixed(2)} MXN
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-t pt-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-black">
                        Total a pagar
                      </span>
                      <CircleAlert
                        className="size-4 cursor-pointer text-gray-500"
                        strokeWidth={2.3}
                        onClick={() => setShowTotalModal(true)}
                      />
                    </div>
                    <span className="font-medium text-black">
                      ${totalAmountCharged.toFixed(2)} MXN
                    </span>
                  </div>
                </div>

                {/* Payment Method Selection - Show for both registered users and guests with saved cards */}
                {((user && hasPaymentMethods) ||
                  (isGuest && hasPaymentMethods)) && (
                  <div>
                    {/*
                <h3 className="text-sm font-medium text-black mb-4">
                  Selecciona tu método de pago
                </h3>*/}

                    {/* Payment Method Type Toggle */}
                    {/*
                <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
                  <button
                    onClick={() => setPaymentMethodType("saved")}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                      paymentMethodType === "saved"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Tarjetas guardadas
                  </button>
                   <button
                    onClick={() => setPaymentMethodType("new")}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                      paymentMethodType === "new"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Nueva tarjeta
                  </button>
                </div>
                */}

                    {/* Saved Cards List */}
                    {paymentMethodType === "saved" && (
                      <div className="space-y-2.5 mb-2.5">
                        {paymentMethods.map((method) => (
                          <div
                            key={method.id}
                            className={`flex items-center py-1.5 px-5 pl-10 border rounded-full transition-colors ${
                              selectedPaymentMethodId === method.id
                                ? "border-teal-500 bg-teal-50"
                                : "border-black/50  bg-[#f9f9f9]"
                            }`}
                          >
                            <div
                              onClick={() =>
                                setSelectedPaymentMethodId(method.id)
                              }
                              className="flex items-center justify-center gap-3 mx-auto cursor-pointer"
                            >
                              <div>{getCardTypeIcon(method.cardBrand)}</div>
                              <div>
                                <p className="text-black">
                                  **** **** **** {method.lastFourDigits}
                                </p>
                              </div>
                              {/*
                          {method.isDefault && (
                            <span className="text-xs bg-teal-100 text-teal-800 px-1 py-1 rounded-full">
                              ⭐
                            </span>
                          )}*/}
                            </div>

                            <div
                              onClick={() =>
                                setSelectedPaymentMethodId(method.id)
                              }
                              className={`w-4 h-4 rounded-full border-2 cursor-pointer ${
                                selectedPaymentMethodId === method.id
                                  ? "border-teal-500 bg-teal-500"
                                  : "border-gray-300"
                              }`}
                            >
                              {selectedPaymentMethodId === method.id && (
                                <div className="w-full h-full rounded-full bg-white scale-50"></div>
                              )}
                            </div>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteCard(method.id)}
                              disabled={deletingCardId === method.id}
                              className="pl-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50 cursor-pointer"
                              title="Eliminar tarjeta"
                            >
                              {deletingCardId === method.id ? (
                                <Loader2 className="size-5 animate-spin" />
                              ) : (
                                <Trash2 className="size-5" />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Payment Method Section */}
                <div>
                  <button
                    onClick={handleAddCard}
                    className="border border-black/50 flex justify-center items-center gap-1 w-full text-black py-3 rounded-full cursor-pointer transition-colors bg-[#f9f9f9] hover:bg-gray-100"
                  >
                    <Plus className="size-5" />
                    Agregar método de pago
                  </button>
                </div>

                {/* Bottom section with button - now inside the fixed container */}
                <div className="pt-4">
                  {paymentError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <p className="text-red-800 text-sm text-center">
                        {paymentError}
                      </p>
                    </div>
                  )}

                  {/* Pay Button */}
                  <button
                    onClick={handlePayment}
                    disabled={
                      paymentLoading ||
                      isProcessing ||
                      (hasPaymentMethods && !selectedPaymentMethodId)
                    }
                    className={`w-full text-white py-3 rounded-full cursor-pointer transition-colors ${
                      paymentLoading ||
                      isProcessing ||
                      (hasPaymentMethods && !selectedPaymentMethodId)
                        ? "bg-gradient-to-r from-[#34808C] to-[#173E44] opacity-50 cursor-not-allowed"
                        : "bg-gradient-to-r from-[#34808C] to-[#173E44]"
                    }`}
                  >
                    {paymentLoading || isProcessing ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Procesando pago...</span>
                      </div>
                    ) : hasPaymentMethods && !selectedPaymentMethodId ? (
                      "Selecciona una tarjeta"
                    ) : (
                      "Pagar"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de resumen del total */}
        {showTotalModal && (
          <div
            className="fixed inset-0 flex items-end justify-center"
            style={{ zIndex: 99999 }}
          >
            {/* Fondo */}
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setShowTotalModal(false)}
            ></div>

            {/* Modal */}
            <div className="relative bg-white rounded-t-4xl w-full mx-4">
              {/* Titulo */}
              <div className="px-6 pt-4">
                <div className="flex items-center justify-between pb-4 border-b border-[#8e8e8e]">
                  <h3 className="text-lg font-semibold text-black">
                    Resumen del total
                  </h3>
                  <button
                    onClick={() => setShowTotalModal(false)}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="size-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Contenido */}
              <div className="px-6 py-4">
                <p className="text-black mb-4">
                  El total se obtiene de la suma de:
                </p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-black font-medium">+ Consumo</span>
                    <span className="text-black font-medium">
                      ${baseAmount.toFixed(2)} MXN
                    </span>
                  </div>
                  {tipAmount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-black font-medium">+ Propina</span>
                      <span className="text-black font-medium">
                        ${tipAmount.toFixed(2)} MXN
                      </span>
                    </div>
                  )}
                  {xquisitoCommissionClient + ivaXquisitoClient > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-black font-medium">
                        + Comisión de servicio
                      </span>
                      <span className="text-black font-medium">
                        $
                        {(xquisitoCommissionClient + ivaXquisitoClient).toFixed(
                          2
                        )}{" "}
                        MXN
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
