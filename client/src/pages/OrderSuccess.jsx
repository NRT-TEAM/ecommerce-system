import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ShopContext } from "../context/ShopContext";

const OrderSuccess = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, currency } = useContext(ShopContext);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`http://localhost:5005/api/orders/${id}`, {
          headers,
        });
        setOrder(res.data);
      } catch {
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const resolvePending = async () => {
    if (!order?.paymentIntentId) return;
    setResolving(true);
    try {
      await axios.post("http://localhost:5005/api/payments/webhook", {
        id: order.paymentIntentId,
        success: true,
      });
      const res = await axios.get(`http://localhost:5005/api/orders/${id}`, {
        headers,
      });
      setOrder(res.data);
    } catch (e) {
      try {
        window.dispatchEvent(
          new CustomEvent("toast", {
            detail: {
              type: "error",
              title: "Order",
              message: "Failed to resolve payment status",
            },
          })
        );
      } catch {}
    } finally {
      setResolving(false);
    }
  };

  if (loading)
    return (
      <div className="p-8" data-testid="order-success-loading">
        Processing your order...
      </div>
    );
  if (!order)
    return (
      <div className="p-8" data-testid="order-success-not-found">
        Order not found
      </div>
    );

  return (
    <div
      className="container mx-auto px-4 py-8"
      data-testid="order-success-page"
    >
      <h1 className="text-2xl font-bold mb-2" data-testid="order-success-title">
        Order Success
      </h1>
      <p
        className="text-sm text-gray-600 mb-4"
        data-testid="order-success-meta"
      >
        Order #{order.id} • {new Date(order.orderDate).toLocaleString()}
      </p>
      <div
        className="border rounded p-3 mb-4"
        data-testid="order-success-summary"
      >
        <div>
          Status:{" "}
          <span className="font-medium" data-testid="order-success-status">
            {order.orderStatus}
          </span>
        </div>
        <div>
          Total:{" "}
          <span className="font-medium" data-testid="order-success-total">
            {currency}
            {order.total}
          </span>
        </div>
        {order.orderStatus !== "PaymentReceived" && order.paymentIntentId && (
          <button
            onClick={resolvePending}
            disabled={resolving}
            className="mt-2 h-10 px-4 rounded bg-black text-white"
            data-testid="order-success-resolve"
          >
            {resolving ? "Resolving..." : "Resolve Pending"}
          </button>
        )}
        {order.orderStatus !== "PaymentReceived" && !order.paymentIntentId && (
          <div className="mt-2 text-sm text-gray-600">
            Pending payment cannot be resolved for this order.
          </div>
        )}
      </div>
      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-2"
        data-testid="order-success-items"
      >
        {order.orderItems.map((it, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 border p-2"
            data-testid={`order-success-item-${idx + 1}`}
          >
            {it.pictureUrl && (
              <img
                src={
                  it.pictureUrl.startsWith("/")
                    ? `http://localhost:5005${it.pictureUrl}`
                    : it.pictureUrl
                }
                className="w-12 h-12 rounded object-cover"
              />
            )}
            <div className="flex-1">
              <div className="font-medium text-sm">{it.name}</div>
              <div className="text-xs">Qty: {it.quantity}</div>
            </div>
            <div className="text-sm">
              {currency}
              {it.price}
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => navigate("/orders")}
        className="mt-4 h-10 px-4 rounded border"
        data-testid="order-success-view-all"
      >
        View all orders
      </button>
    </div>
  );
};

export default OrderSuccess;
