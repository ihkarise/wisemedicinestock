import React, { useState, useRef, useEffect, ReactNode } from "react";
import { StockItem } from "../types";
import { useStore } from "../store";
import { predictDaysRemaining } from "../utils";
import { ShoppingCart, Check, AlertTriangle, Info, Clock, Plus, Minus } from "lucide-react";
import { toast } from "sonner";

export const MedicineCard: React.FC<{ medicine: StockItem }> = ({ medicine }) => {
  const { dispenseMedicine, restockMedicine, toggleOrderList, state } = useStore();
  const [showMinus, setShowMinus] = useState(false);
  const [showPlus, setShowPlus] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const threshold = state.meta.reorderThreshold ?? 1;

  const isOrdered = state.orderList.includes(medicine.id);
  const prediction = predictDaysRemaining(
    medicine.currentQty,
    medicine.dispenseHistory,
    medicine.dispenseCount
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowMinus(false);
        setShowPlus(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getBorderColor = () => {
    if (medicine.currentQty === 0) return "border-[#ef4444]";
    if (medicine.currentQty <= threshold) return "border-[#eab308]";
    return "border-[#27272a] hover:border-[#3f3f46]";
  };

  const getQtyColor = () => {
    if (medicine.currentQty === 0) return "text-[#ef4444]";
    if (medicine.currentQty <= threshold) return "text-[#eab308]";
    return "text-[#22c55e]";
  };

  return (
    <div
      className={`relative bg-[#18181b] rounded-[20px] p-6 transition-colors duration-200 border w-full flex flex-col justify-between overflow-visible ${getBorderColor()}`}
    >
      <div className="flex flex-col gap-4 flex-1">
        {/* Info Section */}
        <div className="flex-1 flex flex-col">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h3
              className="text-[16px] font-bold text-[#fafafa] uppercase tracking-wide leading-tight"
              title={medicine.name}
            >
              {medicine.name}
            </h3>
            <span
              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                medicine.category === "MT"
                  ? "bg-[#1e1b4b] text-[#818cf8]"
                  : "bg-[#27272a] text-[#a1a1aa]"
              }`}
            >
              {medicine.potency === "Q" ? "Q/MT" : medicine.potency}
            </span>
          </div>
          <div className="text-[13px] text-[#71717a] font-medium flex-wrap flex items-center gap-3 mb-4">
            <span className="bg-[#09090b] px-2 py-1 rounded-md">{medicine.size}</span>
            <span className="uppercase tracking-widest text-[#a1a1aa]">{medicine.company}</span>
            <span className="text-[#e4e4e7] bg-[#27272a] px-2 py-1 rounded-md">₹{medicine.cost}</span>
          </div>

          {(prediction || medicine.dispenseCount > 0) && (
            <div className="flex flex-wrap items-center gap-3 mt-auto pt-4 border-t border-[#27272a]/50">
              {prediction && prediction.daysLeft < 30 && (
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full ${prediction.daysLeft === 0 ? "bg-[#7f1d1d] text-[#fca5a5]" : "bg-[#422006] text-[#fde047]"}`}>
                  <Clock size={12} />
                  {prediction.daysLeft === 0
                    ? "REORDER NOW"
                    : `~${prediction.daysLeft}D LEFT`}
                  {prediction.confidence === "low" && " (EST)"}
                </span>
              )}
              {medicine.dispenseCount > 0 && (
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#71717a]">
                  {medicine.dispenseCount} DISPENSES
                </span>
              )}
            </div>
          )}
        </div>

        {/* Controls Section */}
        <div className="flex items-center justify-between gap-4 mt-2 pt-4 border-t border-[#27272a]" ref={dropdownRef}>
          <div className="flex items-center gap-3">
            <div className="flex flex-col min-w-[40px]">
              <span className="text-[10px] font-bold text-[#71717a] uppercase tracking-widest mb-1">
                Stock
              </span>
              <span
                className={`text-[32px] font-extrabold leading-none transition-colors duration-300 ${getQtyColor()}`}
              >
                {medicine.currentQty}
              </span>
            </div>

            <div className="flex items-center gap-2 bg-[#09090b] rounded-[12px] p-1.5 border border-[#27272a]">
              <div className="relative">
                <button
                  disabled={medicine.currentQty === 0}
                  onClick={() => {
                    setShowMinus(!showMinus);
                    setShowPlus(false);
                  }}
                  className="w-10 h-10 flex justify-center items-center rounded-[8px] bg-[#18181b] text-[#fafafa] border border-[#27272a] disabled:opacity-30 hover:bg-[#27272a] hover:border-[#3f3f46] transition-colors"
                  aria-label="Dispense"
                >
                  <Minus size={18} />
                </button>
                {showMinus && (
                  <div className="absolute bottom-full left-0 mb-2 bg-[#18181b] border border-[#3f3f46] shadow-xl rounded-[12px] py-1 z-50 w-16 overflow-hidden">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        disabled={medicine.currentQty < num}
                        onClick={() => {
                          const newQty = medicine.currentQty - num;
                          dispenseMedicine(medicine.id, num);
                          if (newQty === 0) {
                            toast.error(`${medicine.name} is out of stock!`);
                          } else if (newQty <= threshold) {
                            toast.warning(`${medicine.name} stock is low! Only ${newQty} left.`);
                          }
                          setShowMinus(false);
                        }}
                        className="w-full text-center py-2 text-sm font-bold text-[#fafafa] hover:bg-[#27272a] disabled:opacity-20 transition-colors"
                      >
                        -{num}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => {
                    setShowPlus(!showPlus);
                    setShowMinus(false);
                  }}
                  className="w-10 h-10 flex justify-center items-center rounded-[8px] bg-[#18181b] text-[#fafafa] border border-[#27272a] hover:bg-[#27272a] hover:border-[#3f3f46] transition-colors"
                  aria-label="Restock"
                >
                  <Plus size={18} />
                </button>
                {showPlus && (
                  <div className="absolute bottom-full left-0 mb-2 bg-[#18181b] border border-[#3f3f46] shadow-xl rounded-[12px] py-1 z-50 w-16 overflow-hidden">
                    {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                      <button
                        key={num}
                        onClick={() => {
                          restockMedicine(medicine.id, num);
                          setShowPlus(false);
                        }}
                        className="w-full text-center py-2 text-sm font-bold text-[#fafafa] hover:bg-[#27272a] transition-colors"
                      >
                        +{num}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => toggleOrderList(medicine.id)}
            className={`flex items-center justify-center gap-2 h-12 px-4 rounded-[12px] text-xs font-bold uppercase tracking-wider transition-colors border ${
              isOrdered
                ? "bg-[#1e1b4b] text-[#818cf8] border-[#3730a3]"
                : "bg-[#27272a] text-[#fafafa] border-[#3f3f46] hover:bg-[#3f3f46]"
            }`}
          >
            {isOrdered ? (
              <>
                <Check size={16} />
                <span className="">Added</span>
              </>
            ) : (
              <>
                <ShoppingCart size={16} />
                <span className="">Order</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
