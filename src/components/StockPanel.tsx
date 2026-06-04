import { useState, useMemo } from "react";
import { useStore } from "../store";
import { StockItem } from "../types";
import { MedicineCard } from "./MedicineCard";
import { Search, X, AlertCircle, RefreshCw, Plus } from "lucide-react";
import { AddMedicineModal } from "./AddMedicineModal";
import { useGoogleSheetsSync } from "../hooks/useGoogleSheetsSync";

export function StockPanel() {
  const { state } = useStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "empty" | "mt" | "dil">("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const { syncing, syncData, error } = useGoogleSheetsSync();

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

    if (filter === "low") result = result.filter((m) => m.currentQty <= threshold && m.currentQty > 0);
    if (filter === "empty") result = result.filter((m) => m.currentQty === 0);
    if (filter === "mt") result = result.filter((m) => m.category === "MT");
    if (filter === "dil") result = result.filter((m) => m.category === "DIL");

    if (search.trim()) {
      const queryWords = search.toLowerCase().trim().split(/\s+/);
      result = result.filter((m) => {
        const target = (m.name + " " + m.company + " " + m.potency).toLowerCase();
        return queryWords.every((word) => target.includes(word));
      });
    }

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
  }, [medicines, filter, search, threshold]);

  return (
    <div className="flex flex-col gap-4">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Items", value: total, color: "text-[#fafafa]" },
          { label: "Good Stock", value: good, color: "text-[#22c55e]" },
          { label: "Low Stock", value: low, color: "text-[#eab308]" },
          { label: "Out of Stock", value: empty, color: "text-[#ef4444]" },
        ].map((m) => (
          <div
            key={m.label}
            className="bg-[#18181b] border border-[#27272a] rounded-[16px] p-4 flex flex-col gap-1"
          >
            <span className="text-[11px] text-[#71717a] uppercase tracking-widest font-semibold">{m.label}</span>
            <span className={`text-3xl font-black ${m.color}`}>{m.value}</span>
          </div>
        ))}
      </div>

      {/* Sync Error Banner */}
      {error && (
        <div className="bg-[#7f1d1d]/30 border border-[#ef4444]/40 rounded-[12px] px-4 py-3 flex items-start gap-3">
          <AlertCircle className="text-[#ef4444] mt-0.5 shrink-0" size={16} />
          <p className="text-[13px] text-[#fca5a5]">
            <span className="font-bold">Sync failed:</span> {error}
          </p>
        </div>
      )}

      {/* Search & Controls */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-[20px] p-4 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search medicines..."
              className="w-full bg-[#27272a] border border-[#3f3f46] rounded-full pl-9 pr-9 py-2 text-[13px] text-[#fafafa] placeholder-[#52525b] focus:outline-none focus:border-[#3b82f6] transition-colors"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717a] hover:text-[#fafafa]">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 bg-[#27272a] hover:bg-[#3f3f46] border border-[#3f3f46] rounded-full px-4 py-2 text-[12px] font-semibold text-[#e4e4e7] transition-colors disabled:opacity-50"
            >
              <RefreshCw size={13} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Syncing…" : "Sync Sheet"}
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-[#3b82f6] hover:bg-[#2563eb] rounded-full px-4 py-2 text-[12px] font-semibold text-white transition-colors"
            >
              <Plus size={13} />
              Add
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {(["all", "low", "empty", "mt", "dil"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors ${
                filter === f
                  ? "bg-[#3b82f6] text-white"
                  : "bg-[#27272a] text-[#a1a1aa] hover:text-[#fafafa]"
              }`}
            >
              {f === "all" ? `All (${total})` : f === "low" ? `Low (${low})` : f === "empty" ? `Empty (${empty})` : f.toUpperCase()}
            </button>
          ))}
          {inOrder > 0 && (
            <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#1d4ed8]/20 text-[#93c5fd] border border-[#1d4ed8]/30">
              {inOrder} in order
            </span>
          )}
        </div>
      </div>

      {/* Medicine Grid */}
      {filteredMedicines.length === 0 ? (
        <div className="bg-[#18181b] border border-[#27272a] rounded-[20px] p-12 text-center">
          <AlertCircle size={32} className="text-[#52525b] mx-auto mb-3" />
          <p className="text-[#71717a] text-[14px]">
            {search ? `No medicines matching "${search}"` : "No medicines in this category."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredMedicines.map((m) => (
            <MedicineCard key={m.id} item={m} />
          ))}
        </div>
      )}

      {showAddModal && <AddMedicineModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
