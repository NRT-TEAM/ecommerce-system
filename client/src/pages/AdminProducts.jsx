import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { ShopContext } from "../context/ShopContext";

const AdminProducts = () => {
  const { isAdmin, token } = useContext(ShopContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [meta, setMeta] = useState(null);

  const ALLOWED_CATEGORIES = ["Furniture", "Bedroom", "Audio", "Appliances"];
  const ALLOWED_TYPES = [
    // Furniture
    "Sofas",
    "Tables",
    "Chairs",
    "Shelves",

    // Bedroom
    "Beds",
    "Mattresses",
    "Nightstands",
    "Dressers",

    // Audio
    "Synthesizers",
    "Keyboards",
    "Pedals",
    "Guitars",

    // Appliances
    "Microwaves",
    "Toasters",
    "Fridges",
    "Ovens",
  ];
  const FILTER_TYPES = ALLOWED_TYPES.slice();
  const TYPE_TO_CATEGORIES = {
    Sofas: ["Furniture"],
    Tables: ["Furniture"],
    Chairs: ["Furniture"],
    Shelves: ["Furniture"],
    Beds: ["Bedroom"],
    Mattresses: ["Bedroom"],
    Nightstands: ["Bedroom"],
    Dressers: ["Bedroom"],
    Synthesizers: ["Audio"],
    Keyboards: ["Audio"],
    Pedals: ["Audio"],
    Guitars: ["Audio"],
    Microwaves: ["Appliances"],
    Toasters: ["Appliances"],
    Fridges: ["Appliances"],
    Ovens: ["Appliances"],
  };
  const allowedTypesForCategory = (b) => {
    if (!b) return ALLOWED_TYPES;
    return ALLOWED_TYPES.filter((t) => (TYPE_TO_CATEGORIES[t] || []).includes(b));
  };

  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    priceRands: "",
    priceCents: "",
    type: "",
    category: "",
    quantityInStock: "",
    file: null,
  });
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({
    id: 0,
    name: "",
    description: "",
    priceRands: "",
    priceCents: "",
    type: "",
    category: "",
    quantityInStock: "",
    file: null,
  });

  const [stockEdits, setStockEdits] = useState({});
  const [savingStockId, setSavingStockId] = useState(null);

  const [selectedTypes, setSelectedTypes] = useState([]);
  const toggleTypeFilter = (t) => {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const url = new URL("http://localhost:5005/api/products");
      url.searchParams.set("pageNumber", String(page));
      url.searchParams.set("pageSize", String(pageSize));
      const res = await axios.get(url.toString(), { headers: authHeaders });
      const body = res.data;
      const arr = Array.isArray(body)
        ? body
        : Array.isArray(body?.items)
        ? body.items
        : [];
      setItems(arr);
      try {
        const hdr = res.headers?.["pagination"] || res.headers?.Pagination;
        if (hdr) setMeta(JSON.parse(hdr));
      } catch {}
    } catch {
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, pageSize]);

  const onCreate = async () => {
    setError("");
    if (!createForm.name?.trim()) {
      setError("Name is required");
      return;
    }
    if (!createForm.description?.trim()) {
      setError("Description is required");
      return;
    }
    const randsNum = Math.max(
      0,
      parseInt(createForm.priceRands || "0", 10) || 0
    );
    const centsNumRaw = Math.max(
      0,
      parseInt(createForm.priceCents || "0", 10) || 0
    );
    const centsNum = Math.min(99, centsNumRaw);
    const priceTotalCents = randsNum * 100 + centsNum;
    if (!priceTotalCents) {
      setError("Price is required");
      return;
    }
    if (priceTotalCents < 100) {
      setError("Price must be at least 1.00");
      return;
    }
    if (!ALLOWED_TYPES.includes(createForm.type)) {
      setError("Type must be one of the allowed options");
      return;
    }
    if (!ALLOWED_CATEGORIES.includes(createForm.category)) {
      setError("Category must be one of the allowed options");
      return;
    }
    const fd = new FormData();
    fd.append("name", createForm.name);
    fd.append("description", createForm.description);
    fd.append("price", String(priceTotalCents));
    fd.append("type", createForm.type);
    fd.append("category", createForm.category);
    fd.append(
      "quantityInStock",
      String(Math.max(0, Number(createForm.quantityInStock || 0)))
    );
    if (!createForm.file) {
      setError("Image is required");
      return;
    }
    fd.append("file", createForm.file);
    try {
      await axios.post("http://localhost:5005/api/products", fd, {
        headers: { ...authHeaders },
      });
      setCreateForm({
        name: "",
        description: "",
        priceRands: "",
        priceCents: "",
        type: "",
        category: "",
        quantityInStock: "",
        file: null,
      });
      await load();
      try {
        window.dispatchEvent(new Event("productsChanged"));
        window.dispatchEvent(
          new CustomEvent("toast", {
            detail: { type: "success", title: "Product", message: "Created" },
          })
        );
      } catch {}
    } catch (e) {
      setError(e?.response?.data?.title || "Create failed");
      try {
        window.dispatchEvent(
          new CustomEvent("toast", {
            detail: {
              type: "error",
              title: "Product",
              message: "Create failed",
            },
          })
        );
      } catch {}
    }
  };

  const startEdit = (p) => {
    setEditItem(p);
    const r = Math.floor(Number(p.price || 0) / 100);
    const c = Math.max(0, Number(p.price || 0) % 100);
    setEditForm({
      id: p.id,
      name: p.name,
      description: p.description,
      priceRands: String(r),
      priceCents: String(c).padStart(2, "0"),
      type: p.type,
      category: p.category ?? p.brand,
      quantityInStock: String(p.quantityInStock),
      file: null,
    });
  };

  const onUpdate = async () => {
    if (!editForm.name?.trim() || !editForm.description?.trim()) {
      setError("Name and Description are required");
      return;
    }
    const randsNumU = Math.max(
      0,
      parseInt(editForm.priceRands || "0", 10) || 0
    );
    const centsNumRawU = Math.max(
      0,
      parseInt(editForm.priceCents || "0", 10) || 0
    );
    const centsNumU = Math.min(99, centsNumRawU);
    const priceTotalCentsU = randsNumU * 100 + centsNumU;
    if (priceTotalCentsU < 100) {
      setError("Price must be at least 1.00");
      return;
    }
    if (Number(editForm.quantityInStock) < 0) {
      setError("Stock cannot be negative");
      return;
    }
    const fd = new FormData();
    fd.append("id", editForm.id);
    fd.append("name", editForm.name);
    fd.append("description", editForm.description);
    fd.append("price", String(priceTotalCentsU));
    fd.append("type", editForm.type);
    fd.append("category", editForm.category);
    fd.append(
      "quantityInStock",
      String(Math.max(0, Number(editForm.quantityInStock || 0)))
    );
    if (editForm.file) fd.append("file", editForm.file);
    try {
      await axios.put("http://localhost:5005/api/products", fd, {
        headers: { ...authHeaders },
      });
      try {
        const map = JSON.parse(
          localStorage.getItem("productUpdatedAt") || "{}"
        );
        map[String(editForm.id)] = new Date().toISOString();
        localStorage.setItem("productUpdatedAt", JSON.stringify(map));
      } catch {}
      setEditItem(null);
      await load();
      try {
        window.dispatchEvent(new Event("productsChanged"));
        window.dispatchEvent(
          new CustomEvent("toast", {
            detail: { type: "success", title: "Product", message: "Updated" },
          })
        );
      } catch {}
    } catch (e) {
      setError(e?.response?.data?.title || "Update failed");
      try {
        window.dispatchEvent(
          new CustomEvent("toast", {
            detail: {
              type: "error",
              title: "Product",
              message: "Update failed",
            },
          })
        );
      } catch {}
    }
  };

  const quickUpdateStock = async (p) => {
    setError("");
    try {
      setSavingStockId(p.id);
      const newQty = Math.max(
        0,
        parseInt(stockEdits[String(p.id)] ?? p.quantityInStock, 10) || 0
      );
      const fd = new FormData();
      fd.append("id", p.id);
      fd.append("name", p.name);
      fd.append("description", p.description);
      fd.append("price", String(Math.max(100, Number(p.price || 0))));
      fd.append("type", p.type);
      fd.append("category", p.category ?? p.brand);
      fd.append("quantityInStock", String(newQty));
      await axios.put("http://localhost:5005/api/products", fd, {
        headers: { ...authHeaders },
      });
      try {
        const map = JSON.parse(
          localStorage.getItem("productUpdatedAt") || "{}"
        );
        map[String(p.id)] = new Date().toISOString();
        localStorage.setItem("productUpdatedAt", JSON.stringify(map));
      } catch {}
      setStockEdits((prev) => {
        const next = { ...prev };
        delete next[String(p.id)];
        return next;
      });
      await load();
      try {
        window.dispatchEvent(new Event("productsChanged"));
        window.dispatchEvent(
          new CustomEvent("toast", {
            detail: { type: "success", title: "Stock", message: "Updated" },
          })
        );
      } catch {}
    } catch (e) {
      setError(e?.response?.data?.title || "Update failed");
      try {
        window.dispatchEvent(
          new CustomEvent("toast", {
            detail: { type: "error", title: "Stock", message: "Update failed" },
          })
        );
      } catch {}
    } finally {
      setSavingStockId(null);
    }
  };

  const onDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5005/api/products/${id}`, {
        headers: { ...authHeaders },
      });
      await load();
      try {
        window.dispatchEvent(new Event("productsChanged"));
        window.dispatchEvent(
          new CustomEvent("toast", {
            detail: { type: "success", title: "Product", message: "Deleted" },
          })
        );
      } catch {}
    } catch {
      setError("Delete failed");
      try {
        window.dispatchEvent(
          new CustomEvent("toast", {
            detail: {
              type: "error",
              title: "Product",
              message: "Delete failed",
            },
          })
        );
      } catch {}
    }
  };

  if (!isAdmin) return <div className="p-8">Admin only</div>;

  return (
    <div
      className="container mx-auto px-4 py-8"
      data-testid="admin-products-page"
    >
      <div className="flex flex-col items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold" data-testid="admin-products-title">
          Admin Products
        </h1>
        <button
          className="h-10 px-4 rounded border justify-center flex items-center"
          onClick={async () => {
            try {
              const res = await axios.get(
                "http://localhost:5005/api/products/export",
                {
                  headers: authHeaders,
                  responseType: "blob",
                }
              );
              const blob = new Blob([res.data], { type: "text/csv" });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `products_${new Date()
                .toISOString()
                .slice(0, 10)}.csv`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              window.URL.revokeObjectURL(url);
            } catch (e) {
              setError("Export failed");
            }
          }}
          data-testid="admin-export-csv"
        >
          Export CSV
        </button>
      </div>
      {error && <p className="text-red-600 mb-2 text-sm">{error}</p>}
      {!loading && items.length === 0 && (
        <p className="text-sm text-gray-600">No products found.</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="font-semibold mb-2">Create Product</h2>
          <div className="space-y-2" data-testid="admin-create-form">
            <input
              className="w-full h-10 border rounded px-3"
              placeholder="Name"
              value={createForm.name}
              onChange={(e) =>
                setCreateForm({ ...createForm, name: e.target.value })
              }
              data-testid="admin-create-name"
            />
            <textarea
              className="w-full border rounded px-3 h-20"
              placeholder="Description"
              value={createForm.description}
              onChange={(e) =>
                setCreateForm({ ...createForm, description: e.target.value })
              }
              data-testid="admin-create-description"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-600">Price (R)</label>
                <input
                  className="mt-1 w-full h-10 border rounded px-3"
                  placeholder="Rands"
                  type="number"
                  min="0"
                  value={createForm.priceRands}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      priceRands: e.target.value.replace(/[^0-9]/g, ""),
                    })
                  }
                  data-testid="admin-create-price"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">Cents</label>
                <input
                  className="mt-1 w-full h-10 border rounded px-3"
                  placeholder="00"
                  type="number"
                  min="0"
                  max="99"
                  value={createForm.priceCents}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9]/g, "");
                    const n = Math.min(
                      99,
                      Math.max(0, parseInt(v || "0", 10) || 0)
                    );
                    setCreateForm({
                      ...createForm,
                      priceCents: String(n).padStart(2, "0"),
                    });
                  }}
                  data-testid="admin-create-cents"
                />
              </div>
            </div>
            <select
              className="w-full h-10 border rounded px-3"
              value={createForm.type}
              onChange={(e) =>
                setCreateForm({ ...createForm, type: e.target.value })
              }
              data-testid="admin-create-type"
            >
              <option value="">Select Type</option>
              {(allowedTypesForCategory(createForm.category)).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              className="w-full h-10 border rounded px-3"
              value={createForm.category}
              onChange={(e) => {
                const b = e.target.value;
                const types = allowedTypesForCategory(b);
                const t = types.includes(createForm.type) ? createForm.type : "";
                setCreateForm({ ...createForm, category: b, type: t });
              }}
              data-testid="admin-create-brand"
            >
              <option value="">Select Category</option>
              {ALLOWED_CATEGORIES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <input
              className="w-full h-10 border rounded px-3"
              placeholder="Quantity In Stock"
              type="number"
              min="0"
              value={createForm.quantityInStock}
              onChange={(e) =>
                setCreateForm({
                  ...createForm,
                  quantityInStock: e.target.value,
                })
              }
              data-testid="admin-create-qty"
            />
            <input
              className="w-full h-10 border rounded px-3"
              type="file"
              onChange={(e) =>
                setCreateForm({
                  ...createForm,
                  file: e.target.files?.[0] || null,
                })
              }
              data-testid="admin-create-file"
            />
            <button
              onClick={onCreate}
              className="w-full h-10 rounded justify-center flex items-center bg-red-600  hover:bg-red-700 transition  text-white"
              data-testid="admin-create-submit"
            >
              Create
            </button>
          </div>
        </div>

        <div>
          <h2 className="font-semibold mb-2">Existing Products</h2>
          <div
            className="mb-3 border rounded p-3"
            data-testid="admin-type-filters"
          >
            <div className="text-sm font-medium mb-2">Type</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
              {FILTER_TYPES.map((t) => (
                <label key={t} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="w-3 h-3"
                    checked={selectedTypes.includes(t)}
                    onChange={() => toggleTypeFilter(t)}
                    data-testid={`admin-filter-type-${t
                      .replace(/\s+/g, "-")
                      .toLowerCase()}`}
                  />
                  {t}
                </label>
              ))}
            </div>
            <div className="mt-2">
              <button
                className="h-8 px-3 rounded bg-red-600 text-white hover:bg-red-700 transition flex items-center justify-center"
                onClick={() => setSelectedTypes([])}
                data-testid="admin-filter-clear"
              >
                Clear Filters
              </button>
            </div>
          </div>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="space-y-3" data-testid="admin-products-list">
              {(selectedTypes.length
                ? items.filter((p) => selectedTypes.includes(p.type))
                : items
              ).map((p) => (
                <div
                  key={p.id}
                  className="border rounded p-3"
                  data-testid={`admin-product-row-${p.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-sm">
                        R
                        {(() => {
                          const n = Number(p.price || 0);
                          if (Number.isFinite(n)) return (n / 100).toFixed(2);
                          return p.price;
                        })()}
                      </div>
                    </div>
                    <div className="flex justify-center gap-2">
                      <button
                        className="h-8 px-3 rounded border hover:shadow-md transition flex items-center justify-center"
                        onClick={() => startEdit(p)}
                        data-testid={`admin-product-edit-${p.id}`}
                      >
                        Edit
                      </button>
                      <button
                        className="h-8 px-3 rounded bg-red-600 text-white hover:bg-red-700 transition flex items-center justify-center"
                        onClick={() => onDelete(p.id)}
                        data-testid={`admin-product-delete-${p.id}`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {editItem?.id === p.id && (
                    <div
                      className="mt-2 space-y-2"
                      data-testid={`admin-edit-form-${p.id}`}
                    >
                      <input
                        className="w-full h-10 border rounded px-3"
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                        data-testid="admin-edit-name"
                      />
                      <textarea
                        className="w-full border rounded px-3 h-20"
                        value={editForm.description}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            description: e.target.value,
                          })
                        }
                        data-testid="admin-edit-description"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-600">
                            Price (R)
                          </label>
                          <input
                            className="mt-1 w-full h-10 border rounded px-3"
                            type="number"
                            min="0"
                            value={editForm.priceRands}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                priceRands: e.target.value.replace(
                                  /[^0-9]/g,
                                  ""
                                ),
                              })
                            }
                            data-testid="admin-edit-price"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Cents</label>
                          <input
                            className="mt-1 w-full h-10 border rounded px-3"
                            type="number"
                            min="0"
                            max="99"
                            value={editForm.priceCents}
                            onChange={(e) => {
                              const v = e.target.value.replace(/[^0-9]/g, "");
                              const n = Math.min(
                                99,
                                Math.max(0, parseInt(v || "0", 10) || 0)
                              );
                              setEditForm({
                                ...editForm,
                                priceCents: String(n).padStart(2, "0"),
                              });
                            }}
                            data-testid="admin-edit-cents"
                          />
                        </div>
                      </div>
                      <select
                        className="w-full h-10 border rounded px-3"
                        value={editForm.type}
                        onChange={(e) =>
                          setEditForm({ ...editForm, type: e.target.value })
                        }
                        data-testid="admin-edit-type"
                      >
                        {(allowedTypesForCategory(editForm.category)).map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <select
                        className="w-full h-10 border rounded px-3"
                        value={editForm.category}
                        onChange={(e) => {
                          const b = e.target.value;
                          const types = allowedTypesForCategory(b);
                          const t = types.includes(editForm.type) ? editForm.type : "";
                          setEditForm({ ...editForm, category: b, type: t });
                        }}
                        data-testid="admin-edit-brand"
                      >
                        {ALLOWED_CATEGORIES.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                      <input
                        className="w-full h-10 border rounded px-3"
                        type="number"
                        min="0"
                        value={editForm.quantityInStock}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            quantityInStock: e.target.value,
                          })
                        }
                        data-testid="admin-edit-qty"
                      />
                      <input
                        className="w-full h-10 border rounded px-3"
                        type="file"
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            file: e.target.files?.[0] || null,
                          })
                        }
                        data-testid="admin-edit-file"
                      />
                      <div className="flex justify-center gap-2">
                        <button
                          className="h-10 px-4 rounded bg-red-600  hover:bg-red-700 transition  text-white justify-center flex items-center"
                          onClick={onUpdate}
                          data-testid="admin-edit-save"
                        >
                          Save
                        </button>
                        <button
                          className="h-10 px-4 rounded border justify-center flex items-center"
                          onClick={() => setEditItem(null)}
                          data-testid="admin-edit-cancel"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {/* Critical Stock Section */}
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Critical Stock</h3>
                <div className="space-y-2" data-testid="admin-critical-stock">
                  {items
                    .filter((p) => Number(p.quantityInStock) < 5)
                    .map((p) => {
                      let last = "Unknown";
                      try {
                        const map = JSON.parse(
                          localStorage.getItem("productUpdatedAt") || "{}"
                        );
                        if (map[String(p.id)])
                          last = new Date(map[String(p.id)]).toLocaleString();
                      } catch {}
                      return (
                        <div
                          key={`crit-${p.id}`}
                          className="border rounded p-3"
                          style={{ borderColor: "#ef4444" }}
                        >
                          <div className="flex justify-between items-center">
                            <div className="font-medium">{p.name}</div>
                            <div className="flex items-center gap-2">
                              <input
                                className="w-20 h-8 border rounded px-2"
                                type="number"
                                min="0"
                                value={String(
                                  stockEdits[String(p.id)] ?? p.quantityInStock
                                )}
                                onChange={(e) =>
                                  setStockEdits((prev) => ({
                                    ...prev,
                                    [String(p.id)]: e.target.value,
                                  }))
                                }
                                placeholder="Stock"
                                data-testid={`admin-critical-stock-input-${p.id}`}
                              />
                              <button
                                className="h-8 px-3 rounded bg-red-600  hover:bg-red-700 transition  text-white disabled:opacity-50 justify-center flex items-center"
                                disabled={savingStockId === p.id}
                                onClick={() => quickUpdateStock(p)}
                                data-testid={`admin-critical-stock-save-${p.id}`}
                              >
                                Save
                              </button>
                            </div>
                          </div>
                          <div className="text-xs text-gray-600">
                            Last Updated: {last}
                          </div>
                        </div>
                      );
                    })}
                  {items.filter((p) => Number(p.quantityInStock) < 5).length ===
                    0 && (
                    <div className="text-sm text-gray-600">
                      No critical stock items.
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-6 flex items-center gap-3">
                <button
                  className="h-8 px-3 rounded border disabled:opacity-50 justify-center flex items-center"
                  disabled={!meta || (meta?.pageNumber || page) <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  data-testid="admin-prev"
                >
                  Prev
                </button>
                <span className="text-sm">
                  Page {meta?.pageNumber || page} of {meta?.totalPages || 1}
                </span>
                <button
                  className="h-8 px-3 rounded border disabled:opacity-50 justify-center flex items-center"
                  disabled={
                    !meta ||
                    (meta?.pageNumber || page) >= (meta?.totalPages || 1)
                  }
                  onClick={() => setPage((p) => p + 1)}
                  data-testid="admin-next"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProducts;
