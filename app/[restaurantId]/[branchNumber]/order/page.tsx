"use client";

import OrderStatus from "@/app/components/OrderStatus";
import { useValidateAccess } from "@/app/hooks/useValidateAccess";
import ValidationError from "@/app/components/ValidationError";
import Loader from "@/app/components/UI/Loader";

export default function OrderPage() {
  const { validationError, isValidating } = useValidateAccess();

  // Mostrar error de validación si existe
  if (validationError) {
    return <ValidationError errorType={validationError as any} />;
  }

  return <OrderStatus />;
}
