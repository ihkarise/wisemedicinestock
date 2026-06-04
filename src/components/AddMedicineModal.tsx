import React, { useState } from "react";
import { useStore } from "../store";
import { X, Save } from "lucide-react";

export function AddMedicineModal({ onClose }: { onClose: () => void }) {
  const { addMedicine } = useStore();
  const [formData, setFormData] = useState({
    name: "",
    size: "100 ML",
    potency: "Q",
    category: "MT",
    qty: 1,
    company: "BAKSON",
    cost: "200"
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "qty" ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    addMedicine({
      name: formData.name.toUpperCase(),
      size: formData.size,
      potency: formData.potency,
      category: formData.category,
      qty: formData.qty,
      company: formData.company.toUpperCase(),
      cost: formData.cost
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#18181b] rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden border border-[#27272a] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-[#27272a] bg-[#09090b]">
          <h3 className="font-extrabold text-[20px] text-[#fafafa] uppercase tracking-wide">Add Medicine</h3>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-[12px] text-[#71717a] hover:bg-[#27272a] hover:text-[#fafafa] transition-colors border border-transparent hover:border-[#3f3f46]"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-[#a1a1aa] uppercase tracking-widest">Name</label>
            <input 
              required
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. ARNICA MONTANA"
              className="w-full px-4 py-3 bg-[#09090b] border border-[#27272a] rounded-xl focus:outline-none focus:border-[#3b82f6] text-[#fafafa] transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-[#a1a1aa] uppercase tracking-widest">Category</label>
              <select name="category" value={formData.category} onChange={handleChange} className="w-full px-4 py-3 bg-[#09090b] border border-[#27272a] rounded-xl focus:outline-none focus:border-[#3b82f6] text-[#fafafa] transition-colors">
                <option value="MT">MT (Mother Tincture)</option>
                <option value="DIL">DIL (Dilution)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-[#a1a1aa] uppercase tracking-widest">Potency</label>
              <input name="potency" value={formData.potency} onChange={handleChange} placeholder="e.g. Q, 30, 200" className="w-full px-4 py-3 bg-[#09090b] border border-[#27272a] rounded-xl focus:outline-none focus:border-[#3b82f6] text-[#fafafa] transition-colors" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-[#a1a1aa] uppercase tracking-widest">Size</label>
              <input name="size" value={formData.size} onChange={handleChange} placeholder="e.g. 100 ML" className="w-full px-4 py-3 bg-[#09090b] border border-[#27272a] rounded-xl focus:outline-none focus:border-[#3b82f6] text-[#fafafa] transition-colors" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-[#a1a1aa] uppercase tracking-widest">Company</label>
              <input name="company" value={formData.company} onChange={handleChange} placeholder="e.g. BAKSON" className="w-full px-4 py-3 bg-[#09090b] border border-[#27272a] rounded-xl focus:outline-none focus:border-[#3b82f6] text-[#fafafa] transition-colors" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-[#a1a1aa] uppercase tracking-widest">Initial Qty</label>
              <input type="number" min="0" name="qty" value={formData.qty} onChange={handleChange} className="w-full px-4 py-3 bg-[#09090b] border border-[#27272a] rounded-xl focus:outline-none focus:border-[#3b82f6] text-[#fafafa] transition-colors" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-[#a1a1aa] uppercase tracking-widest">Cost (₹)</label>
              <input name="cost" value={formData.cost} onChange={handleChange} placeholder="e.g. 200" className="w-full px-4 py-3 bg-[#09090b] border border-[#27272a] rounded-xl focus:outline-none focus:border-[#3b82f6] text-[#fafafa] transition-colors" />
            </div>
          </div>

          <div className="pt-4">
            <button type="submit" className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-[16px] font-bold uppercase tracking-wider text-sm transition-colors">
              <Save size={18} />
              Save Medicine
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
