/**
 * Sistema de caché para validación de restaurante/sucursal/mesa
 *
 * Evita llamadas repetidas al endpoint /validate durante la sesión,
 * mejorando significativamente el rendimiento (de ~1.5s a ~0ms en cache hit).
 *
 * Características:
 * - Almacena en sessionStorage (persiste en la sesión, se limpia al cerrar navegador)
 * - TTL configurable (por defecto 5 minutos)
 * - Clave única por combinación restaurante/sucursal/mesa/servicio
 */

const CACHE_PREFIX = "xquisito_validation_";
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutos

interface CachedValidation {
  valid: boolean;
  error?: string;
  timestamp: number;
  ttl: number;
}

/**
 * Genera la clave de caché única para una validación
 */
function getCacheKey(
  restaurantId: number,
  branchNumber: number,
  tableNumber: number,
  service?: string
): string {
  const base = `${CACHE_PREFIX}${restaurantId}_${branchNumber}_${tableNumber}`;
  return service ? `${base}_${service}` : base;
}

/**
 * Verifica si hay un resultado válido en caché
 */
export function getValidationFromCache(
  restaurantId: number,
  branchNumber: number,
  tableNumber: number,
  service?: string
): { valid: boolean; error?: string } | null {
  if (typeof window === "undefined") return null;

  try {
    const key = getCacheKey(restaurantId, branchNumber, tableNumber, service);
    const cached = sessionStorage.getItem(key);

    if (!cached) return null;

    const data: CachedValidation = JSON.parse(cached);
    const now = Date.now();

    // Verificar si el caché ha expirado
    if (now - data.timestamp > data.ttl) {
      sessionStorage.removeItem(key);
      console.log("🔄 Cache expired for validation:", key);
      return null;
    }

    console.log("✅ Cache hit for validation:", key);
    return {
      valid: data.valid,
      error: data.error,
    };
  } catch (error) {
    console.error("Error reading validation cache:", error);
    return null;
  }
}

/**
 * Guarda el resultado de validación en caché
 */
export function setValidationCache(
  restaurantId: number,
  branchNumber: number,
  tableNumber: number,
  result: { valid: boolean; error?: string },
  service?: string,
  ttlMs: number = DEFAULT_TTL_MS
): void {
  if (typeof window === "undefined") return;

  try {
    const key = getCacheKey(restaurantId, branchNumber, tableNumber, service);
    const data: CachedValidation = {
      valid: result.valid,
      error: result.error,
      timestamp: Date.now(),
      ttl: ttlMs,
    };

    sessionStorage.setItem(key, JSON.stringify(data));
    console.log("💾 Cached validation result:", key, result.valid ? "valid" : "invalid");
  } catch (error) {
    console.error("Error setting validation cache:", error);
  }
}

/**
 * Invalida el caché para una combinación específica
 * Útil cuando cambian los datos del restaurante/mesa
 */
export function invalidateValidationCache(
  restaurantId: number,
  branchNumber: number,
  tableNumber: number,
  service?: string
): void {
  if (typeof window === "undefined") return;

  try {
    const key = getCacheKey(restaurantId, branchNumber, tableNumber, service);
    sessionStorage.removeItem(key);
    console.log("🗑️ Invalidated validation cache:", key);
  } catch (error) {
    console.error("Error invalidating validation cache:", error);
  }
}

/**
 * Limpia todo el caché de validación
 * Útil al hacer logout o cambiar de restaurante
 */
export function clearAllValidationCache(): void {
  if (typeof window === "undefined") return;

  try {
    const keysToRemove: string[] = [];

    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => sessionStorage.removeItem(key));
    console.log("🧹 Cleared all validation cache:", keysToRemove.length, "entries");
  } catch (error) {
    console.error("Error clearing validation cache:", error);
  }
}
