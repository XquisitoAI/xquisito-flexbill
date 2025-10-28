// Type definitions for Dyneti DyScan SDK
declare global {
  interface Window {
    DyScanForms: {
      Form: new (config: DyScanFormConfig) => DyScanFormClient;
    };
    DyScan: {
      ScanView: new (config: DyScanScanViewConfig) => DyScanScanView;
      isAvailable: () => Promise<boolean>;
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

// Custom View Flow Types
export interface DyScanScanViewConfig {
  key: string;
  config: ScanConfig;
}

export interface ScanConfig {
  showExplanation?: boolean;
  showResult?: boolean;
  showCancelButton?: boolean;
  language?: string;
  [key: string]: any;
}

export interface ViewOptions {
  onSuccess?: (data: ScanData) => void;
  onError?: (error: ScanError) => void;
  onCancel?: () => void;
  onReady?: () => void;
}

export interface ScanData {
  cardNumber?: string;
  expiryMonth?: string;
  expiryYear?: string;
  cardholderName?: string;
  transactionId?: string;
  scanId?: string;
  payloadId?: string;
  status?: string;
  state?: string;
  scanResult?: {
    firstSix?: string;
    lastFour?: string;
    expirationDate?: string;
    cardholderName?: string;
  };
  [key: string]: any;
}

export interface ScanError {
  message: string;
  code?: string;
  [key: string]: any;
}

export interface AttachResult {
  data: ScanData | null;
  completed: boolean;
}

export interface DyScanScanView {
  attachToElement(
    userId: string,
    parentEl: HTMLElement,
    viewOptions: ViewOptions
  ): Promise<AttachResult>;
}

export {};
