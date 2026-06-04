import { useState, useMemo } from "react";
import { useStore } from "../store";
import { StockItem } from "../types";
import { MedicineCard } from "./MedicineCard";
import { Search, X, AlertCircle, RefreshCw, Plus, LogIn } from "lucide-react";
import { AddMedicineModal } from "./AddMedicineModal";
import { useGoogleSheetsSync } from "../hooks/useGoogleSheetsSync";

export function StockPanel() {
  const { state } = useStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "empty" | "mt" | "dil">("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const { syncing, syncData, needsAuth, handleLogin } = useGoogleSheetsSync();

  const medicines = Object.values(state.stock) as StockItem[];

  // Metrics
  const threshold = state.meta.reorderThreshold ?? 1;
  const total = medicines.length;
  const good = medicines.filter((m) => m.currentQty > threshold).length;
  const low = medicines.filter((m) => m.currentQty <= threshold && m.currentQty > 0).length;
  const empty = medicines.filter((m) => m.currentQty === 0).length;
  const inOrder = state.orderList.length;

  const handleSync = async () => {
    await syncData();
  };

  const filteredMedicines = useMemo(() => {
    let result = medicines;

    // Filter
    if (filter === "low") result = result.filter((m) => m.currentQty <= threshold && m.currentQty > 0);
    if (filter === "empty") result = result.filter((m) => m.currentQty === 0);
    if (filter === "mt") result = result.filter((m) => m.category === "MT");
    if (filter === "dil") result = result.filter((m) => m.category === "DIL");

    // Search
    if (search.trim()) {
      const queryWords = search.toLowerCase().trim().split(/\s+/);
      result = result.filter((m) => {
        const target = (m.name + " " + m.company + " " + m.potency).toLowerCase();
        return queryWords.every((word) => target.includes(word));
      });
    }

    // Sort: empty first, then low, then alphabetical
    result.sort((a, b) => {
        const aEmpty = a.currentQty === 0;
        const bEmpty = b.currentQty === 0;
        const aLow = a.currentQty > 0 && a.currentQty <= threshold;
        const bLow = b.currentQty > 0 && b.currentQty <= threshold;

        if (aEmpty && !bEmpty) return -1;
        if (bEmpty && !aEmpty) return 1;
        if (aLow && !bLow && !bEmpty) return -1;
        if (bLow && !aLow && !aEmpty) return 1;
        return a.name.localeCompare(b.name);
    });

    return result;
  }, [medicines, search, filter, threshold]);

  const displayedMedicines = filteredMedicines.slice(0, 100);

  return (
    <div className="space-y-4 pb-20 w-full">
      {/* Controls */}
      <div className="bg-[#18181b] p-6 rounded-[20px] border border-[#27272a] shadow-sm space-y-4 sticky top-4 z-20 hover:border-[#3f3f46] transition-colors">
        <div className="flex gap-4">
            <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a1a1aa]" size={20} />
            <input
                type="text"
                placeholder="Search medicines, companies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-10 py-3 bg-[#09090b] border border-[#27272a] rounded-xl focus:outline-none focus:border-[#3f3f46] text-[#fafafa] transition-colors font-medium placeholder-[#71717a]"
            />
            {search && (
                <button
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#71717a] hover:text-[#e4e4e7]"
                >
                <X size={20} />
                </button>
            )}
            </div>
            <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center justify-center px-6 bg-[#27272a] text-[#fafafa] font-bold rounded-xl hover:bg-[#3f3f46] transition-colors border border-[#3f3f46] whitespace-nowrap"
                title="Add New Medicine"
            >
                <Plus size={18} className="mr-2" />
                Add Medicine
            </button>
            {needsAuth ? (
              <button
                  onClick={handleLogin}
                  disabled={syncing}
                  className="flex items-center justify-center px-4 bg-white text-[#3c4043] font-medium rounded-xl hover:bg-[#f8f9fa] transition-colors whitespace-nowrap shadow-sm border border-[#dadce0]"
                  title="Sign in with Google to Sync"
              >
                  <div className="w-5 h-5 mr-3">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                        <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                  </div>
                  Sign in with Google
              </button>
            ) : (
              <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="flex items-center justify-center px-6 bg-[#3b82f6] text-white font-bold rounded-xl hover:bg-[#2563eb] transition-colors disabled:opacity-70 whitespace-nowrap"
                  title="Sync from Google Sheets"
              >
                  <RefreshCw size={18} className={`mr-2 ${syncing ? "animate-spin" : ""}`} />
                  Force Sync
              </button>
            )}
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-1 hide-scrollbar">
          {(["all", "low", "empty", "mt", "dil"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors border ${
                filter === f
                  ? "bg-[#fafafa] text-[#09090b] border-[#fafafa]"
                  : "bg-transparent text-[#a1a1aa] border-[#27272a] hover:border-[#3f3f46] hover:text-[#fafafa]"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Banners */}
      <div className="grid grid-cols-1 gap-4">
        {empty > 0 && (
          <div className="bg-[#18181b] text-[#ef4444] p-5 rounded-[20px] flex items-center gap-3 text-sm font-bold border border-[#ef4444]/30 hover:border-[#ef4444]/60 transition-colors">
            <AlertCircle size={20} className="shrink-0" />
            {empty} MEDICINES ARE COMPLETELY EMPTY
          </div>
        )}
        {low > 0 && empty === 0 && (
          <div className="bg-[#18181b] text-[#eab308] p-5 rounded-[20px] flex items-center gap-3 text-sm font-bold border border-[#eab308]/30 hover:border-[#eab308]/60 transition-colors">
            <AlertCircle size={20} className="shrink-0" />
            {low} MEDICINES ARE RUNNING LOW (≤ {threshold})
          </div>
        )}
      </div>

      {/* Stats Summary First Pass*/}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#18181b] p-6 rounded-[20px] border border-[#27272a] hover:border-[#3f3f46] transition-colors flex flex-col justify-between">
          <div className="text-[12px] uppercase tracking-[0.1em] text-[#a1a1aa] mb-3 font-semibold">Total Items</div>
          <div className="text-[48px] font-bold text-[#fafafa] leading-none">{total}</div>
        </div>
        <div className="bg-[#18181b] p-6 rounded-[20px] border border-[#27272a] hover:border-[#3f3f46] transition-colors flex flex-col justify-between">
          <div className="text-[12px] uppercase tracking-[0.1em] text-[#a1a1aa] mb-3 font-semibold text-[#22c55e]">Good (&gt;{threshold})</div>
          <div className="text-[48px] font-bold text-[#22c55e] leading-none">{good}</div>
        </div>
        <div className="bg-[#18181b] p-6 rounded-[20px] border border-[#27272a] hover:border-[#3f3f46] transition-colors flex flex-col justify-between">
          <div className="text-[12px] uppercase tracking-[0.1em] text-[#a1a1aa] mb-3 font-semibold text-[#eab308]">Low (≤{threshold})</div>
          <div className="text-[48px] font-bold text-[#eab308] leading-none">{low}</div>
        </div>
        <div className="bg-[#18181b] p-6 rounded-[20px] border border-[#27272a] hover:border-[#3f3f46] transition-colors flex flex-col justify-between">
          <div className="text-[12px] uppercase tracking-[0.1em] text-[#a1a1aa] mb-3 font-semibold text-[#ef4444]">Empty (qty 0)</div>
          <div className="text-[48px] font-bold text-[#ef4444] leading-none">{empty}</div>
        </div>
      </div>

      <div className="text-sm font-semibold text-[#71717a] uppercase tracking-wider pl-2 mt-2">
        Showing {displayedMedicines.length} {filteredMedicines.length > 100 && `of ${filteredMedicines.length}`} results
        {search && ` for "${search}"`}
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedMedicines.length === 0 ? (
          <div className="col-span-1 md:col-span-2 text-center py-20 text-[#71717a] bg-[#18181b] font-medium border border-dashed border-[#27272a] rounded-[20px]">
            NO MEDICINES FOUND MATCHING THE CURRENT FILTERS.
          </div>
        ) : (
          displayedMedicines.map((m) => (
            <MedicineCard key={m.id} medicine={m} />
          ))
        )}
        
        {filteredMedicines.length > 100 && (
          <div className="col-span-1 md:col-span-2 text-center py-8 text-[12px] uppercase tracking-wider font-semibold text-[#71717a]">
            Showing 100 of {filteredMedicines.length} — search to narrow down
          </div>
        )}
      </div>

      {showAddModal && <AddMedicineModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
