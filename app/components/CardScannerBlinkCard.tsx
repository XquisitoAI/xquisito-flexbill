"use client";

import { Loader, X, Keyboard, Camera } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import * as BlinkCardSDK from "@microblink/blinkcard-in-browser-sdk";

interface ScanResult {
  cardNumber: string;
  expiryDate: string;
  cardholderName: string;
}

interface CardScannerBlinkCardProps {
  onScanSuccess: (result: ScanResult) => void;
  onClose: () => void;
}

export default function CardScannerBlinkCard({
  onScanSuccess,
  onClose,
}: CardScannerBlinkCardProps) {
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [scanProgress, setScanProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const recognizerRef = useRef<any>(null);
  const recognizerRunnerRef = useRef<any>(null);
  const cameraFeedRef = useRef<any>(null);

  useEffect(() => {
    initializeBlinkCard();
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = async () => {
    try {
      if (cameraFeedRef.current) {
        await cameraFeedRef.current.releaseVideoFeed();
        cameraFeedRef.current = null;
      }
      if (recognizerRunnerRef.current) {
        await recognizerRunnerRef.current.delete();
        recognizerRunnerRef.current = null;
      }
      if (recognizerRef.current) {
        await recognizerRef.current.delete();
        recognizerRef.current = null;
      }
    } catch (err) {
      console.error("Error during cleanup:", err);
    }
  };

  const initializeBlinkCard = async () => {
    try {
      setIsInitializing(true);
      setError(null);

      // First, check camera permissions BEFORE initializing BlinkCard
      console.log("📹 Verificando permisos de cámara...");

      let testStream: MediaStream | null = null;
      let retries = 3;
      let lastError: any = null;

      for (let i = 0; i < retries; i++) {
        try {
          console.log(
            `📹 Intento ${i + 1}/${retries} de acceder a la cámara...`
          );

          testStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "environment",
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
          });

          console.log("✅ Permisos de cámara otorgados");
          // Stop test stream immediately and wait a bit
          testStream.getTracks().forEach((track) => track.stop());
          await new Promise((resolve) => setTimeout(resolve, 500));
          break; // Success, exit loop
        } catch (permError: any) {
          console.error(
            `❌ Error en intento ${i + 1}:`,
            permError.name,
            permError.message
          );
          lastError = permError;

          // If it's a permission error, don't retry
          if (
            permError.name === "NotAllowedError" ||
            permError.name === "NotFoundError"
          ) {
            break;
          }

          // For NotReadableError, wait before retry
          if (i < retries - 1) {
            console.log("⏳ Esperando 1 segundo antes de reintentar...");
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      }

      if (lastError) {
        console.error(
          "❌ Error de permisos de cámara después de todos los intentos:",
          lastError
        );
        if (lastError.name === "NotAllowedError") {
          setError(
            "Permiso de cámara denegado. Por favor, permite el acceso a la cámara en tu navegador."
          );
        } else if (lastError.name === "NotFoundError") {
          setError("No se encontró ninguna cámara en tu dispositivo.");
        } else if (lastError.name === "NotReadableError") {
          setError(
            "La cámara está siendo usada por otra aplicación. Por favor, cierra otras aplicaciones que estén usando la cámara (como Zoom, Teams, o navegadores) e intenta de nuevo."
          );
        } else {
          setError(`Error al acceder a la cámara: ${lastError.message}`);
        }
        setIsInitializing(false);
        return;
      }

      const licenseKey = process.env.NEXT_PUBLIC_BLINKCARD_LICENSE_KEY;

      if (!licenseKey) {
        setError(
          "BlinkCard license key no configurada. Agrégala en .env.local como NEXT_PUBLIC_BLINKCARD_LICENSE_KEY"
        );
        setIsInitializing(false);
        return;
      }

      console.log("🔧 Inicializando BlinkCard SDK...");

      // Load WASM module
      const loadSettings = new BlinkCardSDK.WasmSDKLoadSettings(licenseKey);

      // Set resource paths - use local public folder
      loadSettings.engineLocation = "/blinkcard/";
      loadSettings.workerLocation = "/blinkcard/BlinkCardWasmSDK.worker.min.js";

      const wasmSDK = await BlinkCardSDK.loadWasmModule(loadSettings);

      console.log("✅ BlinkCard WASM loaded");

      // Create recognizer
      recognizerRef.current =
        await BlinkCardSDK.createBlinkCardRecognizer(wasmSDK);

      // Configure recognizer settings
      const recognizerSettings = await recognizerRef.current.currentSettings();
      recognizerSettings.extractCvv = false; // CVV no debe extraerse por seguridad
      recognizerSettings.extractOwner = true;
      recognizerSettings.extractValidThru = true;
      await recognizerRef.current.updateSettings(recognizerSettings);

      console.log("✅ BlinkCard recognizer configured");

      // Create recognizer runner
      recognizerRunnerRef.current = await BlinkCardSDK.createRecognizerRunner(
        wasmSDK,
        [recognizerRef.current],
        false // allowMultipleResults
      );

      console.log("✅ BlinkCard recognizer runner created");

      setIsInitializing(false);

      // Wait for next tick to ensure video element is fully mounted in DOM
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Start scanning immediately
      await startScanning();
    } catch (err) {
      console.error("❌ Error initializing BlinkCard:", err);

      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";

      if (
        errorMessage.includes("license") ||
        errorMessage.includes("License")
      ) {
        setError(
          "Licencia de BlinkCard inválida o expirada. Verifica tu license key en Microblink Developer Hub."
        );
      } else if (
        errorMessage.includes("network") ||
        errorMessage.includes("fetch")
      ) {
        setError(
          "Error de red al cargar BlinkCard. Verifica tu conexión a internet."
        );
      } else {
        setError(`Error al inicializar BlinkCard: ${errorMessage}`);
      }

      setIsInitializing(false);
    }
  };

  const startScanning = async () => {
    try {
      if (!videoRef.current || !recognizerRunnerRef.current) {
        console.error("❌ Video ref o recognizer runner no disponibles");
        setError("Error: SDK no está inicializado correctamente");
        return;
      }

      // Ensure video element is in the DOM and ready
      if (!document.body.contains(videoRef.current)) {
        console.error("❌ Video element no está en el DOM");
        setError("Error: Elemento de video no disponible");
        return;
      }

      setIsScanning(true);
      setError(null);
      setScanProgress(0);

      console.log("📹 Iniciando reconocimiento con BlinkCard...");
      console.log("📹 Video element:", videoRef.current);
      console.log("📹 Video element readyState:", videoRef.current.readyState);
      console.log("📹 RecognizerRunner:", recognizerRunnerRef.current);

      // Create camera feed with BlinkCard - use default camera settings
      cameraFeedRef.current =
        await BlinkCardSDK.VideoRecognizer.createVideoRecognizerFromCameraStream(
          videoRef.current,
          recognizerRunnerRef.current
        );

      console.log("✅ VideoRecognizer creado exitosamente");

      // Set up event callbacks
      const eventCallback = (event: BlinkCardSDK.RecognizerResultState) => {
        if (event === BlinkCardSDK.RecognizerResultState.Valid) {
          console.log("✅ Tarjeta detectada, procesando...");
          handleRecognitionResult();
        }
      };

      // Start recognition with callback
      await cameraFeedRef.current.startRecognition(eventCallback);

      console.log("✅ Cámara iniciada con BlinkCard, esperando tarjeta...");
    } catch (err) {
      console.error("❌ Error starting camera:", err);
      console.error(
        "❌ Error completo:",
        JSON.stringify(err, Object.getOwnPropertyNames(err))
      );

      const errorMessage = err instanceof Error ? err.message : String(err);

      if (
        errorMessage.includes("Permission") ||
        errorMessage.includes("permission") ||
        errorMessage.includes("NotAllowedError")
      ) {
        setError(
          "Permiso de cámara denegado. Por favor, permite el acceso a la cámara en tu navegador."
        );
      } else if (
        errorMessage.includes("Camera not found") ||
        errorMessage.includes("NotFoundError")
      ) {
        setError(
          "No se encontró ninguna cámara en tu dispositivo. Asegúrate de que tu dispositivo tenga una cámara disponible."
        );
      } else if (errorMessage.includes("NotReadableError")) {
        setError(
          "La cámara está siendo usada por otra aplicación. Cierra otras apps que usen la cámara."
        );
      } else if (
        errorMessage.includes("HTTPS") ||
        errorMessage.includes("secure")
      ) {
        setError(
          "Se requiere HTTPS para acceder a la cámara (excepto en localhost)."
        );
      } else {
        setError(
          `Error al acceder a la cámara: ${errorMessage}. Por favor, verifica que la cámara esté disponible.`
        );
      }

      setIsScanning(false);
    }
  };

  const handleRecognitionResult = async () => {
    try {
      if (!recognizerRef.current) {
        console.error("❌ Recognizer no disponible");
        return;
      }

      const result = await recognizerRef.current.getResult();

      if (
        !result ||
        result.state !== BlinkCardSDK.RecognizerResultState.Valid
      ) {
        console.warn("⚠️ Resultado inválido:", result);
        setError("No se pudo leer la tarjeta. Intenta de nuevo.");
        return;
      }

      console.log("📦 Resultado raw de BlinkCard:", result);

      // Extract card data
      const cardNumber = result.cardNumber || "";
      const owner = result.owner || "";
      const validThru = result.validThru || null;

      // Format expiry date from BlinkCard format
      let expiryDate = "";
      if (validThru && validThru.month && validThru.year) {
        const month = String(validThru.month).padStart(2, "0");
        const year = String(validThru.year).slice(-2); // Last 2 digits
        expiryDate = `${month}/${year}`;
      }

      console.log("📝 Datos extraídos:", {
        cardNumber,
        expiryDate,
        cardholderName: owner,
      });

      // Validate we have at least card number
      if (!cardNumber || cardNumber.length < 13) {
        console.warn("⚠️ Número de tarjeta inválido o incompleto");
        setError("Número de tarjeta incompleto. Intenta de nuevo.");
        return;
      }

      // Success! Stop camera and return results
      await cleanup();

      console.log("🎉 Escaneo exitoso con BlinkCard");

      onScanSuccess({
        cardNumber: cardNumber.replace(/\s/g, ""), // Remove spaces
        expiryDate,
        cardholderName: owner,
      });
    } catch (err) {
      console.error("❌ Error processing result:", err);
      setError("Error al procesar los datos de la tarjeta");
    }
  };

  const handleClose = async () => {
    await cleanup();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black" style={{ zIndex: 999 }}>
      {/* Video Preview */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/60 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white text-lg font-medium">Escanear Tarjeta</h2>
          </div>
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

      {/* Card Frame Guide */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-[320px] h-[200px]">
          {/* Frame corners */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />

          {/* Scanning animation */}
          {isScanning && !isInitializing && (
            <div className="absolute inset-0 border-4 border-green-500 rounded-lg animate-pulse" />
          )}
        </div>
      </div>

      {/* Manual Entry Button */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/60 to-transparent p-6">
        <div className="flex items-center justify-center">
          <button
            onClick={handleClose}
            className="bg-white/20 backdrop-blur text-white px-6 py-3 rounded-full transition-colors hover:bg-white/30 flex items-center gap-2 cursor-pointer"
            title="Ingresar manualmente"
          >
            <Keyboard className="size-5" />
            <span className="text-sm font-medium">Ingresar manualmente</span>
          </button>
        </div>
      </div>

      {/* Initializing Overlay */}
      {isInitializing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
          <div className="text-center">
            <Loader className="size-8 text-white animate-spin mx-auto mb-3" />
            <p className="text-white text-sm">Iniciando...</p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
          <div className="text-center px-6 max-w-md">
            <div className="bg-red-500/90 text-white p-6 rounded-lg">
              <p className="text-sm mb-4">{error}</p>

              <div className="flex gap-2 justify-center flex-wrap">
                <button
                  onClick={() => {
                    setError(null);
                    initializeBlinkCard();
                  }}
                  className="bg-white text-black px-6 py-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer font-medium"
                >
                  Reintentar
                </button>
                <button
                  onClick={handleClose}
                  className="bg-white/20 backdrop-blur text-white px-6 py-2 rounded-lg hover:bg-white/30 transition-colors cursor-pointer font-medium"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
