// Type definitions for Dyneti DyScan SDK
declare global {
  interface Window {
    DyScanForms: {
      Form: new (config: DyScanFormConfig) => DyScanFormClient;
    };
  }
}

export interface DyScanFormConfig {
  apiKey: string;
  stateCallback?: (state: DyScanFormState) => void;
  onScanAction?: (startScan: () => void) => void;
  onScanComplete?: () => void;
  scanConfig?: {
    uiVersion?: string;
    showExplanation?: boolean;
    showResult?: boolean;
    showCancelButton?: boolean;
  };
}

export interface DyScanFormState {
  // State properties from Dyneti SDK
  [key: string]: any;
}

export interface DyScanFormClient {
  bindCollector(config: BindCollectorConfig): void;
  detachCollector(config: DetachCollectorConfig): void;
  destroy(): void;
}

export interface BindCollectorConfig {
  id: string;
  collectorType: "scan-view" | "scan-modal";
}

export interface DetachCollectorConfig {
  id: string;
}

export interface DyScanResult {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cardholderName?: string;
  cvv?: string;
}

export {};
