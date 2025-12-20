import React, { useState, useEffect } from "react";
import {
  Package,
  Plus,
  Trash,
  PencilSimple,
  FloppyDisk,
  X,
  Globe,
  CircleNotch,
} from "@phosphor-icons/react";
import Workspace from "@/models/workspace";
import showToast from "@/utils/toast";

const PRICING_TYPES = [
  { value: "fixed", label: "Fixed Price" },
  { value: "hourly", label: "Hourly" },
  { value: "monthly", label: "Monthly" },
  { value: "custom", label: "Custom" },
];

const CATEGORIES = [
  "Web Development",
  "Design",
  "Marketing",
  "Consulting",
  "Support",
  "Other",
];

export default function ProductsManager({ workspace }) {
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [newProduct, setNewProduct] = useState(null);
  const [importUrl, setImportUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async () => {
    if (!importUrl) return;
    setIsImporting(true);
    const { products: importedProducts, error } =
      await Workspace.importProducts(workspace.slug, importUrl);
    if (error) {
      showToast(error, "error");
    } else if (importedProducts?.length > 0) {
      // Append and save
      const updated = [...products, ...importedProducts];
      await saveProducts(updated);
      setImportUrl("");
      showToast(
        `Imported ${importedProducts.length} products successfully!`,
        "success"
      );
    } else {
      showToast("No products found on that page", "warning");
    }
    setIsImporting(false);
  };

  useEffect(() => {
    if (workspace?.products) {
      try {
        setProducts(JSON.parse(workspace.products));
      } catch {
        setProducts([]);
      }
    }
  }, [workspace]);

  const saveProducts = async (updatedProducts) => {
    setSaving(true);
    try {
      await Workspace.update(workspace.slug, {
        products: JSON.stringify(updatedProducts),
      });
      setProducts(updatedProducts);
    } catch (error) {
      console.error("Failed to save products:", error);
    }
    setSaving(false);
  };

  const addProduct = () => {
    setNewProduct({
      id: `prod_${Date.now()}`,
      name: "",
      category: "Other",
      price: 0,
      pricingType: "fixed",
      description: "",
      features: [],
    });
    setEditingId(null);
  };

  const saveNewProduct = async () => {
    if (!newProduct.name.trim()) return;
    const updatedProducts = [...products, newProduct];
    await saveProducts(updatedProducts);
    setNewProduct(null);
  };

  const updateProduct = async (id, updates) => {
    const updatedProducts = products.map((p) =>
      p.id === id ? { ...p, ...updates } : p
    );
    await saveProducts(updatedProducts);
    setEditingId(null);
  };

  const deleteProduct = async (id) => {
    const updatedProducts = products.filter((p) => p.id !== id);
    await saveProducts(updatedProducts);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">
            Products & Services
          </h2>
        </div>
        <button
          onClick={addProduct}
          disabled={saving || newProduct}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      <p className="text-white/60 text-sm">
        Define your products and services. The AI will use these when generating
        proposals.
      </p>

      {/* Import Block */}
      <div className="bg-theme-bg-secondary border border-theme-border rounded-lg p-4">
        <label className="block text-white/60 text-xs uppercase font-bold mb-2">
          Auto-Fill from Website
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="https://your-agency.com/pricing"
            className="flex-1 bg-theme-bg-primary text-white text-sm rounded-lg px-3 py-2 border border-theme-border focus:ring-2 focus:ring-blue-500 outline-none"
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleImport()}
          />
          <button
            onClick={handleImport}
            disabled={isImporting || !importUrl}
            className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
          >
            {isImporting ? (
              <CircleNotch className="w-4 h-4 animate-spin" />
            ) : (
              <Globe className="w-4 h-4" />
            )}
            {isImporting ? "Analyzing..." : "Import"}
          </button>
        </div>
        <p className="text-white/40 text-xs mt-2">
          Enter a URL. The AI will scrape products and estimate missing prices.
        </p>
      </div>

      {/* New Product Form */}
      {newProduct && (
        <div className="bg-theme-bg-primary border border-theme-border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-white font-medium">New Product</span>
            <div className="flex gap-2">
              <button
                onClick={saveNewProduct}
                disabled={!newProduct.name.trim() || saving}
                className="p-2 text-green-400 hover:bg-green-400/10 rounded disabled:opacity-50"
              >
                <FloppyDisk className="w-5 h-5" />
              </button>
              <button
                onClick={() => setNewProduct(null)}
                className="p-2 text-red-400 hover:bg-red-400/10 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <ProductForm
            product={newProduct}
            onChange={(updates) => setNewProduct({ ...newProduct, ...updates })}
          />
        </div>
      )}

      {/* Products List */}
      <div className="space-y-3">
        {products.length === 0 && !newProduct && (
          <div className="text-center py-12 text-white/40">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No products defined yet.</p>
            <p className="text-sm">Add your first product to get started.</p>
          </div>
        )}

        {products.map((product) => (
          <div
            key={product.id}
            className="bg-theme-bg-primary border border-theme-border rounded-lg p-4"
          >
            {editingId === product.id ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">Edit Product</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        updateProduct(
                          product.id,
                          products.find((p) => p.id === product.id)
                        )
                      }
                      disabled={saving}
                      className="p-2 text-green-400 hover:bg-green-400/10 rounded disabled:opacity-50"
                    >
                      <FloppyDisk className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-2 text-white/60 hover:bg-white/10 rounded"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <ProductForm
                  product={product}
                  onChange={(updates) => {
                    const idx = products.findIndex((p) => p.id === product.id);
                    const updated = [...products];
                    updated[idx] = { ...product, ...updates };
                    setProducts(updated);
                  }}
                />
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-white font-medium">
                      {product.name}
                    </span>
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">
                      {product.category}
                    </span>
                  </div>
                  <div className="text-lg font-semibold text-green-400">
                    ${product.price?.toLocaleString()}
                    <span className="text-sm text-white/40 ml-1">
                      (
                      {PRICING_TYPES.find(
                        (t) => t.value === product.pricingType
                      )?.label || product.pricingType}
                      )
                    </span>
                  </div>
                  {product.description && (
                    <p className="text-white/60 text-sm">
                      {product.description}
                    </p>
                  )}
                  {product.features?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {product.features.map((f, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-white/10 text-white/60 rounded text-xs"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditingId(product.id)}
                    className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded"
                  >
                    <PencilSimple className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteProduct(product.id)}
                    disabled={saving}
                    className="p-2 text-red-400 hover:bg-red-400/10 rounded disabled:opacity-50"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductForm({ product, onChange }) {
  const [featureInput, setFeatureInput] = useState("");

  const addFeature = () => {
    if (!featureInput.trim()) return;
    onChange({ features: [...(product.features || []), featureInput.trim()] });
    setFeatureInput("");
  };

  const removeFeature = (index) => {
    const updated = [...(product.features || [])];
    updated.splice(index, 1);
    onChange({ features: updated });
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2 sm:col-span-1">
        <label className="block text-white/60 text-sm mb-1">Product Name</label>
        <input
          type="text"
          value={product.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="e.g., Website Redesign"
          className="w-full px-3 py-2 bg-theme-bg-secondary border border-theme-border rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="col-span-2 sm:col-span-1">
        <label className="block text-white/60 text-sm mb-1">Category</label>
        <select
          value={product.category}
          onChange={(e) => onChange({ category: e.target.value })}
          className="w-full px-3 py-2 bg-theme-bg-secondary border border-theme-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-white/60 text-sm mb-1">Price ($)</label>
        <input
          type="number"
          value={product.price}
          onChange={(e) => onChange({ price: parseFloat(e.target.value) || 0 })}
          placeholder="0"
          min="0"
          className="w-full px-3 py-2 bg-theme-bg-secondary border border-theme-border rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-white/60 text-sm mb-1">Pricing Type</label>
        <select
          value={product.pricingType}
          onChange={(e) => onChange({ pricingType: e.target.value })}
          className="w-full px-3 py-2 bg-theme-bg-secondary border border-theme-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {PRICING_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>
      <div className="col-span-2">
        <label className="block text-white/60 text-sm mb-1">Description</label>
        <textarea
          value={product.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Brief description of the product/service..."
          rows={2}
          className="w-full px-3 py-2 bg-theme-bg-secondary border border-theme-border rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>
      <div className="col-span-2">
        <label className="block text-white/60 text-sm mb-1">
          Features / Deliverables
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={featureInput}
            onChange={(e) => setFeatureInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addFeature()}
            placeholder="Add a feature..."
            className="flex-1 px-3 py-2 bg-theme-bg-secondary border border-theme-border rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addFeature}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {product.features?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {product.features.map((f, i) => (
              <span
                key={i}
                className="flex items-center gap-1 px-2 py-1 bg-white/10 text-white rounded text-sm"
              >
                {f}
                <button
                  onClick={() => removeFeature(i)}
                  className="text-red-400 hover:text-red-300"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
