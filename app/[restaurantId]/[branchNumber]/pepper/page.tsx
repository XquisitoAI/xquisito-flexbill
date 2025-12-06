"use client";

import { useRouter } from "next/navigation";
import ChatView from "@/app/components/ChatView";
import { useValidateAccess } from "@/app/hooks/useValidateAccess";
import ValidationError from "@/app/components/ValidationError";
import Loader from "@/app/components/UI/Loader";

export default function PepperPage() {
  const router = useRouter();
  const { validationError, isValidating } = useValidateAccess();

  const handleBack = () => {
    router.back();
  };

  // Mostrar error de validación si existe
  if (validationError) {
    return <ValidationError errorType={validationError as any} />;
  }

  // Mostrar loader mientras valida
  if (isValidating) {
    return <Loader />;
  }

  return <ChatView onBack={handleBack} />;
}
