"use client";

import { useSearchParams } from "next/navigation";
import { useTable } from "@/app/context/TableContext";
import { useTableNavigation } from "@/app/hooks/useTableNavigation";
import { useGuest, useIsGuest } from "@/app/context/GuestContext";
import { usePayment } from "@/app/context/PaymentContext";
import { getRestaurantData } from "@/app/utils/restaurantData";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useEcartPay } from "@/app/hooks/useEcartPay";
import MenuHeaderBack from "@/app/components/headers/MenuHeaderBack";
import { apiService } from "@/app/utils/api";
import PaymentAnimation from "@/app/components/UI/PaymentAnimation";
import { useValidateAccess } from "@/app/hooks/useValidateAccess";
import ValidationError from "@/app/components/ValidationError";
import { paymentService } from "@/app/services/payment.service";

import { Plus, Trash2, Loader2, CircleAlert, X } from "lucide-react";
import { getCardTypeIcon } from "@/app/utils/cardIcons";
import { usePaymentProvider } from "@/app/hooks/usePaymentProvider";

export default function CardSelectionPage() {
  const { validationError, restaurantId, branchNumber } = useValidateAccess();
  const { provider, isLoadingProvider } = usePaymentProvider(restaurantId);
  const { state, dispatch, loadTableData } = useTable();
  const { navigateWithTable } = useTableNavigation();
  const searchParams = useSearchParams();
  const restaurantData = getRestaurantData();
  const isGuest = useIsGuest();
  const { guestId, tableNumber, setAsAuthenticated } = useGuest();
  const { hasPaymentMethods, paymentMethods, deletePaymentMethod } =
    usePayment();
  const { user, profile, isLoading } = useAuth();

  // Establecer tableNumber desde URL si no está en el estado
  useEffect(() => {
    const tableFromUrl = searchParams?.get("table");
    if (tableFromUrl && !state.tableNumber) {
      console.log(
        "🔧 Card selection: Setting table number from URL:",
        tableFromUrl,
      );
      dispatch({ type: "SET_TABLE_NUMBER", payload: tableFromUrl });
    }
  }, [searchParams, state.tableNumber, dispatch]);

  // Tarjeta por defecto del sistema para todos los usuarios

  const defaultSystemCard = {
    id: "system-default-card",
    lastFourDigits: "1234",
    cardBrand: "amex",
    cardType: "credit",
    isDefault: true,
    isSystemCard: true,
  };

  // Combinar tarjetas del sistema con las del usuario
  const allPaymentMethods = [defaultSystemCard, ...paymentMethods];

  const paymentType = searchParams.get("type") || "full-bill";
  const totalAmountCharged = parseFloat(searchParams.get("amount") || "0"); // Total cobrado al cliente
  const baseAmount = parseFloat(searchParams.get("baseAmount") || "0"); // Monto base (consumo)
  const tipAmount = parseFloat(searchParams.get("tipAmount") || "0"); // Propina
  const ivaTip = parseFloat(searchParams.get("ivaTip") || "0"); // IVA propina (no pagado por cliente)
  const xquisitoCommissionClient = parseFloat(
    searchParams.get("xquisitoCommissionClient") || "0",
  );
  const ivaXquisitoClient = parseFloat(
    searchParams.get("ivaXquisitoClient") || "0",
  );
  const xquisitoCommissionRestaurant = parseFloat(
    searchParams.get("xquisitoCommissionRestaurant") || "0",
  );
  const xquisitoCommissionTotal = parseFloat(
    searchParams.get("xquisitoCommissionTotal") || "0",
  );
  const ecartCommissionTotal = parseFloat(
    searchParams.get("ecartCommissionTotal") || "0",
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

  useEcartPay();

  // Determinar el nombre a usar: prioridad a userName de URL, luego state.currentUserName, luego nombre de usuario autenticado
  const effectiveName =
    userName ||
    state.currentUserName ||
    (profile?.firstName && profile?.lastName
      ? `${profile.firstName} ${profile.lastName}`
      : profile?.firstName || "") ||
    "";

  const [name, setName] = useState(effectiveName);
  const [email, setEmail] = useState("");
  const [selectedPayment, setSelectedPayment] = useState("mastercard");
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<
    string | null
  >(null);
  const [paymentMethodType, setPaymentMethodType] = useState<"saved" | "new">(
    "new",
  );
  const [paymentAttempts, setPaymentAttempts] = useState(0);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);
  const [showPaymentAnimation, setShowPaymentAnimation] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [showTotalModal, setShowTotalModal] = useState(false);
  const [showPaymentOptionsModal, setShowPaymentOptionsModal] = useState(false);
  const [selectedMSI, setSelectedMSI] = useState<number | null>(null);
  const [applePayUnavailable, setApplePayUnavailable] = useState(false);
  const [isApplePayProcessing, setIsApplePayProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && user) {
      setAsAuthenticated(user.id);
    }
  }, [isLoading, user, setAsAuthenticated]);

  useEffect(() => {
    // Actualizar nombre cuando cambie effectiveName
    const newName =
      userName ||
      state.currentUserName ||
      (profile?.firstName && profile?.lastName
        ? `${profile.firstName} ${profile.lastName}`
        : profile?.firstName || "") ||
      "";
    if (newName && newName !== name) {
      setName(newName);
      console.log(
        "🔧 Updated name:",
        newName,
        "from userName:",
        userName,
        "state.currentUserName:",
        state.currentUserName,
      );
    }

    // Configurar usuarios seleccionados según el tipo de pago
    if (userName) {
      setSelectedUsers([userName]);
    }

    // Configurar items seleccionados para select-items
    if (paymentType === "select-items" && selectedItemsParam) {
      setSelectedItems(
        selectedItemsParam.split(",").filter((item) => item.trim() !== ""),
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
  }, [state.tableNumber]);

  // Calcular totales basados en el nuevo sistema de platillos
  const dishOrders = Array.isArray(state.dishOrders) ? state.dishOrders : [];

  // Total de la mesa basado en platillos
  const tableTotalPrice = dishOrders.reduce((sum, dish) => {
    return sum + (dish.total_price || 0);
  }, 0);

  // Platillos no pagados
  const unpaidDishes = dishOrders.filter(
    (dish) => dish.payment_status === "not_paid" || !dish.payment_status,
  );

  const unpaidAmount = unpaidDishes.reduce((sum, dish) => {
    return sum + (dish.total_price || 0);
  }, 0);

  // Set default payment method when payment methods are loaded (only once)
  useEffect(() => {
    // Siempre hay al menos la tarjeta del sistema disponible
    if (!selectedPaymentMethodId && allPaymentMethods.length > 0) {
      const defaultMethod =
        allPaymentMethods.find((pm) => pm.isDefault) || allPaymentMethods[0];
      setSelectedPaymentMethodId(defaultMethod.id);
      console.log("💳 Auto-seleccionando tarjeta:", defaultMethod.id);
    }
    setPaymentMethodType("saved");
    // Set loading to false once we have payment methods data
    setIsLoadingInitial(false);
  }, [allPaymentMethods.length]);

  // Log del proveedor de pago activo
  useEffect(() => {
    if (!isLoadingProvider) {
      console.log(
        `[PaymentProvider] Proveedor activo: ${provider ?? "null"} (restaurantId: ${restaurantId})`,
      );
      if (provider === "clip") {
        console.warn(
          "[PaymentProvider] Clip seleccionado — flujo no implementado aún, usando eCartPay como fallback",
        );
      }
    }
  }, [provider, isLoadingProvider, restaurantId]);

  // Verificar soporte de Apple Pay y cargar el SDK solo si aplica
  useEffect(() => {
    if (isLoadingProvider) return; // esperar a que se resuelva el proveedor

    // Apple Pay solo aplica cuando el proveedor es eCartPay (o null como fallback)
    if (provider !== null && provider !== "ecartpay") return;

    const ApplePaySession = (window as any).ApplePaySession;
    if (!ApplePaySession || !ApplePaySession.canMakePayments?.()) {
      // Dispositivo/navegador no soporta Apple Pay — mantener oculto
      return;
    }

    // Dispositivo compatible y proveedor es eCartPay — cargar SDK
    setApplePayUnavailable(false);
    const src =
      process.env.NEXT_PUBLIC_ENV === "production"
        ? "https://ecartpay.com/sdk/pay.js"
        : "https://sandbox.ecartpay.com/sdk/pay.js";
    if (!document.querySelector(`script[src="${src}"]`)) {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      document.head.appendChild(script);
    }
  }, [provider, isLoadingProvider]);

  const handlePaymentSuccess = async (
    paymentId: string,
    amount: number,
    paymentType: string,
  ): Promise<void> => {
    try {
      setIsProcessing(true);

      // OPERACIONES CRÍTICAS (deben completarse antes de mostrar animación)
      // En el nuevo sistema de platillos, necesitamos marcar platillos específicos como pagados
      // Esto dependerá del tipo de pago y los platillos involucrados

      // Determinar el payment_method_id real (null para tarjeta del sistema)
      const realPaymentMethodId =
        selectedPaymentMethodId === "system-default-card"
          ? null
          : selectedPaymentMethodId;

      if (paymentType === "user-items" && userName) {
        // Pagar solo los platillos del usuario específico
        await paymentService.payUserDishes(
          dishOrders,
          userName,
          realPaymentMethodId,
        );
      } else if (paymentType === "select-items") {
        // Pagar solo los platillos seleccionados específicamente
        await paymentService.paySelectedDishes(
          selectedItems,
          realPaymentMethodId,
        );
      } else if (paymentType === "equal-shares") {
        // Para división equitativa, usar paySplitAmount para rastrear qué usuario pagó
        await paymentService.paySplitAmount({
          restaurantId,
          branchNumber,
          tableNumber: state.tableNumber,
          userId: user?.id,
          guestName: !user?.id ? name.trim() : null,
          paymentMethodId: realPaymentMethodId,
        });
      } else if (
        paymentType === "full-bill" ||
        paymentType === "choose-amount"
      ) {
        // Para cuenta completa o monto personalizado, usar el monto exacto
        await paymentService.payTableAmount({
          restaurantId,
          branchNumber,
          tableNumber: state.tableNumber,
          amount: baseAmount,
          userId: user?.id,
          guestName: !user?.id ? name.trim() : null,
          paymentMethodId: realPaymentMethodId,
        });
      }

      // OPERACIONES NO CRÍTICAS (ejecutar en segundo plano)
      // No esperar a que terminen - dejar que se ejecuten mientras se muestra la animación
      const backgroundOperations = async () => {
        try {
          // Recargar datos de la mesa después del pago para reflejar cambios
          console.log("🔄 Reloading table data after payment (background)...");
          await loadTableData();

          // Get table_order_id from any dish order
          const tableOrderId =
            dishOrders.length > 0 && dishOrders[0].table_order_id
              ? dishOrders[0].table_order_id
              : null;

          console.log("📊 Recording payment transaction (background):", {
            tableOrderId,
            hasOrders: dishOrders.length > 0,
          });

          // Record payment transaction
          // Usar null para tarjeta del sistema, sino usar el selectedPaymentMethodId
          const transactionPaymentMethodId =
            selectedPaymentMethodId === "system-default-card"
              ? null
              : selectedPaymentMethodId;

          // Registrar transacción siempre, con o sin table_order_id
          await paymentService.recordPaymentTransaction({
            payment_method_id: transactionPaymentMethodId,
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
          console.log(
            "✅ Payment transaction recorded successfully (background)",
          );
        } catch (transactionError) {
          console.error("❌ Error in background operations:", transactionError);
          // Don't throw - these are non-critical operations
        }
      };

      // Ejecutar operaciones en segundo plano sin esperar
      backgroundOperations();

      // Store payment success data for payment-success page (rápido, solo localStorage)
      if (typeof window !== "undefined") {
        // Get payment method details
        const selectedMethod = allPaymentMethods.find(
          (pm) => pm.id === selectedPaymentMethodId,
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
          selectedItems: paymentType === "select-items" ? selectedItems : [], // Store selected items for filtering
          alreadyProcessed: true,
          // Payment method details
          cardLast4: selectedMethod?.lastFourDigits,
          cardBrand: selectedMethod?.cardType,
        };

        console.log(
          "💾 Storing payment success data for payment-success page:",
          successData,
        );
        localStorage.setItem(
          "xquisito-completed-payment",
          JSON.stringify(successData),
        );
      }

      console.log(
        "✅ Critical payment operations completed, ready to show animation",
      );
    } catch (error) {
      console.error("❌ Error processing payment success:", error);
      setIsProcessing(false);
    }
  };

  const handleAnimationComplete = useCallback(() => {
    // Navigate after animation completes
    const paymentId = "completed";
    navigateWithTable(
      `/payment-success?paymentId=${paymentId}&amount=${baseAmount}&type=${paymentType}&processed=true`,
    );
  }, [navigateWithTable, baseAmount, paymentType]);

  const getApplePaySDK = () =>
    new Promise<any>((resolve) => {
      if ((window as any).Pay?.ApplePay) {
        return resolve((window as any).Pay.ApplePay);
      }

      const interval = setInterval(() => {
        if ((window as any).Pay?.ApplePay) {
          clearInterval(interval);
          resolve((window as any).Pay.ApplePay);
        }
      }, 100);
    });

  // Inicializar Apple Pay SDK cuando los datos estén listos
  const initApplePay = useCallback(async () => {
    if (typeof window === "undefined" || !totalAmountCharged) return;
    console.log(
      "🍎 initApplePay fired, totalAmountCharged:",
      totalAmountCharged,
    );

    try {
      // Crear orden en Ecart Pay para obtener orderId
      const orderResult = await paymentService.createApplePayOrder({
        amount: totalAmountCharged,
        currency: "MXN",
        tableNumber: undefined,
        restaurantId: restaurantId?.toString(),
      });

      const appleOrderId =
        (orderResult as any).orderId ?? orderResult.data?.orderId;
      if (!orderResult.success || !appleOrderId) {
        console.warn("⚠️ Apple Pay: no se pudo crear la orden", orderResult);
        return;
      }

      const applePaySDK = await getApplePaySDK();
      if (!applePaySDK) {
        console.warn("⚠️ Apple Pay SDK no disponible en window.Pay.ApplePay");
        return;
      }

      // Register listeners before render (SDK dispatches to window, not returned object)
      applePaySDK.on("ready", () => {
        console.log("✅ Apple Pay botón listo");
      });
      applePaySDK.on("unavailable", () => {
        console.log("ℹ️ Apple Pay no disponible en este dispositivo/cuenta");
        setApplePayUnavailable(true);
      });
      applePaySDK.on("cancel", () => {
        console.log("🚫 Apple Pay cancelado por el usuario");
        setIsApplePayProcessing(false);
      });
      applePaySDK.on("error", (err: any) => {
        console.error("❌ Apple Pay error:", err);
        setIsApplePayProcessing(false);
        setApplePayUnavailable(true);
      });
      applePaySDK.on("success", async () => {
        console.log("💳 Apple Pay: pago autorizado");
        const mockPaymentId = `apple-pay-${Date.now()}`;
        setIsApplePayProcessing(true);
        await handlePaymentSuccess(mockPaymentId, baseAmount, paymentType);
        setShowPaymentAnimation(true);
      });

      applePaySDK.render({
        container: "#apple-pay-container",
        orderId: appleOrderId,
        amount: totalAmountCharged,
        currency: "MXN",
        countryCode: "MX",
        supportedNetworks: ["visa", "masterCard", "amex"],
        merchantCapabilities: ["supports3DS"],
        buttonStyle: "black",
        buttonType: "pay",
      });
    } catch (err) {
      console.error("❌ Error inicializando Apple Pay:", err);
    }
  }, [totalAmountCharged, restaurantId]);

  useEffect(() => {
    if (!isLoadingInitial && totalAmountCharged > 0) {
      initApplePay();
    }
  }, [isLoadingInitial, totalAmountCharged, initApplePay]);

  const handlePayment = async (): Promise<void> => {
    // Validar selección de tarjeta si hay métodos de pago disponibles
    if (!selectedPaymentMethodId) {
      setErrorMessage("Por favor selecciona una tarjeta de pago");
      return;
    }

    setIsProcessing(true);

    try {
      // Set guest and table info for API service
      if (isGuest && guestId) {
        apiService.setGuestInfo(
          guestId,
          state.tableNumber || tableNumber || undefined,
        );
      }

      // Si se seleccionó la tarjeta del sistema, procesar pago directamente sin EcartPay
      if (selectedPaymentMethodId === "system-default-card") {
        console.log(
          "💳 Sistema: Procesando pago con tarjeta del sistema (sin EcartPay)",
        );

        // Simular un pago exitoso y procesar directamente
        const mockPaymentId = `system-payment-${Date.now()}`;

        await handlePaymentSuccess(mockPaymentId, baseAmount, paymentType);

        // Mostrar animación de pago
        setShowPaymentAnimation(true);
        return;
      }

      // Para tarjetas reales, continuar con el flujo normal de EcartPay
      // Check if user has payment methods
      const paymentMethodsResult = await paymentService.getPaymentMethods();

      if (!paymentMethodsResult.success) {
        throw new Error(
          paymentMethodsResult.error?.message ||
            "Failed to fetch payment methods",
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
        })),
      );

      if (!isGuest && selectedPaymentMethodId) {
        // Usuario registrado: usar tarjeta seleccionada
        paymentMethodToUse = paymentMethods.find(
          (pm) => pm.id === selectedPaymentMethodId,
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
          paymentMethodToUse,
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
        restaurantId: restaurantId,
        installments: selectedMSI || undefined,
      };

      console.log("💳 Sending payment request:", paymentData);
      const paymentResult = await paymentService.processPayment(paymentData);

      if (!paymentResult.success) {
        console.error("❌ Payment failed:", paymentResult.error);
        throw new Error(
          paymentResult.error?.message || "Payment processing failed",
        );
      }

      const payment = paymentResult.data?.payment;
      const order = paymentResult.data?.order;

      if (
        payment?.type === "direct_charge" ||
        (payment && !payment.payLink && !order?.payLink)
      ) {
        console.log(
          "💳 Direct payment successful, proceeding to handlePaymentSuccess",
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
            (pm) => pm.id === selectedPaymentMethodId,
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
            selectedItems: paymentType === "select-items" ? selectedItems : [], // Store selected items for filtering
            // Payment method details
            cardLast4: selectedMethod?.lastFourDigits,
            cardBrand: selectedMethod?.cardType,
          };

          console.log("💾 Storing payment data in localStorage:", paymentData);
          localStorage.setItem(
            "xquisito-pending-payment",
            JSON.stringify(paymentData),
          );
        }

        setPaymentAttempts((prev) => prev + 1);
        window.location.href = payLink;
        return;
      }

      if (payment || order) {
        const paymentId = payment?.id || order?.id || "completed";
        console.log(
          "✅ Payment completed successfully (no verification needed):",
          paymentId,
        );
        await handlePaymentSuccess(paymentId, baseAmount, paymentType); // Usar baseAmount, no totalAmountWithTip

        // Show payment animation after processing
        setShowPaymentAnimation(true);
        return;
      }

      throw new Error("Formato de respuesta de pago inesperado");
    } catch (error) {
      const errMsg =
        error instanceof Error ? error.message : "Error desconocido";
      console.error("Payment error:", error);
      setErrorMessage(errMsg);
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
      scan: "false", // Auto-abrir scanner
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
      setErrorMessage("Error al eliminar la tarjeta. Intenta de nuevo.");
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

  // Calcular el total a mostrar según la opción MSI seleccionada
  const getDisplayTotal = () => {
    if (selectedMSI === null) {
      return totalAmountCharged;
    }

    // Obtener el tipo de tarjeta seleccionada
    const selectedMethod = allPaymentMethods.find(
      (pm) => pm.id === selectedPaymentMethodId,
    );
    const cardBrand = selectedMethod?.cardBrand;

    // Tasas del portal EcartPay (pre-IVA)
    const msiOptions =
      cardBrand === "amex"
        ? [
            { months: 3, rate: 3.25 },
            { months: 6, rate: 6.25 },
            { months: 9, rate: 8.25 },
            { months: 12, rate: 10.25 },
            { months: 15, rate: 13.25 },
            { months: 18, rate: 15.25 },
            { months: 21, rate: 17.25 },
            { months: 24, rate: 19.25 },
          ]
        : [
            { months: 3, rate: 4.26 },
            { months: 6, rate: 7.3 },
            { months: 9, rate: 8.5 },
            { months: 12, rate: 13.0 },
            { months: 18, rate: 18.25 },
          ];

    const selectedOption = msiOptions.find((opt) => opt.months === selectedMSI);
    if (!selectedOption) return totalAmountCharged;

    // Cálculo EcartPay: markup sobre monto final
    return totalAmountCharged / (1 - (selectedOption.rate / 100) * 1.16);
  };

  const displayTotal = getDisplayTotal();

  const MINIMUM_AMOUNT = 20;
  const isUnderMinimum = totalAmountCharged < MINIMUM_AMOUNT;

  if (isLoadingInitial || isLoadingProvider) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-[#0a8b9b] to-[#153f43] flex flex-col">
        <MenuHeaderBack
          restaurant={restaurantData}
          tableNumber={state.tableNumber}
        />

        <div className="px-4 md:px-6 lg:px-8 w-full flex-1 flex flex-col">
          {/* Título skeleton */}
          <div className="bg-gradient-to-tl from-[#0a8b9b] to-[#1d727e] rounded-t-4xl translate-y-7 z-0">
            <div className="py-6 px-8 flex flex-col justify-center">
              <div className="h-8 w-3/4 bg-white/20 rounded-full mt-2 mb-6 animate-pulse" />
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="bg-white rounded-t-4xl flex-1 flex flex-col px-8 overflow-hidden z-10">
              <div className="flex-1 overflow-y-auto py-8 pb-[120px] flex flex-col gap-4">
                {/* Subtotal row */}
                <div className="flex justify-between items-center">
                  <div className="h-4 w-20 bg-gray-200 rounded-full animate-pulse" />
                  <div className="h-4 w-24 bg-gray-200 rounded-full animate-pulse" />
                </div>
                {/* Total row */}
                <div className="flex justify-between items-center border-t pt-3">
                  <div className="h-5 w-28 bg-gray-200 rounded-full animate-pulse" />
                  <div className="h-5 w-28 bg-gray-200 rounded-full animate-pulse" />
                </div>

                {/* Label métodos de pago */}
                <div className="h-4 w-36 bg-gray-200 rounded-full animate-pulse mt-1" />

                {/* Card skeleton 1 */}
                <div className="h-12 w-full bg-gray-100 rounded-full animate-pulse" />
                {/* Card skeleton 2 */}
                <div className="h-12 w-full bg-gray-100 rounded-full animate-pulse" />

                {/* Botón agregar tarjeta */}
                <div className="h-12 w-full bg-gray-100 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Barra inferior fija — skeleton */}
        <div
          className="fixed bottom-0 left-0 right-0 bg-white mx-4 px-8 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"
          style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
        >
          <div className="flex gap-3 mt-6 mb-2 justify-between items-center">
            <div className="flex flex-col gap-1.5">
              <div className="h-3 w-16 bg-gray-200 rounded-full animate-pulse" />
              <div className="h-6 w-28 bg-gray-200 rounded-full animate-pulse" />
            </div>
            <div className="h-12 w-36 bg-gray-200 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Mostrar error de validación si existe
  if (validationError) {
    return <ValidationError errorType={validationError as any} />;
  }

  return (
    <>
      <PaymentAnimation
        isActive={showPaymentAnimation}
        onAnimationComplete={handleAnimationComplete}
      />

      <div className="min-h-dvh bg-gradient-to-br from-[#0a8b9b] to-[#153f43] flex flex-col">
        {/* Header */}
        <MenuHeaderBack
          restaurant={restaurantData}
          tableNumber={state.tableNumber}
        />

        {/* Contenido scrolleable */}
        <div className="px-4 md:px-6 lg:px-8 w-full flex-1 flex flex-col">
          <div className="bg-gradient-to-tl from-[#0a8b9b] to-[#1d727e] rounded-t-4xl translate-y-7 z-0">
            <div className="py-6 px-8 flex flex-col justify-center">
              <h1 className="font-medium text-white text-3xl leading-7 mt-2 mb-6">
                Selecciona tu método de pago
              </h1>
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="bg-white rounded-t-4xl flex-1 flex flex-col px-8 overflow-hidden z-50">
              <div className="flex-1 overflow-y-auto py-8 pb-[120px]">
                {/* Payment Summary */}
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-black text-base md:text-lg lg:text-xl">
                        Total a pagar
                      </span>
                      <CircleAlert
                        className="size-4 cursor-pointer text-gray-500"
                        strokeWidth={2.3}
                        onClick={() => setShowTotalModal(true)}
                      />
                    </div>
                    <div className="text-right">
                      {selectedMSI !== null ? (
                        <>
                          <span className="font-medium text-black text-base md:text-lg lg:text-xl">
                            ${(displayTotal / selectedMSI).toFixed(2)} MXN x{" "}
                            {selectedMSI} meses
                          </span>
                        </>
                      ) : (
                        <span className="font-medium text-black text-base md:text-lg lg:text-xl">
                          ${displayTotal.toFixed(2)} MXN
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Payment Options - Solo mostrar si es tarjeta de crédito */}
                  {(() => {
                    const selectedMethod = allPaymentMethods.find(
                      (pm) => pm.id === selectedPaymentMethodId,
                    );
                    return selectedMethod?.cardType === "credit" ? (
                      <div
                        className="py-2 cursor-pointer"
                        onClick={() => setShowPaymentOptionsModal(true)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-black text-base md:text-lg lg:text-xl">
                            Pago a meses
                          </span>
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              selectedMSI !== null
                                ? "border-[#eab3f4] bg-[#eab3f4]"
                                : "border-gray-300"
                            }`}
                          >
                            {selectedMSI !== null && (
                              <div className="w-full h-full rounded-full bg-white scale-50"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>

                {/* Payment Method Selection - Siempre mostrar (incluye tarjeta del sistema) */}
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
                      <h3 className="text-black font-medium mb-3">
                        Métodos de pago
                      </h3>
                      {allPaymentMethods.map((method) => (
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
                            className="flex items-center justify-center gap-3 mx-auto cursor-pointer text-base md:text-lg lg:text-xl"
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

                          {/* Delete Button - No mostrar para tarjeta del sistema */}
                          {!method.isSystemCard && (
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
                          )}
                        </div>
                      ))}
                      {/* Apple Pay Button */}
                      {!applePayUnavailable && (
                        <div id="apple-pay-container" className="w-full" />
                      )}
                    </div>
                  )}
                </div>

                {/* Payment Method Section */}
                <div>
                  <button
                    onClick={handleAddCard}
                    className="border border-black/50 flex justify-center items-center gap-1 w-full text-black py-3 rounded-full cursor-pointer transition-colors bg-[#f9f9f9] hover:bg-gray-100 text-base md:text-lg lg:text-xl"
                  >
                    <Plus className="size-5" />
                    Agregar método de pago
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Barra inferior fija — botón pagar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white mx-4 px-8 z-90 py-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button
            onClick={handlePayment}
            disabled={isProcessing || isUnderMinimum}
            className={`py-3 text-white rounded-full cursor-pointer font-normal h-fit w-full flex items-center justify-center text-base active:scale-95 transition-transform ${
              isProcessing ||
              isUnderMinimum ||
              (hasPaymentMethods && !selectedPaymentMethodId)
                ? "bg-gradient-to-r from-[#34808C] to-[#173E44] opacity-50 cursor-not-allowed px-10"
                : "bg-gradient-to-r from-[#34808C] to-[#173E44] px-10 animate-pulse-button"
            }`}
          >
            {isProcessing ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Procesando...</span>
              </div>
            ) : isUnderMinimum ? (
              `Mínimo $${MINIMUM_AMOUNT} MXN`
            ) : hasPaymentMethods && !selectedPaymentMethodId ? (
              "Selecciona una tarjeta"
            ) : (
              "Pagar"
            )}
          </button>
        </div>

        {/* Modal de resumen del total */}
        {showTotalModal && (
          <div
            className="fixed inset-0 flex items-end justify-center backdrop-blur-sm"
            style={{ zIndex: 99999 }}
          >
            {/* Fondo */}
            <div
              className="absolute inset-0 bg-black/20"
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
                          2,
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

        {/* Modal de opciones de pago */}
        {showPaymentOptionsModal && (
          <div
            className="fixed inset-0 flex items-end justify-center backdrop-blur-sm"
            style={{ zIndex: 99999 }}
          >
            {/* Fondo */}
            <div
              className="absolute inset-0 bg-black/20"
              onClick={() => setShowPaymentOptionsModal(false)}
            ></div>

            {/* Modal */}
            <div className="relative bg-white rounded-t-4xl w-full mx-4 max-h-[70vh] overflow-y-auto">
              {/* Titulo */}
              <div className="px-6 pt-4 sticky top-0 bg-white z-10">
                <div className="flex items-center justify-between pb-4 border-b border-[#8e8e8e]">
                  <h3 className="text-lg font-semibold text-black">
                    Opciones de pago
                  </h3>
                  <button
                    onClick={() => setShowPaymentOptionsModal(false)}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="size-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Contenido */}
              <div className="px-6 py-4">
                {(() => {
                  const selectedMethod = allPaymentMethods.find(
                    (pm) => pm.id === selectedPaymentMethodId,
                  );
                  const cardBrand = selectedMethod?.cardBrand;

                  // Tasas del portal EcartPay (pre-IVA)
                  const msiOptions =
                    cardBrand === "amex"
                      ? [
                          { months: 3, rate: 3.25, minAmount: 300 },
                          { months: 6, rate: 6.25, minAmount: 600 },
                          { months: 9, rate: 8.25, minAmount: 900 },
                          { months: 12, rate: 10.25, minAmount: 1200 },
                          { months: 15, rate: 13.25, minAmount: 1800 },
                          { months: 18, rate: 15.25, minAmount: 1800 },
                          { months: 21, rate: 17.25, minAmount: 1800 },
                          { months: 24, rate: 19.25, minAmount: 1800 },
                        ]
                      : [
                          // Visa/Mastercard — tasas configuradas en portal EcartPay
                          { months: 3, rate: 4.26, minAmount: 300 },
                          { months: 6, rate: 7.3, minAmount: 600 },
                          { months: 9, rate: 8.5, minAmount: 900 },
                          { months: 12, rate: 13.0, minAmount: 1200 },
                          { months: 18, rate: 18.25, minAmount: 1800 },
                        ];

                  return (
                    <div className="space-y-2.5">
                      {/* Opción: Pago completo */}
                      <div
                        onClick={() => setSelectedMSI(null)}
                        className={`py-2 px-5 border rounded-full cursor-pointer transition-colors ${
                          selectedMSI === null
                            ? "border-teal-500 bg-teal-50"
                            : "border-black/50 bg-[#f9f9f9] hover:border-gray-400"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-black text-base md:text-lg">
                              Pago completo
                            </p>
                            <p className="text-xs md:text-sm text-gray-600">
                              ${totalAmountCharged.toFixed(2)} MXN
                            </p>
                          </div>
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              selectedMSI === null
                                ? "border-teal-500 bg-teal-500"
                                : "border-gray-300"
                            }`}
                          >
                            {selectedMSI === null && (
                              <div className="w-full h-full rounded-full bg-white scale-50"></div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Separador */}
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-white text-gray-500">
                            Pago a meses
                          </span>
                        </div>
                      </div>

                      {/* Opciones MSI */}
                      {(() => {
                        const availableOptions = msiOptions.filter(
                          (option) => totalAmountCharged >= option.minAmount,
                        );
                        const hasUnavailableOptions =
                          availableOptions.length < msiOptions.length;
                        const minAmountNeeded = msiOptions[0]?.minAmount || 0;

                        return (
                          <>
                            {availableOptions.map((option) => {
                              // Cálculo EcartPay: markup sobre monto final
                              const totalWithCommission =
                                totalAmountCharged /
                                (1 - (option.rate / 100) * 1.16);
                              const monthlyPayment =
                                totalWithCommission / option.months;

                              return (
                                <div
                                  key={option.months}
                                  onClick={() => setSelectedMSI(option.months)}
                                  className={`py-2 px-5 border rounded-full cursor-pointer transition-colors ${
                                    selectedMSI === option.months
                                      ? "border-teal-500 bg-teal-50"
                                      : "border-black/50 bg-[#f9f9f9] hover:border-gray-400"
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <p className="font-medium text-black text-base md:text-lg">
                                        ${monthlyPayment.toFixed(2)} MXN x{" "}
                                        {option.months} meses
                                      </p>
                                      <p className="text-xs md:text-sm text-gray-600">
                                        Total ${totalWithCommission.toFixed(2)}{" "}
                                        MXN
                                      </p>
                                    </div>
                                    <div
                                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        selectedMSI === option.months
                                          ? "border-teal-500 bg-teal-500"
                                          : "border-gray-300"
                                      }`}
                                    >
                                      {selectedMSI === option.months && (
                                        <div className="w-full h-full rounded-full bg-white scale-50"></div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}

                            {hasUnavailableOptions &&
                              totalAmountCharged < minAmountNeeded && (
                                <p className="text-xs md:text-sm text-gray-500 text-center mt-2">
                                  Monto mínimo ${minAmountNeeded.toFixed(2)} MXN
                                  para pagos a meses
                                </p>
                              )}
                          </>
                        );
                      })()}
                    </div>
                  );
                })()}
              </div>

              {/* Footer con botón de confirmar */}
              <div className="px-6 py-4 border-t border-gray-200 sticky bottom-0 bg-white">
                <button
                  onClick={() => setShowPaymentOptionsModal(false)}
                  className="w-full bg-gradient-to-r from-[#34808C] to-[#173E44] text-white py-3 rounded-full cursor-pointer transition-colors text-base"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de error de pago */}
      {errorMessage && (
        <div
          className="fixed inset-0 z-[99999] flex items-end justify-center bg-black/50"
          onClick={() => setErrorMessage(null)}
        >
          <div
            className="bg-white rounded-t-4xl w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 max-w-2xl mx-auto">
              <div className="flex flex-col items-center mb-4">
                <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <CircleAlert
                    className="size-7 text-red-500"
                    strokeWidth={2}
                  />
                </div>
                <h2 className="text-xl font-semibold text-black text-center">
                  Error al procesar el pago
                </h2>
              </div>

              <div className="bg-[#f9f9f9] border border-[#bfbfbf]/50 rounded-xl p-4 mb-6">
                <p className="text-gray-700 text-sm text-center">
                  {errorMessage}
                </p>
              </div>

              <button
                onClick={() => setErrorMessage(null)}
                className="w-full bg-gradient-to-r from-[#34808C] to-[#173E44] text-white py-3 rounded-full text-base"
              >
                Intentar de nuevo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
