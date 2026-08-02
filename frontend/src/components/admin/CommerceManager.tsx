"use client";

import { useState, useMemo } from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { useStore } from "@/store/useStore";
import type { Product } from "@/components/commerce/ProductCard";
import { Save, Trash2, Pencil, Plus, Package, Star, Rocket, Zap, Cpu, Eye, X } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════
   X-CAPITAL — Commerce Manager (Admin)
   Full CRUD for the live product catalog. Changes persist instantly (store is
   persisted to localStorage) and show up on /commerce immediately — no DB
   migration, no redeploy, no server round-trip needed for the merchant rail.
   ═══════════════════════════════════════════════════════════════════════════ */

const EMPTY_PRODUCT: Product = {
  id: "",
  name: "",
  category: "EV",
  price: 0,
  imageUrl: "",
  imageAlt: "",
  description: "",
  tagline: "",
  badge: "",
  specs: {},
  features: [],
  affiliateUrl: "",
  investmentSuggestion: {
    symbol: "TSLA",
    name: "Tesla, Inc.",
    percentage: 5,
    amount: 0,
  },
};

const CATEGORY_META = [
  { key: "EV", label: "EV / Tesla", icon: Zap, accent: "text-red-400" },
  { key: "SPACE", label: "Space", icon: Rocket, accent: "text-indigo-400" },
  { key: "AI", label: "AI", icon: Cpu, accent: "text-violet-400" },
  { key: "COMPUTING", label: "Computing", icon: Cpu, accent: "text-blue-400" },
  { key: "ENERGY", label: "Energy", icon: Zap, accent: "text-amber-400" },
] as const;

export default function CommerceManager() {
  const { products, upsertProduct, deleteProduct } = useStore();
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const categories = CATEGORY_META.map((c) => c.key);

  const handleSave = (product: Product, isNew: boolean) => {
    if (!product.name.trim()) {
      showToast("Product name is required", "error");
      return;
    }
    if (product.price <= 0) {
      showToast("Price must be greater than zero", "error");
      return;
    }
    const normalized: Product = {
      ...product,
      id: isNew
        ? `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
        : product.id,
      name: product.name.trim(),
      tagline: product.tagline || undefined,
      badge: product.badge || undefined,
      imageUrl: product.imageUrl || undefined,
      imageAlt: product.imageAlt || undefined,
      affiliateUrl: product.affiliateUrl || undefined,
      specs: product.specs && Object.keys(product.specs).length ? product.specs : undefined,
      features: product.features?.length ? product.features : undefined,
      highlights: product.highlights?.length ? product.highlights : undefined,
    };
    upsertProduct(normalized);
    showToast(`${isNew ? "Created" : "Saved"} ${normalized.name}`);
    setCreating(false);
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    const target = products.find((p) => p.id === id);
    deleteProduct(id);
    setConfirmDelete(null);
    showToast(`Deleted ${target?.name ?? "product"}`, "error");
  };

  const productList = useMemo(
    () => [...products].sort((a, b) => {
      const order = categories.indexOf(a.category as (typeof categories)[number]);
      const orderB = categories.indexOf(b.category as (typeof categories)[number]);
      if (order !== orderB) return order - orderB;
      return b.price - a.price;
    }),
    [products, categories],
  );

  return (
    <div className="space-y-6">
      {toast && (
        <div className={cn(
          "fixed top-6 right-6 z-[9999] px-5 py-3 rounded-lg shadow-2xl flex items-center gap-3",
          toast.type === "success" ? "bg-emerald-600" : "bg-red-600",
        )}>
          <span className="text-sm font-medium text-white">{toast.message}</span>
          <button onClick={() => setToast(null)} className="hover:opacity-70 text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-white/60" />
          <h3 className="text-sm font-semibold text-white">Live Product Catalog</h3>
          <span className="text-xs text-gray-500">
            {products.length} products · {products.filter((p) => p.category === "EV").length} EV
          </span>
        </div>
        <button
          onClick={() => {
            setCreating(true);
            setEditing(null);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition"
        >
          <Plus size={14} /> Add Product
        </button>
      </div>

      {/* Create / Edit form */}
      {(creating || editing) && (
        <ProductForm
          initial={editing ?? EMPTY_PRODUCT}
          isNew={creating}
          onCancel={() => { setCreating(false); setEditing(null); }}
          onSave={(p) => handleSave(p, creating)}
          showToast={showToast}
        />
      )}

      {/* Grid */}
      {productList.length === 0 ? (
        <div className="bg-[#12121a] border border-white/5 rounded-xl p-12 text-center">
          <Package size={40} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No products yet</p>
          <p className="text-gray-600 text-xs mt-1">
            Add your first product to populate the commerce rail.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {productList.map((p) => {
            const meta = CATEGORY_META.find((c) => c.key === p.category) ?? CATEGORY_META[0];
            const Icon = meta.icon;
            return (
              <div
                key={p.id}
                className="bg-[#12121a] border border-white/5 rounded-xl overflow-hidden"
              >
                <div className="flex items-start justify-between bg-black/30 px-4 py-3 border-b border-white/5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
                      <Icon size={16} className={meta.accent} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                        {p.category} · {p.badge || "—"}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold font-mono text-white shrink-0">
                    {formatCurrency(p.price)}
                  </span>
                </div>

                <div className="px-4 py-3">
                  <p className="text-xs text-gray-400 line-clamp-2 min-h-[32px]">
                    {p.description}
                  </p>

                  {p.investmentSuggestion && (
                    <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-950/20 border border-emerald-900/20">
                      <Star size={12} className="text-emerald-400 shrink-0" />
                      <span className="text-[11px] text-emerald-300/90">
                        {formatCurrency(p.investmentSuggestion.amount)} → ${p.investmentSuggestion.symbol} ({p.investmentSuggestion.percentage}%)
                      </span>
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap gap-1">
                    {p.features?.slice(0, 3).map((f) => (
                      <span key={f} className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-white/40">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 px-4 py-3 border-t border-white/5">
                  <button
                    onClick={() => { setEditing(p); setCreating(false); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.06] hover:bg-white/[0.1] rounded-lg text-xs font-medium transition"
                  >
                    <Pencil size={12} /> Edit
                  </button>
                  <button
                    onClick={() => setConfirmDelete(p.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg text-xs font-medium transition"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                  {p.affiliateUrl && (
                    <a
                      href={p.affiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-white transition"
                    >
                      <ExternalLinkIcon /> Affiliate
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0f0f14] border border-white/10 rounded-2xl shadow-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Delete product?</h3>
            <p className="text-sm text-gray-400 mb-6">
              This product will be removed from the commerce rail and can be re-added later.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2.5 bg-white/[0.08] hover:bg-white/[0.12] rounded-lg text-sm font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-medium transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

/* ── Product Form ─────────────────────────────────────────────────────────── */
function ProductForm({
  initial,
  isNew,
  onCancel,
  onSave,
  showToast,
}: {
  initial: Product;
  isNew: boolean;
  onCancel: () => void;
  onSave: (p: Product) => void;
  showToast: (message: string, type?: "success" | "error") => void;
}) {
  const [form, setForm] = useState<Product>({ ...initial, specs: { ...(initial.specs ?? {}) }, features: [...(initial.features ?? [])] });
  const [specKeys, setSpecKeys] = useState<string[]>(Object.keys(form.specs ?? {}));

  const set = <K extends keyof Product>(key: K, value: Product[K]) =>
    setForm((f) => ({ ...f, [key]: value }));
  const setSpec = (index: number, key: string, value: string) => {
    setForm((f) => {
      const specs = { ...(f.specs ?? {}) };
      const oldKey = specKeys[index];
      if (oldKey && oldKey !== key) delete specs[oldKey];
      specs[key] = value;
      return { ...f, specs };
    });
    setSpecKeys((keys) => keys.map((k, i) => (i === index ? key : k)));
  };
  const addSpec = () => setSpecKeys((keys) => [...keys, ""]);
  const removeSpec = (index: number) => {
    setSpecKeys((keys) => keys.filter((_, i) => i !== index));
    setForm((f) => {
      const specs = { ...(f.specs ?? {}) };
      delete specs[specKeys[index]];
      return { ...f, specs };
    });
  };
  const toggleFeature = (feature: string) => {
    setForm((f) => {
      const features = f.features?.includes(feature)
        ? f.features.filter((x) => x !== feature)
        : [...(f.features ?? []), feature];
      return { ...f, features };
    });
  };

  const suggestFeatures = (category: string): string[] => {
    if (category === "EV") return ["Autopilot", "FSD Ready", "OTA Updates", "Supercharger"];
    if (category === "SPACE") return ["Global Coverage", "LEO Network", "Satellite", "Rocket"];
    if (category === "AI") return ["Tensor Core", "CUDA", "Inference", "AI Training"];
    if (category === "ENERGY") return ["Solar Ready", "Grid Backup", "Energy Storage", "Smart Meter"];
    return ["Thunderbolt", "Unified Memory", "Liquid Cooled", "WiFi 6E"];
  };

  const inputCls =
    "w-full px-3 py-2 bg-[#0c0c12] border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-white/20";

  return (
    <div className="bg-[#12121a] border border-white/10 rounded-xl p-5 md:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-white">
          {isNew ? "Add New Product" : `Edit — ${form.name}`}
        </h4>
        <button onClick={onCancel} className="text-gray-400 hover:text-white transition">
          <X size={18} />
        </button>
      </div>

      {/* basics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-500 mb-1">Product Name *</label>
          <input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Tesla Model X Plaid" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Category</label>
          <select
            className={inputCls}
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
          >
            {CATEGORY_META.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Price (USD) *</label>
          <input
            type="number"
            min={0}
            className={inputCls}
            value={form.price || ""}
            onChange={(e) => set("price", Number(e.target.value))}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Badge</label>
          <input className={inputCls} value={form.badge ?? ""} onChange={(e) => set("badge", e.target.value)} placeholder="Bestseller · Limited · New" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Tagline</label>
          <input className={inputCls} value={form.tagline ?? ""} onChange={(e) => set("tagline", e.target.value)} placeholder="The quickest SUV ever made." />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-500 mb-1">Description</label>
          <textarea
            className={`${inputCls} min-h-[80px]`}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Short description shown on the product card…"
          />
        </div>
      </div>

      {/* media + affiliate */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Image URL</label>
          <input className={inputCls} value={form.imageUrl ?? ""} onChange={(e) => set("imageUrl", e.target.value)} placeholder="https://…/product.jpg" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Affiliate URL</label>
          <input className={inputCls} value={form.affiliateUrl ?? ""} onChange={(e) => set("affiliateUrl", e.target.value)} placeholder="https://merchant.com/product" />
        </div>
      </div>

      {/* investment suggestion */}
      <div className="bg-black/30 border border-white/5 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Star size={14} className="text-emerald-400" />
          <label className="text-xs font-bold text-white uppercase tracking-wider">Investment Bundle</label>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] text-gray-500 mb-1">Symbol</label>
            <input className={inputCls} value={form.investmentSuggestion?.symbol ?? ""} onChange={(e) => set("investmentSuggestion", { ...form.investmentSuggestion!, symbol: e.target.value.toUpperCase() })} placeholder="TSLA" />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 mb-1">Name</label>
            <input className={inputCls} value={form.investmentSuggestion?.name ?? ""} onChange={(e) => set("investmentSuggestion", { ...form.investmentSuggestion!, name: e.target.value })} placeholder="Tesla, Inc." />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 mb-1">%</label>
            <input type="number" min={0} max={100} className={inputCls} value={form.investmentSuggestion?.percentage ?? 5} onChange={(e) => set("investmentSuggestion", { ...form.investmentSuggestion!, percentage: Number(e.target.value) })} />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 mb-1">Amount</label>
            <input type="number" min={0} className={inputCls} value={form.investmentSuggestion?.amount ?? 0} onChange={(e) => set("investmentSuggestion", { ...form.investmentSuggestion!, amount: Number(e.target.value) })} />
          </div>
        </div>
        <p className="text-[10px] text-gray-600 mt-2">
          The bundle auto-invests the amount into the symbol on checkout.
        </p>
      </div>

      {/* specs editor */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-gray-500">Specs</label>
          <button onClick={addSpec} className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition">
            <Plus size={12} /> Add Spec
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {specKeys.map((key, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input className={`${inputCls} flex-1`} value={key} onChange={(e) => setSpec(i, e.target.value, (form.specs ?? {})[specKeys[i]] ?? "")} placeholder="Name" />
              <input className={`${inputCls} flex-1`} value={(form.specs ?? {})[specKeys[i]] ?? ""} onChange={(e) => { const k = specKeys[i]; setForm((f) => ({ ...f, specs: { ...(f.specs ?? {}), [k]: e.target.value } })); }} placeholder="Value" />
              <button onClick={() => removeSpec(i)} className="text-gray-600 hover:text-red-400 transition shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* features quick-picks */}
      <div>
        <label className="block text-xs text-gray-500 mb-2">Features (click to toggle)</label>
        <div className="flex flex-wrap gap-2">
          {suggestFeatures(form.category).map((f) => {
            const active = form.features?.includes(f);
            return (
              <button
                key={f}
                onClick={() => toggleFeature(f)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium border transition",
                  active
                    ? "bg-white/[0.08] border-white/20 text-white"
                    : "bg-transparent border-white/10 text-gray-500 hover:text-white hover:border-white/20",
                )}
              >
                {f}
              </button>
            );
          })}
        </div>
      </div>

      {/* preview URL note */}
      {form.imageUrl && (
        <div className="flex items-center gap-2 text-[11px] text-gray-500 bg-black/20 rounded-lg px-3 py-2">
          <Eye size={12} /> Preview will render from the image URL on /commerce.
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] rounded-lg text-sm font-medium transition"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            if (!form.name.trim()) { showToast("Product name is required", "error"); return; }
            if (form.price <= 0) { showToast("Price must be greater than zero", "error"); return; }
            onSave({ ...form, features: form.features?.length ? form.features : undefined });
          }}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition"
        >
          <Save size={14} /> {isNew ? "Create Product" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
