import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { ShopContext } from "../context/ShopContext";

const Profile = () => {
  const { token, userName, isAdmin, logout, setToken } =
    useContext(ShopContext);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      setLoading(true);
      setError("");
      try {
        const me = await axios.get(
          "http://localhost:5005/api/account/currentUser",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setEmail(me?.data?.email || "");
        setUsername(userName || "");
        const addr = await axios.get(
          "http://localhost:5005/api/account/savedAddress",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setAddress(addr?.data || null);
        try {
          const myOrders = await axios.get("http://localhost:5005/api/orders", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setOrders(Array.isArray(myOrders?.data) ? myOrders.data : []);
        } catch {}
      } catch {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4" data-testid="profile-title">
        Profile
      </h1>
      {!token && <div>Please login to view your profile.</div>}
      {token && (
        <div className="space-y-3">
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div className="border rounded p-3">
            <div className="text-sm">Username</div>
            <input
              className="mt-1 w-full h-10 border rounded-md px-3"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              data-testid="profile-username"
            />
          </div>
          <div className="border rounded p-3">
            <div className="text-sm">Email</div>
            <input
              className="mt-1 w-full h-10 border rounded-md px-3"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid="profile-email"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmOpen(true)}
              className="h-10 px-4 rounded bg-black hover:bg-gray-700 transition text-white justify-center flex items-center"
              data-testid="profile-save"
            >
              Save Profile
            </button>
            <button
              onClick={() => logout()}
              className="h-10 px-4 rounded bg-red-600  hover:bg-red-700 transition   text-white justify-center flex items-center"
              data-testid="profile-logout"
            >
              Logout
            </button>
          </div>
          <div className="border rounded p-3">
            <div className="text-sm">Role</div>
            <div className="font-medium" data-testid="profile-role">
              {isAdmin ? "Admin" : "Member"}
            </div>
          </div>
          <div className="border rounded p-3">
            <div className="text-sm mb-1">Saved Address</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <span className="text-xs text-gray-600">Full Name</span>
                <input
                  className="mt-1 w-full h-10 border rounded-md px-3"
                  value={address?.fullName || ""}
                  onChange={(e) =>
                    setAddress({ ...(address || {}), fullName: e.target.value })
                  }
                  data-testid="profile-address-fullname"
                />
              </div>
              <div>
                <span className="text-xs text-gray-600">Address 1</span>
                <input
                  className="mt-1 w-full h-10 border rounded-md px-3"
                  value={address?.address1 || ""}
                  onChange={(e) =>
                    setAddress({ ...(address || {}), address1: e.target.value })
                  }
                  data-testid="profile-address-address1"
                />
              </div>
              <div>
                <span className="text-xs text-gray-600">Address 2</span>
                <input
                  className="mt-1 w-full h-10 border rounded-md px-3"
                  value={address?.address2 || ""}
                  onChange={(e) =>
                    setAddress({ ...(address || {}), address2: e.target.value })
                  }
                  data-testid="profile-address-address2"
                />
              </div>
              <div>
                <span className="text-xs text-gray-600">City</span>
                <input
                  className="mt-1 w-full h-10 border rounded-md px-3"
                  value={address?.city || ""}
                  onChange={(e) =>
                    setAddress({ ...(address || {}), city: e.target.value })
                  }
                  data-testid="profile-address-city"
                />
              </div>
              <div>
                <span className="text-xs text-gray-600">Province</span>
                <input
                  className="mt-1 w-full h-10 border rounded-md px-3"
                  value={address?.state || ""}
                  onChange={(e) =>
                    setAddress({ ...(address || {}), state: e.target.value })
                  }
                  data-testid="profile-address-state"
                />
              </div>
              <div>
                <span className="text-xs text-gray-600">Zip</span>
                <input
                  className="mt-1 w-full h-10 border rounded-md px-3"
                  value={address?.zip || ""}
                  onChange={(e) =>
                    setAddress({ ...(address || {}), zip: e.target.value })
                  }
                  data-testid="profile-address-zip"
                />
              </div>
              <div>
                <span className="text-xs text-gray-600">Country</span>
                <input
                  className="mt-1 w-full h-10 border rounded-md px-3"
                  value={address?.country || ""}
                  onChange={(e) =>
                    setAddress({ ...(address || {}), country: e.target.value })
                  }
                  data-testid="profile-address-country"
                />
              </div>
            </div>
            <button
              onClick={async () => {
                try {
                  await axios.put(
                    "http://localhost:5005/api/account/savedAddress",
                    {
                      FullName: address?.fullName || "",
                      Address1: address?.address1 || "",
                      Address2: address?.address2 || "",
                      City: address?.city || "",
                      State: address?.state || "",
                      Zip: address?.zip || "",
                      Country: address?.country || "",
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                  );
                  try {
                    window.dispatchEvent(
                      new CustomEvent("toast", {
                        detail: {
                          type: "success",
                          title: "Profile",
                          message: "Saved Address updated",
                        },
                      })
                    );
                  } catch {}
                } catch (e) {
                  const msg =
                    e?.response?.data?.title || "Saved Address update failed";
                  setError(msg);
                  try {
                    window.dispatchEvent(
                      new CustomEvent("toast", {
                        detail: {
                          type: "error",
                          title: "Profile",
                          message: msg,
                        },
                      })
                    );
                  } catch {}
                }
              }}
              className="mt-2 h-10 px-4 rounded bg-red-600  hover:bg-red-700 transition text-white justify-center flex items-center"
              data-testid="profile-save-address"
            >
              Save Address
            </button>
          </div>

          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">Order History</h2>
            {!orders.length ? (
              <div className="text-sm text-gray-600">No orders yet.</div>
            ) : (
              <div className="space-y-2" data-testid="profile-orders-list">
                {orders.map((o) => (
                  <div
                    key={o.id}
                    className="border rounded p-3"
                    data-testid={`profile-order-${o.id}`}
                  >
                    <div className="flex justify-between">
                      <div className="font-medium">Order #{o.id}</div>
                      <div className="text-sm">
                        {new Date(o.orderDate).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-sm">Status: {o.orderStatus}</div>
                    <div className="text-sm">Total: R{o.total}</div>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
                      {o.orderItems.map((it, idx) => (
                        <div
                          key={idx}
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
                          <span>
                            {it.name} x {it.quantity}
                          </span>
                          <span className="ml-auto">R{it.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {confirmOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/40 z-[1000]"
          data-testid="profile-confirm-modal"
        >
          <div className="bg-white rounded-xl p-6 w-11/12 max-w-sm border">
            <h3 className="text-lg font-semibold mb-2">Confirm Changes</h3>
            <p className="text-sm text-gray-700 mb-4">
              Update username and email?
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="h-9 px-4 rounded border"
                onClick={() => setConfirmOpen(false)}
                data-testid="profile-confirm-cancel"
              >
                Cancel
              </button>
              <button
                className="h-9 px-4 rounded bg-black text-white"
                onClick={async () => {
                  const newEmail = (email || "").trim();
                  const newUsername = (username || "").trim();
                  setError("");
                  if (newEmail && !/.+@.+\..+/.test(newEmail)) {
                    setError("Please enter a valid email address");
                    return;
                  }
                  try {
                    const res = await axios.put(
                      "http://localhost:5005/api/account/profile",
                      { userName: newUsername, email: newEmail },
                      { headers: { Authorization: `Bearer ${token}` } }
                    );
                    if (res?.data?.token) {
                      localStorage.setItem("token", res.data.token);
                      setToken(res.data.token);
                    }
                    try {
                      window.dispatchEvent(
                        new CustomEvent("toast", {
                          detail: {
                            type: "success",
                            title: "Profile",
                            message: "Updated",
                          },
                        })
                      );
                    } catch {}
                    setConfirmOpen(false);
                  } catch (e) {
                    const msg = e?.response?.data?.title || "Update failed";
                    setError(msg);
                    try {
                      window.dispatchEvent(
                        new CustomEvent("toast", {
                          detail: {
                            type: "error",
                            title: "Profile",
                            message: msg,
                          },
                        })
                      );
                    } catch {}
                  }
                }}
                data-testid="profile-confirm-submit"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
