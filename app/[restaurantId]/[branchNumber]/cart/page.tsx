"use client";

import CartView from "@/app/components/CartView";
import ValidationError from "@/app/components/ValidationError";
import Loader from "@/app/components/UI/Loader";
import { useValidateAccess } from "@/app/hooks/useValidateAccess";

export default function CartPage() {
  const { validationError, isValidating } = useValidateAccess();

  // Mostrar error de validación si existe
  if (validationError) {
    return <ValidationError errorType={validationError as any} />;
  }

  // Mostrar loader mientras valida
  if (isValidating) {
    return <Loader />;
  }

  return <CartView />;
}
