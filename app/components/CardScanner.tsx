"use client";

import { Loader, X, Keyboard } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { DyScanScanView, ScanData } from "../types/dyneti";

interface ScanResult {
  cardNumber: string;
  expiryDate: string;
  cardholderName: string;
}

interface CardScannerProps {
  onScanSuccess: (result: ScanResult) => void;
  onClose: () => void;
}

export default function CardScanner({
  onScanSuccess,
  onClose,
}: CardScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSDKReady, setIsSDKReady] = useState(false);
  const scanViewRef = useRef<DyScanScanView | null>(null);
  const hasInitialized = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Inicializar Dyneti SDK cuando el componente se monta
    const initializeDyneti = async () => {
      if (hasInitialized.current) return;

      // Verificar que el SDK esté cargado
      if (typeof window === "undefined" || !window.DyScan) {
        console.log("Esperando a que DyScan SDK se cargue...");
        setTimeout(initializeDyneti, 100);
        return;
      }

      try {
        const apiKey = process.env.NEXT_PUBLIC_DYNETI_API_KEY;

        if (!apiKey) {
          setError(
            "API Key de Dyneti no configurada. Agrégala en .env.local como NEXT_PUBLIC_DYNETI_API_KEY"
          );
          console.error("NEXT_PUBLIC_DYNETI_API_KEY no está configurada");
          return;
        }

        // Verificar disponibilidad de escaneo
        const isAvailable = await window.DyScan.isAvailable();
        if (!isAvailable) {
          setError(
            "El escaneo de tarjetas no está disponible en este dispositivo"
          );
          return;
        }
        console.log("Escaneo disponible en este dispositivo");

        // Crear instancia de ScanView con Custom View Flow
        const scanView = new window.DyScan.ScanView({
          key: apiKey,
          config: {
            showExplanation: true,
            showResult: false,
            showCancelButton: false, // Manejamos nuestro propio botón de cancelar
          },
        });

        scanViewRef.current = scanView;
        hasInitialized.current = true;

        // Esperar a que el contenedor esté disponible
        if (!containerRef.current) {
          console.error("El contenedor para el escáner no está disponible");
          return;
        }

        setIsSDKReady(true);
        console.log("Dyneti SDK inicializado correctamente");

        // Adjuntar al elemento DOM
        const result = await scanView.attachToElement(
          "user-" + Date.now(), // userId único
          containerRef.current,
          {
            onReady: () => {
              console.log("Scanner ready");
              setError(null);
            },
            onSuccess: (data) => {
              console.log("Scan success:", data);
              handleScanSuccess(data);
            },
            onError: (error) => {
              console.error("Scan error:", error);
              setError(error.message || "Error durante el escaneo");
            },
            onCancel: () => {
              console.log("Scan cancelled by user");
              handleClose();
            },
          }
        );

        // Manejar el resultado cuando el flujo se complete
        if (result.completed && result.data) {
          handleScanSuccess(result.data);
        } else {
          console.log("Escaneo cancelado o incompleto");
        }
      } catch (err) {
        console.error("Error inicializando Dyneti SDK:", err);

        // Mensaje de error más descriptivo
        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido";

        if (
          errorMessage.includes("domain") ||
          errorMessage.includes("origin")
        ) {
          setError(
            "Dominio no autorizado. Contacta a Dyneti para registrar localhost en tu cuenta."
          );
        } else {
          setError(`Error al inicializar el escáner: ${errorMessage}`);
        }
      }
    };

    initializeDyneti();

    // Cleanup al desmontar - el ScanView se limpia automáticamente
    // cuando la promesa de attachToElement se resuelve
    return () => {
      // No se requiere limpieza manual del ScanView
      console.log("CardScanner desmontado");
    };
  }, []);

  const handleScanSuccess = (data: ScanData) => {
    try {
      // Extraer información de la tarjeta del estado
      const cardNumber = data.cardNumber || "";
      const expiryMonth = data.expiryMonth || "";
      const expiryYear = data.expiryYear || "";
      const cardholderName = data.cardholderName || "";

      // Formatear fecha de expiración
      const expiryDate = `${expiryMonth}/${expiryYear}`;

      // Llamar al callback con los resultados
      onScanSuccess({
        cardNumber,
        expiryDate,
        cardholderName,
      });

      console.log("Data", cardNumber, expiryMonth, expiryYear, cardholderName);

      // Cerrar el escáner
      onClose();
    } catch (err) {
      console.error("Error procesando resultados del escaneo:", err);
      setError("Error al procesar los datos de la tarjeta");
    }
  };

  const handleClose = () => {
    // El ScanView se limpia automáticamente cuando se resuelve la promesa
    // o cuando el componente se desmonta
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black" style={{ zIndex: 999 }}>
      {/* Dyneti Scan View Container - ocupa toda la pantalla */}
      <div ref={containerRef} id="dyneti-scan-view" className="w-full h-full" />

      {/* Header con botón de cerrar */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/60 to-transparent p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white text-lg font-medium">Escanear Tarjeta</h2>
          <button
            onClick={handleClose}
            className="text-white hover:text-gray-300 transition-colors cursor-pointer"
          >
            <X className="size-6" />
          </button>
        </div>
        <p className="text-white/90 text-sm mt-2">
          Coloca tu tarjeta dentro del marco
        </p>
      </div>

      {/* Botón de entrada manual en la parte inferior */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/60 to-transparent p-6">
        <div className="flex items-center justify-center">
          <button
            onClick={handleClose}
            className="bg-white text-black px-6 py-3 rounded-full transition-colors hover:bg-stone-100 flex items-center gap-2 cursor-pointer"
            title="Ingresar manualmente"
          >
            <Keyboard className="size-5" />
            <span className="text-sm font-medium">Ingresar manualmente</span>
          </button>
        </div>
      </div>

      {/* Loading Overlay - solo mientras no está listo */}
      {!isSDKReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
          <div className="text-center">
            <Loader className="size-8 text-white animate-spin mx-auto mb-2" />
            <p className="text-white text-sm">Iniciando escáner...</p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
          <div className="text-center px-4">
            <div className="bg-red-500/90 text-white p-6 rounded-lg max-w-md">
              <p className="text-sm mb-4">{error}</p>
              <button
                onClick={handleClose}
                className="bg-white text-black px-6 py-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
