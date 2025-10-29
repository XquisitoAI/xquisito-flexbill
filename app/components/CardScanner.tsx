"use client";

import { Loader, X, Keyboard, Camera } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { createWorker } from 'tesseract.js';

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
  const [isScanning, setIsScanning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError(
        "No se pudo acceder a la cámara. Por favor, verifica los permisos."
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const preprocessImage = (
    context: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement
  ) => {
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Aumentar contraste y convertir a escala de grises
    for (let i = 0; i < data.length; i += 4) {
      // Calcular promedio de RGB para escala de grises
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;

      // Aumentar contraste con binarización adaptativa
      const threshold = 128;
      const value = avg > threshold ? 255 : 0;

      data[i] = value;     // R
      data[i + 1] = value; // G
      data[i + 2] = value; // B
    }

    context.putImageData(imageData, 0, 0);
  };

  const parseCardData = (text: string): ScanResult | null => {
    console.log("🔍 Texto extraído del OCR:", text);

    // Limpiar texto (eliminar saltos de línea múltiples)
    const cleanText = text.replace(/\n+/g, ' ').replace(/\s+/g, ' ');
    console.log("🧹 Texto limpio:", cleanText);

    // 1. Buscar número de tarjeta (16 dígitos, puede tener espacios)
    const cardNumberPatterns = [
      /\b(\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4})\b/,
      /\b(\d{16})\b/,
    ];

    let cardNumber = '';
    for (const pattern of cardNumberPatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        cardNumber = match[1].replace(/[\s\-]/g, '');
        break;
      }
    }

    // Validar con algoritmo de Luhn
    if (cardNumber && !isValidCardNumber(cardNumber)) {
      console.warn("⚠️ Número de tarjeta no válido (Luhn):", cardNumber);
      cardNumber = '';
    }

    // 2. Buscar fecha de expiración (MM/YY o MM/YYYY)
    const datePatterns = [
      /\b(\d{2})[\/\-\s](\d{2})\b/,
      /\b(\d{2})[\/\-\s](\d{4})\b/,
      /VALID\s*THRU[:\s]*(\d{2})[\/\-](\d{2})/i,
      /EXP[:\s]*(\d{2})[\/\-](\d{2})/i,
    ];

    let expiryDate = '';
    for (const pattern of datePatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        const month = match[1];
        let year = match[2];

        // Si es año completo, tomar últimos 2 dígitos
        if (year.length === 4) {
          year = year.substring(2);
        }

        expiryDate = `${month}/${year}`;
        break;
      }
    }

    // 3. Buscar nombre (palabras en mayúsculas, usualmente 2 o más palabras)
    const namePatterns = [
      /\b([A-Z]{2,}[\s]+[A-Z]{2,}(?:[\s]+[A-Z]{2,})?)\b/,
      /\b([A-Z][a-z]+[\s]+[A-Z][a-z]+)\b/,
    ];

    let cardholderName = '';
    for (const pattern of namePatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        cardholderName = match[1].trim();
        break;
      }
    }

    console.log("📝 Datos parseados:", {
      cardNumber,
      expiryDate,
      cardholderName,
    });

    // Retornar solo si al menos tenemos el número de tarjeta
    if (cardNumber) {
      return {
        cardNumber,
        expiryDate,
        cardholderName,
      };
    }

    return null;
  };

  // Algoritmo de Luhn para validar número de tarjeta
  const isValidCardNumber = (cardNumber: string): boolean => {
    const digits = cardNumber.replace(/\D/g, '');

    if (digits.length < 13 || digits.length > 19) {
      return false;
    }

    let sum = 0;
    let isEven = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  };

  const handleScan = async () => {
    if (!videoRef.current || !canvasRef.current) {
      setError("Error: Referencias de video o canvas no disponibles");
      return;
    }

    setIsScanning(true);
    setError(null);
    setOcrProgress(0);

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error("No se pudo obtener el contexto del canvas");
      }

      // Configurar tamaño del canvas
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;

      // Capturar frame del video
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Pre-procesar imagen
      preprocessImage(context, canvas);

      console.log("🎬 Frame capturado, iniciando OCR...");

      // Crear worker de Tesseract
      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.round(m.progress * 100));
          }
        },
      });

      // Configurar parámetros para mejorar precisión con tarjetas
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789/ ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        tessedit_pageseg_mode: 6 as any, // PSM 6: Asumir un bloque uniforme de texto
      });

      // Reconocer texto
      const { data: { text } } = await worker.recognize(canvas);
      await worker.terminate();

      console.log("✅ OCR completado");

      // Parsear resultados
      const cardData = parseCardData(text);

      if (cardData) {
        console.log("🎉 Tarjeta detectada exitosamente");
        onScanSuccess(cardData);
        stopCamera();
      } else {
        console.warn("⚠️ No se pudo leer la tarjeta");
        setError(
          "No se pudo leer la tarjeta. Asegúrate de que esté bien iluminada y enfocada. Intenta de nuevo."
        );
      }
    } catch (err) {
      console.error("❌ Error durante el escaneo:", err);
      setError(
        `Error al escanear: ${err instanceof Error ? err.message : 'Error desconocido'}`
      );
    } finally {
      setIsScanning(false);
      setOcrProgress(0);
    }
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

      {/* Canvas oculto para procesamiento */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header con botón de cerrar */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/60 to-transparent p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white text-lg font-medium">Escanear Tarjeta</h2>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-white hover:text-gray-300 transition-colors cursor-pointer"
          >
            <X className="size-6" />
          </button>
        </div>
        <p className="text-white/90 text-sm mt-2">
          Coloca tu tarjeta dentro del marco y presiona el botón para escanear
        </p>
      </div>

      {/* Card Frame Guide */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-[320px] h-[200px]">
          {/* Esquinas del marco */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />

          {/* Animación cuando está escaneando */}
          {isScanning && (
            <div className="absolute inset-0 border-4 border-green-500 rounded-lg animate-pulse" />
          )}
        </div>
      </div>

      {/* Botón de escanear en la parte inferior */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/60 to-transparent p-6">
        <div className="flex items-center gap-4">
          {/* Scan Button */}
          <button
            onClick={handleScan}
            disabled={isScanning}
            className="flex-1 bg-white text-black px-6 py-4 rounded-full transition-colors hover:bg-gray-100 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isScanning ? (
              <>
                <Loader className="size-5 animate-spin" />
                <span>Escaneando... {ocrProgress}%</span>
              </>
            ) : (
              <>
                <Camera className="size-6" />
                <span className="font-medium">Escanear Tarjeta</span>
              </>
            )}
          </button>

          {/* Manual Entry Button */}
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="bg-white/20 backdrop-blur text-white px-4 py-4 rounded-full transition-colors hover:bg-white/30 flex items-center justify-center cursor-pointer"
            title="Ingresar manualmente"
          >
            <Keyboard className="size-6" />
          </button>
        </div>
      </div>

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
          <div className="text-center px-6 max-w-md">
            <div className="bg-red-500/90 text-white p-6 rounded-lg">
              <p className="text-sm mb-4">{error}</p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => setError(null)}
                  className="bg-white text-black px-6 py-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer font-medium"
                >
                  Reintentar
                </button>
                <button
                  onClick={() => {
                    stopCamera();
                    onClose();
                  }}
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
