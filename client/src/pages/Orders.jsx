import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { ShopContext } from "../context/ShopContext";

const Orders = () => {
  const { token } = useContext(ShopContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmingId, setConfirmingId] = useState(null);
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get("http://localhost:5005/api/orders", { headers });
        setOrders(Array.isArray(res.data) ? res.data : []);
      } catch {
        setError("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  return (
    <div className="container mx-auto px-4 py-8" data-testid="orders-page">
      <h1 className="text-2xl font-bold mb-4" data-testid="orders-title">Your Orders</h1>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <div className="space-y-3" data-testid="orders-list">
        {orders.map((o) => (
          <div key={o.id} className="border rounded p-3" data-testid={`orders-row-${o.id}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Order #{o.id}</div>
                <div className="text-sm">{new Date(o.orderDate).toLocaleString()}</div>
                <div className="text-sm">Status: {o.orderStatus}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="font-semibold">Total: R{o.total}</div>
                <button
                  className="h-8 px-3 rounded border text-red-600 hover:bg-red-50"
                  aria-label={`Delete Order ${o.id}`}
                  onClick={() => setConfirmingId(o.id)}
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="mt-2 text-sm">
              {o.orderItems?.map((it) => (
                <div key={`${o.id}-${it.productId}`} className="flex justify-between">
                  <span>{it.name} x {it.quantity}</span>
                  <span>R{it.price}</span>
                </div>
              ))}
            </div>
            {confirmingId === o.id && (
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={`orders-confirm-title-${o.id}`}
                className="mt-3 border rounded p-3 bg-red-50"
              >
                <div id={`orders-confirm-title-${o.id}`} className="font-semibold">Confirm deletion</div>
                <div className="text-sm text-gray-700">This will remove the order from your history.</div>
                <div className="mt-2 flex gap-2">
                  <button
                    className="h-8 px-3 rounded bg-red-600 text-white"
                    onClick={async () => {
                      try {
                        await axios.delete(`http://localhost:5005/api/orders/${o.id}`, { headers });
                        setOrders((prev) => prev.filter((x) => x.id !== o.id));
                        setConfirmingId(null);
                        try {
                          window.dispatchEvent(new CustomEvent("toast", { detail: { type: "success", title: "Order", message: `Deleted Order #${o.id}` } }));
                        } catch {}
                      } catch (e) {
                        const msg = e?.response?.data?.title || `Failed to delete Order #${o.id}`;
                        setError(msg);
                        try {
                          window.dispatchEvent(new CustomEvent("toast", { detail: { type: "error", title: "Order", message: msg } }));
                        } catch {}
                      }
                    }}
                  >
                    Confirm
                  </button>
                  <button
                    className="h-8 px-3 rounded border"
                    onClick={() => setConfirmingId(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {orders.length === 0 && !loading && <div>No orders yet.</div>}
      </div>
    </div>
  );
};

export default Orders;
