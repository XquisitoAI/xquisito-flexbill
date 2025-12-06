"use client";

import { Suspense } from "react";
import DashboardView from "@/app/components/DashboardView";
import Loader from "@/app/components/UI/Loader";
import { useValidateAccess } from "@/app/hooks/useValidateAccess";
import ValidationError from "@/app/components/ValidationError";

export default function DashboardPage() {
  const { validationError, isValidating } = useValidateAccess();

  // Mostrar error de validación si existe
  if (validationError) {
    return <ValidationError errorType={validationError as any} />;
  }

  // Mostrar loader mientras valida
  if (isValidating) {
    return <Loader />;
  }

  return (
    <Suspense fallback={<Loader />}>
      <DashboardView />
    </Suspense>
  );
}
