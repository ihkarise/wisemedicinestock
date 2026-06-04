export interface Medicine {
  id: string;
  name: string;
  size: string;
  potency: string;
  category: string;
  qty: number;
  company: string;
  cost: string;
}

export interface StockItem extends Omit<Medicine, 'qty'> {
  originalQty: number;
  currentQty: number;
  dispenseCount: number;
  dispenseHistory: number[]; // array of timestamps (Unix ms)
  restockHistory: { ts: number; amount: number }[];
  lastDispensed: number | null;
  addedToOrderAt: number | null;
}

export interface DispenseLogEntry {
  id: string; // unique log entry ID
  medicineId: string;
  name: string;
  potency: string;
  size: string;
  qty: number;
  remaining: number;
  ts: number;
  tsFormatted: string;
}

export interface AppState {
  stock: Record<string, StockItem>;
  orderList: string[]; // array of medicine IDs
  dispenseLog: DispenseLogEntry[];
  meta: {
    lastSynced: number | null;
    totalDispenses: number;
    appVersion: string;
    reorderThreshold?: number;
  };
  googleApiKey?: string;
}
