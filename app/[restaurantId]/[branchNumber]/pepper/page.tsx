"use client";

import { useRouter } from "next/navigation";
import ChatView from "@/app/components/ChatView";
import { useValidateAccess } from "@/app/hooks/useValidateAccess";
import ValidationError from "@/app/components/ValidationError";

export default function PepperPage() {
  const router = useRouter();
  const { validationError } = useValidateAccess();

  const handleBack = () => {
    router.back();
  };

  // Mostrar error de validación si existe
  if (validationError) {
    return <ValidationError errorType={validationError as any} />;
  }

  return <ChatView onBack={handleBack} />;
}
