import { useStore } from "../store";
import { Trash2, History } from "lucide-react";

export function LogPanel() {
  const { state, clearLog } = useStore();

  const handleClear = () => {
    if (confirm("Are you sure you want to clear all dispense history? This cannot be undone.")) {
      clearLog();
    }
  };

  if (state.dispenseLog.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-[#18181b] rounded-[20px] border border-[#27272a] w-full">
        <div className="w-16 h-16 bg-[#27272a] rounded-full flex items-center justify-center mb-6">
          <History className="text-[#a1a1aa]" size={28} />
        </div>
        <h3 className="text-xl font-bold text-[#fafafa] mb-2 uppercase tracking-wide">NO HISTORY YET</h3>
        <p className="text-[#71717a] font-medium max-w-sm">
          When you dispense medicines, the events will appear here chronologically.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20 w-full">
      <div className="bg-[#18181b] rounded-[20px] border border-[#27272a] shadow-sm overflow-hidden flex flex-col hover:border-[#3f3f46] transition-colors">
        
        <div className="bg-[#09090b] px-6 py-5 border-b border-[#27272a] flex justify-between items-center sm:sticky sm:top-4 z-10">
            <h3 className="font-bold text-[#fafafa] uppercase tracking-wider text-lg">
                Recent Dispenses
            </h3>
            <button
                onClick={handleClear}
                className="flex items-center gap-2 px-4 py-2 bg-[#27272a] hover:bg-[#ef4444]/20 border border-[#27272a] hover:border-[#ef4444]/50 rounded-xl text-xs font-bold uppercase tracking-wider text-[#ef4444] transition-colors"
            >
                <Trash2 size={16} />
                <span className="hidden sm:inline">Clear Log</span>
            </button>
        </div>

        <div className="divide-y divide-[#27272a] p-2">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-[#27272a] text-[#a1a1aa] text-[11px] font-bold uppercase tracking-widest bg-[#18181b]">
                        <th className="py-4 px-4 hidden md:table-cell">TIMESTAMP</th>
                        <th className="py-4 px-4">MEDICINE</th>
                        <th className="py-4 px-4 text-right">DISPENSED</th>
                        <th className="py-4 px-4 text-right">REMAINING</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a]/50">
                {state.dispenseLog.map((log) => (
                    <tr key={log.id} className="hover:bg-[#27272a]/30 transition-colors text-sm">
                        <td className="py-4 px-4 text-[#71717a] font-medium hidden md:table-cell">
                            {log.tsFormatted}
                        </td>
                        <td className="py-4 px-4">
                            <div className="font-bold text-[#fafafa] uppercase tracking-wide">
                                {log.name}
                            </div>
                            <div className="text-[11px] text-[#a1a1aa] font-semibold mt-1 uppercase tracking-widest flex items-center md:hidden pb-1 border-b border-[#27272a]/50 mb-1">
                                {log.tsFormatted.split(',')[0]}
                            </div>
                            <div className="text-[11px] text-[#71717a] font-semibold flex items-center gap-2 uppercase tracking-widest">
                                <span className={log.potency === "Q" ? "text-[#818cf8]" : "text-[#d4d4d8]"}>{log.potency === "Q" ? "Q/MT" : log.potency}</span>
                                <span className="text-[#3f3f46]">|</span>
                                <span>{log.size}</span>
                            </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                            <span className="inline-flex items-center bg-[#27272a] text-[#fafafa] font-bold px-3 py-1.5 rounded-lg border border-[#3f3f46] text-lg">
                                -{log.qty}
                            </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                            <span className={`font-extrabold text-xl ${log.remaining === 0 ? "text-[#ef4444]" : log.remaining === 1 ? "text-[#eab308]" : "text-[#22c55e]"}`}>
                                {log.remaining}
                            </span>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
      </div>
      
      {state.dispenseLog.length >= 60 && (
        <div className="text-center text-[12px] uppercase tracking-widest font-semibold text-[#71717a] py-6">
          Showing last 60 dispenses
        </div>
      )}
    </div>
  );
}
