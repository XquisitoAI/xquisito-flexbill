"use client";

import { Loader, X, Keyboard } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { DyScanFormClient, DyScanFormState } from "../types/dyneti";

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
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSDKReady, setIsSDKReady] = useState(false);
  const dynetiClientRef = useRef<DyScanFormClient | null>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Inicializar Dyneti SDK cuando el componente se monta
    const initializeDyneti = () => {
      if (hasInitialized.current) return;

      // Verificar que el SDK esté cargado
      if (typeof window === "undefined" || !window.DyScanForms) {
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

        console.log("Inicializando Dyneti SDK con API key:", apiKey);

        // Crear cliente de Dyneti
        const client = new window.DyScanForms.Form({
          apiKey: apiKey,
          stateCallback: (state: DyScanFormState) => {
            console.log("Dyneti state:", state);

            // Manejar los resultados del escaneo
            if (state.cardNumber) {
              handleScanSuccess(state);
            }
          },
          onScanAction: (startScan) => {
            console.log("Scan action triggered");
            setIsScanning(true);
            setError(null);
            startScan();
          },
          onScanComplete: () => {
            console.log("Scan complete");
            setIsScanning(false);
          },
          scanConfig: {
            showExplanation: true,
            showResult: false,
            showCancelButton: true,
          },
        });

        // Vincular el collector al contenedor
        client.bindCollector({
          id: "dyneti-scan-view",
          collectorType: "scan-view",
        });

        dynetiClientRef.current = client;
        hasInitialized.current = true;
        setIsSDKReady(true);
        console.log("Dyneti SDK inicializado correctamente");
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

    // Cleanup al desmontar
    return () => {
      if (dynetiClientRef.current) {
        try {
          dynetiClientRef.current.detachCollector({ id: "dyneti-scan-view" });
          dynetiClientRef.current.destroy();
        } catch (err) {
          console.error("Error al limpiar Dyneti SDK:", err);
        }
      }
    };
  }, []);

  const handleScanSuccess = (state: DyScanFormState) => {
    try {
      // Extraer información de la tarjeta del estado
      const cardNumber = state.cardNumber || "";
      const expiryMonth = state.expiryMonth || "";
      const expiryYear = state.expiryYear || "";
      const cardholderName = state.cardholderName || "";

      // Formatear fecha de expiración
      const expiryDate = `${expiryMonth}/${expiryYear}`;

      // Llamar al callback con los resultados
      onScanSuccess({
        cardNumber,
        expiryDate,
        cardholderName,
      });

      // Limpiar y cerrar
      if (dynetiClientRef.current) {
        dynetiClientRef.current.detachCollector({ id: "dyneti-scan-view" });
      }
      onClose();
    } catch (err) {
      console.error("Error procesando resultados del escaneo:", err);
      setError("Error al procesar los datos de la tarjeta");
      setIsScanning(false);
    }
  };

  const handleClose = () => {
    if (dynetiClientRef.current) {
      try {
        dynetiClientRef.current.detachCollector({ id: "dyneti-scan-view" });
      } catch (err) {
        console.error("Error al detener el escaneo:", err);
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black" style={{ zIndex: 999 }}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/40 to-transparent p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white text-lg font-medium">Escanear Tarjeta</h2>
          <button
            onClick={handleClose}
            className="text-white hover:text-gray-400 transition-colors cursor-pointer"
          >
            <X className="size-6" />
          </button>
        </div>
        <p className="text-white/80 text-sm mt-2">
          Coloca tu tarjeta dentro del marco
        </p>
      </div>

      {/* Dyneti Scan View Container */}
      <div className="w-full h-full relative">
        <div
          id="dyneti-scan-view"
          className="w-full h-full"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        />
      </div>

      {/* Card Frame Overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-[320px] h-[200px]">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />

          {isScanning && (
            <div className="absolute inset-0 border-4 border-green-500 rounded-lg animate-pulse" />
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      {!isSDKReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="text-center">
            <Loader className="size-8 text-white animate-spin mx-auto mb-2" />
            <p className="text-white text-sm">Iniciando escáner...</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="absolute top-24 left-4 right-4 bg-red-500/90 text-white p-4 rounded-lg z-20">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent p-6 z-10">
        <div className="flex items-center gap-4">
          {/* Status Text */}
          <div className="flex-1 text-white text-center">
            {isScanning ? (
              <div className="flex items-center justify-center gap-2">
                <Loader className="size-5 animate-spin" />
                <span>Escaneando...</span>
              </div>
            ) : (
              <span className="text-sm">Posiciona la tarjeta en el marco</span>
            )}
          </div>

          {/* Manual Entry Button */}
          <button
            onClick={handleClose}
            className="text-black py-3 rounded-full transition-colors bg-white hover:bg-stone-100 w-14 h-14 flex items-center justify-center flex-shrink-0 cursor-pointer"
            title="Ingresar manualmente"
          >
            <Keyboard className="size-6 text-black" />
          </button>
        </div>
      </div>
    </div>
  );
}
