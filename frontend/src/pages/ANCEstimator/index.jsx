import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Workspace from "@/models/workspace";
import { toast } from "react-toastify";
import Sidebar from "@/components/Sidebar";

const DEMO_PRODUCTS = [
  {
    productName: "10mm Outdoor Ribbon (Standard)",
    category: "Ribbon",
    baseCostPerSqFt: 250.0,
    structuralMargin: 0.15,
    laborMargin: 0.2,
    fixedCosts: 5000,
  },
  {
    productName: "16mm Outdoor Ribbon (Budget)",
    category: "Ribbon",
    baseCostPerSqFt: 180.0,
    structuralMargin: 0.15,
    laborMargin: 0.18,
    fixedCosts: 4000,
  },
  {
    productName: "6mm Outdoor High-Res Scoreboard",
    category: "Scoreboard",
    baseCostPerSqFt: 450.0,
    structuralMargin: 0.15,
    laborMargin: 0.22,
    fixedCosts: 7500,
  },
  {
    productName: "10mm Outdoor Scoreboard (Pro)",
    category: "Scoreboard",
    baseCostPerSqFt: 280.0,
    structuralMargin: 0.15,
    laborMargin: 0.2,
    fixedCosts: 5000,
  },
  {
    productName: "16mm Outdoor Mesh (Transparent)",
    category: "Facade",
    baseCostPerSqFt: 140.0,
    structuralMargin: 0.25,
    laborMargin: 0.25,
    fixedCosts: 3000,
  },
  {
    productName: "4mm Indoor Center Hung (Premium)",
    category: "Arena",
    baseCostPerSqFt: 600.0,
    structuralMargin: 0.1,
    laborMargin: 0.15,
    fixedCosts: 8000,
  },
  {
    productName: "2.5mm Indoor Fine Pitch (VIP Suite)",
    category: "Indoor",
    baseCostPerSqFt: 950.0,
    structuralMargin: 0.05,
    laborMargin: 0.1,
    fixedCosts: 2500,
  },
  {
    productName: "Custom Curved Facade (Flexible)",
    category: "Architectural",
    baseCostPerSqFt: 550.0,
    structuralMargin: 0.35,
    laborMargin: 0.3,
    fixedCosts: 12000,
  },
  {
    productName: "Perimeter Field Board (FIFA Std)",
    category: "Perimeter",
    baseCostPerSqFt: 320.0,
    structuralMargin: 0.1,
    laborMargin: 0.12,
    fixedCosts: 3500,
  },
  {
    productName: "Concours Digital Signage (LCD Video Wall)",
    category: "Signage",
    baseCostPerSqFt: 120.0,
    structuralMargin: 0.05,
    laborMargin: 0.15,
    fixedCosts: 1000,
  },
];

export default function ANCEstimator() {
  const { slug } = useParams();
  const [activeTab, setActiveTab] = useState("estimator");
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);

  // Catalog State
  const [catalog, setCatalog] = useState([]);

  // Estimator State
  const [inputs, setInputs] = useState({
    height: 0,
    width: 0,
    quantity: 1,
    selectedProductIndex: -1,
  });
  const [quote, setQuote] = useState(null);

  useEffect(() => {
    async function fetchWorkspace() {
      if (!slug) return;
      try {
        const ws = await Workspace.bySlug(slug);
        setWorkspace(ws);
        let parsedCatalog = [];
        if (ws.ancProductCatalog) {
          try {
            parsedCatalog = JSON.parse(ws.ancProductCatalog);
          } catch (e) {
            console.error("Failed to parse catalog", e);
          }
        }

        // Auto-seed with demo products if catalog is empty
        if (!Array.isArray(parsedCatalog) || parsedCatalog.length === 0) {
          parsedCatalog = DEMO_PRODUCTS;
          toast.info("Seeded demo products for ANC Estimator.");
        }

        setCatalog(Array.isArray(parsedCatalog) ? parsedCatalog : []);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load workspace");
      } finally {
        setLoading(false);
      }
    }
    fetchWorkspace();
  }, [slug]);

  const handleCatalogChange = (index, field, value) => {
    const newCatalog = [...catalog];
    newCatalog[index] = { ...newCatalog[index], [field]: value };
    setCatalog(newCatalog);
  };

  const addProduct = () => {
    const newProduct = {
      productName: "New Product",
      category: "General",
      baseCostPerSqFt: 0,
      structuralMargin: 0.15,
      laborMargin: 0.2,
      fixedCosts: 0,
    };
    setCatalog([...catalog, newProduct]);
  };

  const handleSaveCatalog = async () => {
    if (!workspace) return;
    try {
      await Workspace.update(workspace.slug, {
        ancProductCatalog: JSON.stringify(catalog),
      });
      toast.success("Catalog saved to workspace!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save catalog");
    }
  };

  const calculateQuote = () => {
    if (inputs.selectedProductIndex === -1) {
      toast.error("Please select a product");
      return;
    }

    const product = catalog[inputs.selectedProductIndex];
    const height = Number(inputs.height);
    const width = Number(inputs.width);
    const quantity = Number(inputs.quantity);

    const area = height * width;
    const baseCost = area * Number(product.baseCostPerSqFt);
    const structural = baseCost * Number(product.structuralMargin);
    const labor = baseCost * Number(product.laborMargin);
    const fixed = Number(product.fixedCosts);

    const unitPrice = baseCost + structural + labor + fixed;
    const total = unitPrice * quantity;

    setQuote({
      client: {
        unitPrice,
        total,
      },
      internal: {
        baseCost,
        structural,
        labor,
        fixed,
      },
    });
  };

  if (loading)
    return (
      <div className="w-screen h-screen flex justify-center items-center bg-zinc-900 text-white">
        Loading...
      </div>
    );

  return (
    <div className="w-screen h-screen overflow-hidden bg-zinc-900 flex">
      <Sidebar />
      <div className="flex-1 w-full h-full overflow-y-scroll p-6 text-white">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-blue-400">
            ANC Estimator module
          </h1>
          <div className="text-xs text-gray-500">
            Workspace: {workspace?.name}
          </div>
        </div>

        <div className="flex space-x-6 mb-8 border-b border-gray-700 pb-1">
          <button
            onClick={() => setActiveTab("estimator")}
            className={`pb-2 px-1 ${activeTab === "estimator" ? "border-b-2 border-blue-500 text-blue-500 font-bold" : "text-gray-400 hover:text-white"}`}
          >
            Estimator Calculator
          </button>
          <button
            onClick={() => setActiveTab("catalog")}
            className={`pb-2 px-1 ${activeTab === "catalog" ? "border-b-2 border-blue-500 text-blue-500 font-bold" : "text-gray-400 hover:text-white"}`}
          >
            Product Catalog Configuration
          </button>
        </div>

        {activeTab === "catalog" && (
          <div className="max-w-6xl">
            <div className="mb-4 flex justify-between items-center">
              <p className="text-gray-400 text-sm">
                Define your LED/Construction products and their margins here.
              </p>
              <div className="space-x-2">
                <button
                  onClick={addProduct}
                  className="bg-green-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition"
                >
                  Add Product
                </button>
                <button
                  onClick={handleSaveCatalog}
                  className="bg-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                >
                  Save Catalog
                </button>
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-900 text-gray-400 uppercase tracking-wider">
                  <tr>
                    <th className="p-3 font-medium">Product Name</th>
                    <th className="p-3 font-medium">Category</th>
                    <th className="p-3 font-medium">Base Cost / SqFt ($)</th>
                    <th className="p-3 font-medium">
                      Struct. Margin (0.15 = 15%)
                    </th>
                    <th className="p-3 font-medium">
                      Labor Margin (0.20 = 20%)
                    </th>
                    <th className="p-3 font-medium">Fixed Costs ($)</th>
                    <th className="p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {catalog.length === 0 && (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-gray-500">
                        No products in catalog. Add one to get started.
                      </td>
                    </tr>
                  )}
                  {catalog.map((product, idx) => (
                    <tr key={idx} className="hover:bg-gray-750 transition">
                      <td className="p-3">
                        <input
                          type="text"
                          value={product.productName}
                          onChange={(e) =>
                            handleCatalogChange(
                              idx,
                              "productName",
                              e.target.value
                            )
                          }
                          className="bg-gray-700 border border-gray-600 px-2 py-1 rounded w-full text-white focus:border-blue-500 outline-none"
                          placeholder="Product Name"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={product.category}
                          onChange={(e) =>
                            handleCatalogChange(idx, "category", e.target.value)
                          }
                          className="bg-gray-700 border border-gray-600 px-2 py-1 rounded w-full text-white focus:border-blue-500 outline-none"
                          placeholder="Category"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          step="0.01"
                          value={product.baseCostPerSqFt}
                          onChange={(e) =>
                            handleCatalogChange(
                              idx,
                              "baseCostPerSqFt",
                              parseFloat(e.target.value)
                            )
                          }
                          className="bg-gray-700 border border-gray-600 px-2 py-1 rounded w-32 text-white focus:border-blue-500 outline-none"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          step="0.01"
                          value={product.structuralMargin}
                          onChange={(e) =>
                            handleCatalogChange(
                              idx,
                              "structuralMargin",
                              parseFloat(e.target.value)
                            )
                          }
                          className="bg-gray-700 border border-gray-600 px-2 py-1 rounded w-32 text-white focus:border-blue-500 outline-none"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          step="0.01"
                          value={product.laborMargin}
                          onChange={(e) =>
                            handleCatalogChange(
                              idx,
                              "laborMargin",
                              parseFloat(e.target.value)
                            )
                          }
                          className="bg-gray-700 border border-gray-600 px-2 py-1 rounded w-32 text-white focus:border-blue-500 outline-none"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          step="0.01"
                          value={product.fixedCosts}
                          onChange={(e) =>
                            handleCatalogChange(
                              idx,
                              "fixedCosts",
                              parseFloat(e.target.value)
                            )
                          }
                          className="bg-gray-700 border border-gray-600 px-2 py-1 rounded w-32 text-white focus:border-blue-500 outline-none"
                        />
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => {
                            const newCatalog = [...catalog];
                            newCatalog.splice(idx, 1);
                            setCatalog(newCatalog);
                          }}
                          className="text-red-400 hover:text-red-300 font-medium text-xs"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "estimator" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl">
            <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-white border-b border-gray-700 pb-2">
                1. Input Parameters
              </h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Select Product
                  </label>
                  <select
                    value={inputs.selectedProductIndex}
                    onChange={(e) =>
                      setInputs({
                        ...inputs,
                        selectedProductIndex: Number(e.target.value),
                      })
                    }
                    className="w-full bg-gray-900 border border-gray-600 p-2.5 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value={-1} disabled>
                      -- Select a Product from Catalog --
                    </option>
                    {catalog.map((p, idx) => (
                      <option key={idx} value={idx}>
                        {p.productName}
                      </option>
                    ))}
                  </select>
                  {catalog.length === 0 && (
                    <p className="text-xs text-yellow-500 mt-1">
                      Catalog is empty. Go to "Product Catalog" tab to add
                      items.
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Width (ft)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={inputs.width}
                      onChange={(e) =>
                        setInputs({ ...inputs, width: e.target.value })
                      }
                      className="w-full bg-gray-900 border border-gray-600 p-2.5 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Height (ft)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={inputs.height}
                      onChange={(e) =>
                        setInputs({ ...inputs, height: e.target.value })
                      }
                      className="w-full bg-gray-900 border border-gray-600 p-2.5 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={inputs.quantity}
                    onChange={(e) =>
                      setInputs({ ...inputs, quantity: e.target.value })
                    }
                    className="w-full bg-gray-900 border border-gray-600 p-2.5 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="1"
                  />
                </div>
                <button
                  onClick={calculateQuote}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 p-3 rounded-lg font-bold hover:from-blue-500 hover:to-blue-400 transition shadow-lg mt-2"
                >
                  Generate Quote
                </button>
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg shadow-lg flex flex-col">
              <h2 className="text-xl font-semibold mb-4 text-white border-b border-gray-700 pb-2">
                2. Quote Preview
              </h2>
              {quote ? (
                <div className="space-y-6 flex-1">
                  <div className="bg-zinc-900 p-5 rounded-lg border border-zinc-700">
                    <h3 className="text-lg font-bold text-green-400 mb-4 flex items-center">
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        ></path>
                      </svg>
                      Client Pricing (External)
                    </h3>
                    <div className="flex justify-between text-lg mb-2">
                      <span className="text-gray-400">Unit Price:</span>
                      <span className="font-mono">
                        ${quote.client.unitPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-2xl font-bold mt-4 border-t border-gray-700 pt-4 text-white">
                      <span>Total Quote:</span>
                      <span>${quote.client.total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="bg-zinc-900/50 p-5 rounded-lg border border-dashed border-gray-600">
                    <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider flex items-center">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        ></path>
                      </svg>
                      Internal Cost Breakdown (Private)
                    </h3>
                    <div className="space-y-2 text-sm text-gray-400 font-mono">
                      <div className="flex justify-between">
                        <span>Base Material Cost:</span>
                        <span>${quote.internal.baseCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Structural Margin:</span>
                        <span>${quote.internal.structural.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Labor Margin:</span>
                        <span>${quote.internal.labor.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Fixed Costs:</span>
                        <span>${quote.internal.fixed.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-center items-center text-gray-500 opacity-50">
                  <svg
                    className="w-16 h-16 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1"
                      d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    ></path>
                  </svg>
                  <span className="italic">Fill inputs to generate quote</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
