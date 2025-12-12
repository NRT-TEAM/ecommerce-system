import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { ShopContext } from "../context/ShopContext";

const AdminOrders = () => {
  const { token, isAdmin, currency } = useContext(ShopContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const load = async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError("");
    try {
      const res = await axios.get("http://localhost:5005/api/orders/all", {
        headers,
      });
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token, isAdmin]);

  const onUpdateStatus = async (id, status) => {
    try {
      await axios.put(
        `http://localhost:5005/api/orders/${id}/status`,
        { status },
        { headers }
      );
      await load();
      try {
        window.dispatchEvent(
          new CustomEvent("toast", {
            detail: {
              type: "success",
              title: "Order",
              message: `Status updated for Order #${id}`,
            },
          })
        );
      } catch {}
    } catch (e) {
      const msg =
        e?.response?.data?.title || `Failed to update status for Order #${id}`;
      setError(msg);
      try {
        window.dispatchEvent(
          new CustomEvent("toast", {
            detail: {
              type: "error",
              title: "Order",
              message: msg,
            },
          })
        );
      } catch {}
    }
  };

  const onRefund = async (id) => {
    try {
      await axios.post(
        `http://localhost:5005/api/orders/${id}/refund`,
        {},
        { headers }
      );
      await load();
      try {
        window.dispatchEvent(
          new CustomEvent("toast", {
            detail: {
              type: "success",
              title: "Order",
              message: `Refund initiated for Order #${id}`,
            },
          })
        );
      } catch {}
    } catch (e) {
      const msg = e?.response?.data?.title || `Failed to refund Order #${id}`;
      setError(msg);
      try {
        window.dispatchEvent(
          new CustomEvent("toast", {
            detail: {
              type: "error",
              title: "Order",
              message: msg,
            },
          })
        );
      } catch {}
    }
  };

  const onDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5005/api/orders/${id}/admin`, {
        headers,
      });
      await load();
      try {
        window.dispatchEvent(
          new CustomEvent("toast", {
            detail: {
              type: "success",
              title: "Order",
              message: `Deleted Order #${id}`,
            },
          })
        );
      } catch {}
    } catch (e) {
      const msg = e?.response?.data?.title || `Failed to delete Order #${id}`;
      setError(msg);
      try {
        window.dispatchEvent(
          new CustomEvent("toast", {
            detail: { type: "error", title: "Order", message: msg },
          })
        );
      } catch {}
    }
  };

  if (!isAdmin)
    return (
      <div className="container mx-auto px-4 py-8">Admin access required.</div>
    );

  return (
    <div
      className="container mx-auto px-4 py-8"
      data-testid="admin-orders-page"
    >
      <h1 className="text-2xl font-bold mb-4">Admin Orders</h1>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <div className="space-y-3">
        {orders.map((o) => (
          <div
            key={o.id}
            className="border rounded p-3"
            data-testid={`admin-order-row-${o.id}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Order #{o.id}</div>
                <div className="text-sm">Buyer: {o.buyerId}</div>
                <div className="text-sm">
                  Date: {new Date(o.orderDate).toLocaleString()}
                </div>
                <div className="text-sm">Status: {o.orderStatus}</div>
              </div>
              <div className="font-semibold">
                Total: {currency}
                {o.total}
              </div>
            </div>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {o.orderItems?.map((it, idx) => (
                <div
                  key={`${o.id}-${idx}`}
                  className="flex items-center gap-2 text-sm"
                >
                  {it.pictureUrl && (
                    <img
                      src={
                        it.pictureUrl.startsWith("/")
                          ? `http://localhost:5005${it.pictureUrl}`
                          : it.pictureUrl
                      }
                      className="w-10 h-10 rounded object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{it.name}</div>
                    <div>Qty: {it.quantity}</div>
                  </div>
                  <div>
                    {currency}
                    {it.price}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2 justify-center">
              <select
                className="h-10 border rounded px-3"
                value={o.orderStatus}
                onChange={(e) => onUpdateStatus(o.id, e.target.value)}
                data-testid={`admin-order-status-select-${o.id}`}
              >
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Packed">Packed</option>
                <option value="PaymentReceived">PaymentReceived</option>
                <option value="Dispatched">Dispatched</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Returned">Returned</option>
              </select>
              <button
                className="h-10 px-4 rounded bg-red-600  hover:bg-red-700 transition text-white justify-center flex items-center"
                onClick={() => onRefund(o.id)}
                data-testid={`admin-order-refund-${o.id}`}
              >
                Refund
              </button>
              <button
                className="h-10 px-4 rounded border justify-center flex items-center"
                onClick={() => onDelete(o.id)}
                aria-label={`Delete Order ${o.id}`}
                data-testid={`admin-order-delete-${o.id}`}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {orders.length === 0 && !loading && <div>No orders found.</div>}
      </div>
    </div>
  );
};

export default AdminOrders;
