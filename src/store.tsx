import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { AppState, DispenseLogEntry, StockItem, Medicine } from "./types";
import { MASTER_DATA } from "./data";
import { formatDate } from "./utils";

const STORAGE_KEY = "wise_medicine_stock_v2";

interface AppContextType {
  state: AppState;
  dispenseMedicine: (id: string, amount: number) => void;
  restockMedicine: (id: string, amount: number) => void;
  toggleOrderList: (id: string) => void;
  clearLog: () => void;
  saveApiKey: (key: string) => void;
  setFullState: (newState: AppState) => void;
  syncComplete: (freshMedicines: Medicine[]) => void;
  setReorderThreshold: (threshold: number) => void;
  addMedicine: (medicine: Omit<Medicine, 'id'>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function initStore(): AppState {
  const saved = localStorage.getItem(STORAGE_KEY);
  let state: AppState = saved
    ? JSON.parse(saved)
    : {
        stock: {},
        orderList: [],
        dispenseLog: [],
        meta: { lastSynced: null, totalDispenses: 0, appVersion: "2.0", reorderThreshold: 1 },
      };

  // Merge with MASTER_DATA
  MASTER_DATA.forEach((m) => {
    if (!state.stock[m.id]) {
      state.stock[m.id] = {
        ...m,
        originalQty: m.qty,
        currentQty: m.qty,
        dispenseCount: 0,
        dispenseHistory: [],
        restockHistory: [],
        lastDispensed: null,
        addedToOrderAt: null,
      };
    }
  });

  return state;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initStore);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const dispenseMedicine = (id: string, amount: number) => {
    setState((prev) => {
      const stockItem = prev.stock[id];
      if (!stockItem || stockItem.currentQty < amount) return prev;

      const newQty = stockItem.currentQty - amount;
      const now = Date.now();

      const logEntry: DispenseLogEntry = {
        id: crypto.randomUUID(),
        medicineId: id,
        name: stockItem.name,
        potency: stockItem.potency,
        size: stockItem.size,
        qty: amount,
        remaining: newQty,
        ts: now,
        tsFormatted: formatDate(now),
      };

      return {
        ...prev,
        stock: {
          ...prev.stock,
          [id]: {
            ...stockItem,
            currentQty: newQty,
            dispenseCount: stockItem.dispenseCount + amount,
            dispenseHistory: [...stockItem.dispenseHistory, now],
            lastDispensed: now,
          },
        },
        dispenseLog: [logEntry, ...prev.dispenseLog].slice(0, 60),
        meta: {
          ...prev.meta,
          totalDispenses: prev.meta.totalDispenses + amount,
        },
      };
    });
  };

  const restockMedicine = (id: string, amount: number) => {
    setState((prev) => {
      const stockItem = prev.stock[id];
      if (!stockItem) return prev;

      const now = Date.now();

      return {
        ...prev,
        stock: {
          ...prev.stock,
          [id]: {
            ...stockItem,
            currentQty: stockItem.currentQty + amount,
            restockHistory: [
              ...stockItem.restockHistory,
              { ts: now, amount },
            ],
          },
        },
      };
    });
  };

  const toggleOrderList = (id: string) => {
    setState((prev) => {
      const isOrdered = prev.orderList.includes(id);
      const newOrderList = isOrdered
        ? prev.orderList.filter((x) => x !== id)
        : [...prev.orderList, id];
        
      const now = Date.now();

      return {
        ...prev,
        orderList: newOrderList,
        stock: {
          ...prev.stock,
          [id]: {
            ...prev.stock[id],
            addedToOrderAt: isOrdered ? null : now,
          },
        },
      };
    });
  };

  const clearLog = () => {
    setState((prev) => ({ ...prev, dispenseLog: [] }));
  };

  const saveApiKey = (key: string) => {
    setState((prev) => ({ ...prev, googleApiKey: key }));
  };

  const setFullState = (newState: AppState) => {
    setState(newState);
  };
  
  const setReorderThreshold = (threshold: number) => {
    setState(prev => ({
      ...prev,
      meta: { ...prev.meta, reorderThreshold: threshold }
    }));
  };

  const addMedicine = (medicineDetails: Omit<Medicine, 'id'>) => {
    setState(prev => {
      const id = `MANUAL-${Date.now()}`;
      return {
        ...prev,
        stock: {
          ...prev.stock,
          [id]: {
            ...medicineDetails,
            id,
            originalQty: medicineDetails.qty,
            currentQty: medicineDetails.qty,
            dispenseCount: 0,
            dispenseHistory: [],
            restockHistory: [],
            lastDispensed: null,
            addedToOrderAt: null
          }
        }
      };
    });
  };

  const syncComplete = (freshMedicines: Medicine[]) => {
      setState(prev => {
          const nextState = { ...prev };
          const now = Date.now();
          freshMedicines.forEach((m) => {
            const k = m.id;
            if (!nextState.stock[k]) {
              nextState.stock[k] = {
                ...m,
                originalQty: m.qty,
                currentQty: m.qty,
                dispenseCount: 0,
                dispenseHistory: [],
                restockHistory: [],
                lastDispensed: null,
                addedToOrderAt: null,
              };
            } else {
              nextState.stock[k] = {
                  ...nextState.stock[k],
                  company: m.company,
                  cost: m.cost,
                  originalQty: m.qty,
                  // explicitly DO NOT overwrite currentQty
              }
            }
          });
          nextState.meta.lastSynced = now;
          return nextState;
      });
  };

  return (
    <AppContext.Provider
      value={{
        state,
        dispenseMedicine,
        restockMedicine,
        toggleOrderList,
        clearLog,
        saveApiKey,
        setFullState,
        syncComplete,
        setReorderThreshold,
        addMedicine
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useStore() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useStore must be used within an AppProvider");
  }
  return context;
}
