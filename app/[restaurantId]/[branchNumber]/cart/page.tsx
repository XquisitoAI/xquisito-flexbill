"use client";

import CartView from "@/app/components/CartView";
import ValidationError from "@/app/components/ValidationError";
import { useValidateAccess } from "@/app/hooks/useValidateAccess";

export default function CartPage() {
  const { validationError } = useValidateAccess();

  // Mostrar error de validación si existe
  if (validationError) {
    return <ValidationError errorType={validationError as any} />;
  }

  return <CartView />;
}
