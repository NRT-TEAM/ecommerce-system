import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { ShopContext } from "../context/ShopContext";

const AdminReports = () => {
  const { token, isAdmin, currency } = useContext(ShopContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    const load = async () => {
      if (!isAdmin) return;
      setLoading(true);
      setError("");
      try {
        const res = await axios.get("http://localhost:5005/api/adminreports/sales", { headers });
        setData(res?.data || null);
      } catch {
        setError("Failed to load reports");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, isAdmin]);

  if (!isAdmin) return <div className="container mx-auto px-4 py-8">Admin access required.</div>;

  return (
    <div className="container mx-auto px-4 py-8" data-testid="admin-reports-page">
      <h1 className="text-2xl font-bold mb-4">Admin Reports</h1>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {data && (
        <div className="space-y-6">
          <div className="border rounded p-3" data-testid="admin-report-summary">
            <div className="font-medium">Last {data.rangeDays} days</div>
            <div className="text-sm">Total Sales: <span className="font-semibold" data-testid="admin-report-total-sales">{currency}{data.totalSales}</span></div>
          </div>

          <div className="border rounded p-3">
            <div className="font-medium mb-2">Recent Sales</div>
            <div className="space-y-2" data-testid="admin-report-recent-sales">
              {(data.recentSales || []).map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <div>
                    <div>Order #{s.id}</div>
                    <div>{new Date(s.orderDate).toLocaleString()}</div>
                    <div>Buyer: {s.buyerId}</div>
                    <div>Status: {s.status}</div>
                  </div>
                  <div className="font-semibold">{currency}{s.total}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="border rounded p-3">
            <div className="font-medium mb-2">Inventory Levels</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2" data-testid="admin-report-inventory-table">
              {(data.inventoryLevels || []).map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm border rounded p-2">
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-gray-600">{p.brand} • {p.type}</div>
                  </div>
                  <div>Stock: {p.quantityInStock}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
