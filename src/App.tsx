import { useState } from "react";
import { AppProvider, useStore } from "./store";
import { StockPanel } from "./components/StockPanel";
import { OrderPanel } from "./components/OrderPanel";
import { LogPanel } from "./components/LogPanel";
import { ExportModal } from "./components/ExportModal";
import { Settings } from "lucide-react";
import { Toaster } from "sonner";

function MainContent() {
  const { state } = useStore();
  const [activeTab, setActiveTab] = useState<"stock" | "order" | "log">("stock");
  const [showExportModal, setShowExportModal] = useState(false);

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] flex justify-center p-4 md:p-6 font-sans">
      <div className="w-full max-w-6xl flex flex-col gap-4">
        
        {/* Header Section */}
        <header className="bg-[#18181b] border border-[#27272a] rounded-[20px] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:border-[#3f3f46] z-30">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <h1 className="text-[20px] font-extrabold m-0 tracking-tight">
               WISE<span className="text-[#3b82f6]">HOMEOPATHY</span>.v2
            </h1>
            <div className="flex gap-3">
              <div className="bg-[#27272a] px-3 py-1.5 rounded-full text-[12px] text-[#e4e4e7] flex items-center font-medium">
                <span className="w-2 h-2 rounded-full bg-[#22c55e] inline-block mr-2"></span>
                System Active
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <nav className="flex bg-[#27272a] p-1 rounded-full border border-[#3f3f46]">
              <button
                onClick={() => setActiveTab("stock")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
                  activeTab === "stock" ? "bg-[#3b82f6] text-white" : "text-[#a1a1aa] hover:text-[#fafafa]"
                }`}
              >
                Stock
              </button>
              <button
                onClick={() => setActiveTab("order")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
                  activeTab === "order" ? "bg-[#3b82f6] text-white" : "text-[#a1a1aa] hover:text-[#fafafa]"
                }`}
              >
                Order ({state.orderList.length})
              </button>
              <button
                onClick={() => setActiveTab("log")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
                  activeTab === "log" ? "bg-[#3b82f6] text-white" : "text-[#a1a1aa] hover:text-[#fafafa]"
                }`}
              >
                Log
              </button>
            </nav>

            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.15)] border border-[rgba(255,255,255,0.2)] rounded-full text-xs font-bold transition-colors text-white"
            >
              <Settings size={14} />
              Export
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 w-full relative">
          {activeTab === "stock" && <StockPanel />}
          {activeTab === "order" && <OrderPanel />}
          {activeTab === "log" && <LogPanel />}
        </main>
      </div>

      {showExportModal && <ExportModal onClose={() => setShowExportModal(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainContent />
      <Toaster theme="dark" position="bottom-right" />
    </AppProvider>
  );
}
