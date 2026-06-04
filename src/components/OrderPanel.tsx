import { useStore } from "../store";
import { Copy, FileDown, Trash2 } from "lucide-react";
import jsPDF from "jspdf";
import { formatSimpleDate } from "../utils";

export function OrderPanel() {
  const { state, toggleOrderList } = useStore();

  const orderItems = state.orderList
    .map((id) => state.stock[id])
    .filter(Boolean);

  // Group by company
  const grouped = orderItems.reduce((acc, item) => {
    const comp = item.company || "UNKNOWN";
    if (!acc[comp]) acc[comp] = [];
    acc[comp].push(item);
    return acc;
  }, {} as Record<string, typeof orderItems>);

  const sortedCompanies = Object.keys(grouped).sort();

  const handleCopy = () => {
    let text = `WISE HOMEOPATHY — ORDER LIST\n${new Date().toLocaleDateString("en-GB")}\n\n`;

    sortedCompanies.forEach((company) => {
      text += `${company} (${grouped[company].length}):\n`;
      grouped[company].forEach((item) => {
        const potencyLabel = item.potency === "Q" ? "Q/MT" : item.potency;
        text += `  ${item.name} — ${potencyLabel} (${item.size})\n`;
      });
      text += "\n";
    });

    text += `Total: ${orderItems.length} medicines`;

    navigator.clipboard.writeText(text);
    // Could add a toast here
  };

  const handlePdf = () => {
    const doc = new jsPDF();
    const dateStr = formatSimpleDate(Date.now());
    
    // Config
    const margin = 15;
    let y = 20;
    const pageHeight = doc.internal.pageSize.height;

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Wise Homeopathy — Medicine Order List", margin, y);
    y += 8;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString("en-GB")}`, margin, y);
    y += 15;

    sortedCompanies.forEach((company) => {
      if (y > pageHeight - 30) {
        doc.addPage();
        y = 20;
      }

      const items = grouped[company];
      
      // Company Header
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 95, 168); // Soft blue
      doc.setFontSize(12);
      doc.text(`${company} (${items.length})`, margin, y);
      y += 8;

      // Items
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      
      items.forEach((item) => {
        if (y > pageHeight - 20) {
          doc.addPage();
          y = 20;
        }

        const potencyLabel = item.potency === "Q" ? "Q/MT" : item.potency;
        const leftText = `${item.name} — ${potencyLabel} (${item.size})`;

        doc.text(leftText, margin + 5, y);
        y += 6;
      });
      y += 5;
    });

    // Footer
    doc.setFont("helvetica", "italic");
    doc.text(`Total: ${orderItems.length} medicines`, margin, y + 5);

    doc.save(`WiseHomeopathy_OrderList_${dateStr}.pdf`);
  };

  if (orderItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-[#18181b] rounded-[20px] border border-[#27272a]">
        <div className="w-16 h-16 bg-[#27272a] rounded-full flex items-center justify-center mb-6">
          <Copy className="text-[#a1a1aa]" size={28} />
        </div>
        <h3 className="text-xl font-bold text-[#fafafa] mb-2 uppercase tracking-wide">Your order list is empty</h3>
        <p className="text-[#71717a] font-medium max-w-sm">
          Click the "ORDER" button on any medicine card to add it to this list.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20 w-full">
      <div className="flex flex-col sm:flex-row items-center justify-between bg-[#18181b] p-6 rounded-[20px] border border-[#27272a] shadow-sm sticky top-4 z-10 gap-4">
        <div className="font-bold text-[24px] text-[#fafafa] uppercase tracking-wide flex items-center">
          <div className="w-3 h-3 rounded-full bg-[#3b82f6] mr-4 inline-block"></div>
          {orderItems.length} items to order
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={handleCopy}
            className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-5 py-3 bg-[#27272a] hover:bg-[#3f3f46] text-[#fafafa] rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border border-[#3f3f46]"
          >
            <Copy size={16} />
            <span>Copy List</span>
          </button>
          <button
            onClick={handlePdf}
            className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-5 py-3 bg-[#3b82f6] hover:bg-[#2563eb] text-[#ffffff] rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
          >
            <FileDown size={16} />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedCompanies.map((company) => (
          <div key={company} className="bg-[#18181b] rounded-[20px] border border-[#27272a] shadow-sm overflow-hidden flex flex-col h-full hover:border-[#3f3f46] transition-colors">
            <div className="bg-[#09090b] px-6 py-4 border-b border-[#27272a] flex justify-between items-center">
              <h3 className="font-bold text-[#fafafa] uppercase tracking-wider">
                {company} <span className="text-[#a1a1aa] font-semibold ml-2 bg-[#27272a] px-2 py-0.5 rounded-md text-[11px]">{grouped[company].length} ITEMS</span>
              </h3>
            </div>
            <div className="divide-y divide-[#27272a] flex-1">
              {grouped[company].map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 hover:bg-[#27272a]/30 transition-colors gap-4">
                  <div className="pr-4">
                    <div className="font-bold text-[#fafafa] uppercase tracking-wide text-sm">
                      {item.name}
                    </div>
                    <div className="text-[12px] text-[#a1a1aa] font-semibold mt-1.5 flex items-center gap-2 uppercase tracking-widest">
                      <span className={item.category === "MT" ? "text-[#818cf8]" : "text-[#d4d4d8]"}>{item.potency === "Q" ? "Q/MT" : item.potency}</span>
                      <span className="text-[#3f3f46]">|</span>
                      <span>{item.size}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                    <button
                      onClick={() => toggleOrderList(item.id)}
                      className="w-10 h-10 flex items-center justify-center text-[#71717a] border border-[#27272a] rounded-xl hover:text-[#ef4444] hover:bg-[#ef4444]/10 hover:border-[#ef4444]/50 transition-colors"
                      title="Remove from list"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
