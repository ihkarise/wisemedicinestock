import React, { useRef, useState } from "react";
import { useStore } from "../store";
import { X, FileJson, FileSpreadsheet, Upload, AlertTriangle, FileUp } from "lucide-react";
import { formatSimpleDate } from "../utils";
import { AppState, Medicine, StockItem } from "../types";
import Papa from "papaparse";

export function ExportModal({ onClose }: { onClose: () => void }) {
  const { state, setFullState, setReorderThreshold, syncComplete } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputCSVRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(state.meta.reorderThreshold ?? 1);

  const handleSaveThreshold = (val: number) => {
    setThreshold(val);
    setReorderThreshold(val);
  };

  const exportJSON = () => {
    const dataStr = JSON.stringify({
      exportedAt: new Date().toISOString(),
      exportedBy: "Wise Homeopathy Stock Manager v2.0",
      totalMedicines: Object.keys(state.stock).length,
      ...state
    }, null, 2);
    
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `WiseStock_Backup_${formatSimpleDate(Date.now())}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const headers = [
      "ID", "Name", "Size", "Potency", "Category", 
      "OriginalQty", "CurrentQty", "Company", "Cost", 
      "DispenseCount", "LastDispensed", "InOrderList"
    ];

    const rows = (Object.values(state.stock) as StockItem[]).map(m => {
      return [
        m.id,
        `"${m.name}"`, // Quote to handle commas
        m.size,
        m.potency === "Q" ? "Q/MT" : m.potency,
        m.category,
        m.originalQty,
        m.currentQty,
        `"${m.company}"`,
        m.cost,
        m.dispenseCount,
        m.lastDispensed ? new Date(m.lastDispensed).toISOString() : "",
        state.orderList.includes(m.id) ? "Yes" : "No"
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `WiseStock_Backup_${formatSimpleDate(Date.now())}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        // Basic validation
        if (json && typeof json === 'object' && 'stock' in json) {
          if (confirm(`Warning: This will overwrite your current data with the backup from ${new Date(json.exportedAt || Date.now()).toLocaleDateString()}. Proceed?`)) {
            // Strip out the wrapper metadata if it's there, extract only AppState properties
            const newState: AppState = {
              stock: json.stock,
              orderList: json.orderList || [],
              dispenseLog: json.dispenseLog || [],
              meta: json.meta || { lastSynced: null, totalDispenses: 0, appVersion: "2.0" }
            };
            setFullState(newState);
            alert("Import successful!");
            onClose();
          }
        } else {
          setError("Invalid backup file format.");
        }
      } catch (err) {
        setError("Could not parse JSON file.");
      } finally {
        setImporting(false);
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const freshMedicines: Medicine[] = results.data.map((row: any, index: number) => {
            const name = row['Name'] || row['name'] || row['medicine'] || row['item'] || `Unknown item ${index}`;
            const qtyStr = row['Qty'] || row['qty'] || row['quantity'] || row['stock'] || row['CurrentQty'] || '0';
            const qty = parseInt(qtyStr, 10) || 0;
            const category = (row['Category'] || row['category'] || 'MT').toUpperCase();
            const potency = row['Potency'] || row['potency'] || 'Q';
            const size = row['Size'] || row['size'] || '100 ML';
            const company = row['Company'] || row['company'] || 'UNKNOWN';
            const cost = row['Cost'] || row['cost'] || row['price'] || '';
            const existingId = row['ID'] || row['id'];

            return {
                id: existingId || `CSV-${index}-${name.trim().replace(/\s+/g, '-')}`,
                name: name.toUpperCase(),
                category: category.includes('DIL') ? 'DIL' : 'MT',
                potency,
                size,
                company: company.toUpperCase(),
                cost,
                qty,
                originalQty: qty,
                currentQty: qty,
                dispenseCount: 0,
                dispenseHistory: [],
                restockHistory: [],
                lastDispensed: null,
                addedToOrderAt: null
            } as Medicine;
          }).filter((m: Medicine) => m.name !== '');

          if (freshMedicines.length > 0) {
             syncComplete(freshMedicines);
             alert(`Successfully imported/merged ${freshMedicines.length} medicines from CSV!`);
             onClose();
          } else {
             setError("No valid medicines found in CSV file.");
          }
        } catch (err) {
          setError("Error mapping CSV data.");
        } finally {
          setImporting(false);
        }
      },
      error: () => {
        setError("Could not parse CSV file.");
        setImporting(false);
      }
    });

    if (fileInputCSVRef.current) {
        fileInputCSVRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#18181b] rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden border border-[#27272a] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-[#27272a] bg-[#09090b]">
          <h3 className="font-extrabold text-[20px] text-[#fafafa] uppercase tracking-wide">Settings & Data</h3>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-[12px] text-[#71717a] hover:bg-[#27272a] hover:text-[#fafafa] transition-colors border border-transparent hover:border-[#3f3f46]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <h4 className="text-[12px] font-bold text-[#a1a1aa] uppercase tracking-widest">Backup & Export</h4>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={exportJSON}
                className="flex flex-col items-center justify-center gap-3 p-5 rounded-[20px] border border-[#27272a] bg-[#09090b] hover:bg-[#27272a] hover:border-[#3f3f46] transition-colors group"
              >
                <div className="w-12 h-12 rounded-[14px] bg-[#1e1b4b] text-[#818cf8] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileJson size={24} />
                </div>
                <span className="text-[13px] font-bold uppercase tracking-wider text-[#fafafa]">JSON Backup</span>
              </button>
              <button 
                onClick={exportCSV}
                className="flex flex-col items-center justify-center gap-3 p-5 rounded-[20px] border border-[#27272a] bg-[#09090b] hover:bg-[#27272a] hover:border-[#3f3f46] transition-colors group"
              >
                <div className="w-12 h-12 rounded-[14px] bg-[#064e3b] text-[#34d399] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileSpreadsheet size={24} />
                </div>
                <span className="text-[13px] font-bold uppercase tracking-wider text-[#fafafa]">CSV Export</span>
              </button>
            </div>
            <p className="text-[13px] text-[#71717a] font-medium text-center">
              JSON includes full history. CSV is for Excel.
            </p>
          </div>

          <div className="h-px bg-[#27272a] w-full" />

          <div className="space-y-4">
            <h4 className="text-[12px] font-bold text-[#a1a1aa] uppercase tracking-widest flex items-center justify-between">
              <span>App Preferences</span>
            </h4>
            <div className="flex items-center justify-between p-4 bg-[#09090b] border border-[#27272a] rounded-[16px]">
              <div>
                <div className="font-bold text-[#fafafa] text-[14px]">Reorder Threshold</div>
                <div className="text-[12px] text-[#71717a] mt-1">Highlight medicines when stock falls to this amount.</div>
              </div>
              <div className="flex items-center gap-2">
                 <input 
                    type="number"
                    min="1"
                    max="10"
                    value={threshold}
                    onChange={(e) => handleSaveThreshold(parseInt(e.target.value) || 1)}
                    className="w-16 px-2 py-2 bg-[#18181b] border border-[#3f3f46] rounded-lg text-center text-[#fafafa] font-bold focus:outline-none focus:border-[#3b82f6]"
                 />
              </div>
            </div>
          </div>

          <div className="h-px bg-[#27272a] w-full" />

          <div className="space-y-4">
            <h4 className="text-[12px] font-bold text-[#a1a1aa] uppercase tracking-widest">Restore Data</h4>
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-[16px] border border-dashed border-[#3f3f46] text-[#fafafa] bg-[#09090b] hover:bg-[#27272a] hover:border-[#a1a1aa] transition-colors disabled:opacity-50 group font-bold tracking-wide uppercase text-sm"
            >
              <Upload size={18} className="text-[#a1a1aa] group-hover:text-[#fafafa] transition-colors" />
              <span>Restore from JSON</span>
            </button>
            <input 
              type="file" 
              accept=".json"
              className="hidden" 
              ref={fileInputRef}
              onChange={handleImport}
            />

            <button 
              onClick={() => fileInputCSVRef.current?.click()}
              disabled={importing}
              className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-[16px] border border-[#27272a] text-[#fafafa] bg-[#18181b] hover:bg-[#27272a] hover:border-[#3f3f46] transition-colors disabled:opacity-50 group font-bold tracking-wide uppercase text-sm"
            >
              <FileUp size={18} className="text-[#34d399] group-hover:scale-110 transition-transform" />
              <span>Import / Merge CSV</span>
            </button>
            <input 
              type="file" 
              accept=".csv"
              className="hidden" 
              ref={fileInputCSVRef}
              onChange={handleImportCSV}
            />
            {error && (
              <div className="flex items-start gap-2 mt-3 text-sm font-bold text-[#ef4444] bg-[#7f1d1d]/20 border border-[#7f1d1d]/50 p-4 rounded-[12px]">
                <AlertTriangle size={18} className="shrink-0 text-[#ef4444]" />
                <p className="uppercase tracking-wide">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
