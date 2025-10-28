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
              console.log("✅ Scanner ready - La cámara está lista");
              setError(null);
            },
            onSuccess: (data) => {
              console.log("✅ Scan success - Datos recibidos:", data);
              console.log("Detalles:", {
                cardNumber: data.cardNumber,
                expiryMonth: data.expiryMonth,
                expiryYear: data.expiryYear,
                cardholderName: data.cardholderName,
                raw: data,
              });
              handleScanSuccess(data);
            },
            onError: (error) => {
              console.error("❌ Scan error:", error);
              console.error("Error completo:", {
                message: error.message,
                code: error.code,
                full: error,
              });
              setError(error.message || "Error durante el escaneo");
            },
            onCancel: () => {
              console.log("⚠️ Scan cancelled by user");
              handleClose();
            },
          }
        );

        // Manejar el resultado cuando el flujo se complete
        console.log("📊 Resultado final de attachToElement:", result);
        if (result.completed && result.data) {
          console.log("✅ Flujo completado con datos");
          handleScanSuccess(result.data);
        } else {
          console.log("⚠️ Escaneo cancelado o incompleto:", {
            completed: result.completed,
            hasData: !!result.data,
          });
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
      console.log("🔄 Procesando datos del escaneo:", data);

      // Extraer información de la tarjeta del estado
      // DyScan devuelve los datos en scanResult con firstSix y lastFour
      let cardNumber = data.cardNumber || "";
      let expiryDate = "";
      let cardholderName = data.cardholderName || "";

      // Si los datos vienen en scanResult (formato de DyScan)
      if (data.scanResult) {
        const { firstSix, lastFour, expirationDate, cardholderName: name } = data.scanResult;

        // Construir número de tarjeta con firstSix y lastFour
        // Nota: El número completo no está disponible por seguridad
        // Usamos XXXXXX para los dígitos del medio
        if (firstSix && lastFour) {
          cardNumber = `${firstSix}XXXXXX${lastFour}`;
        }

        // La fecha viene en formato MM/YY
        expiryDate = expirationDate || "";

        // Nombre del titular si está disponible
        if (name) {
          cardholderName = name;
        }
      } else {
        // Formato alternativo (si viene directamente)
        const expiryMonth = data.expiryMonth || "";
        const expiryYear = data.expiryYear || "";
        expiryDate = `${expiryMonth}/${expiryYear}`;
      }

      console.log("📝 Datos extraídos:", {
        cardNumber,
        expiryDate,
        cardholderName,
      });

      // Validar que tengamos al menos el número de tarjeta
      if (!cardNumber) {
        console.error("⚠️ No se detectó número de tarjeta");
        setError("No se pudo leer el número de tarjeta. Intenta de nuevo.");
        return;
      }

      console.log("✅ Llamando a onScanSuccess con:", {
        cardNumber,
        expiryDate,
        cardholderName,
      });

      // Llamar al callback con los resultados
      onScanSuccess({
        cardNumber,
        expiryDate,
        cardholderName,
      });

      // Cerrar el escáner
      onClose();
    } catch (err) {
      console.error("❌ Error procesando resultados del escaneo:", err);
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
