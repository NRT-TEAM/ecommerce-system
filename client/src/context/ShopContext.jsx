import { createContext, useEffect, useMemo, useState } from "react";
import axios from "axios";

// Create the context
export const ShopContext = createContext();

// Provider component
const ShopContextProvider = ({ children }) => {
  const currency = "R";
  const delivery_fee = 10;

  // Search state
  const [search, setSearch] = useState(""); // Desktop
  const [showSearch, setShowSearch] = useState(false); // Desktop results
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false); // Mobile
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [basket, setBasket] = useState(null);
  const [basketLoading, setBasketLoading] = useState(true);
  const MAX_PER_ITEM = 10;
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [userName, setUserName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [toasts, setToasts] = useState([]);
  const showToast = ({ type, message, title }) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message, title }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const [lastSearchTerm, setLastSearchTerm] = useState("");
  const normalize = (s) => (s || "").toLowerCase().trim();
  const getSearchResults = (term) => {
    const q = normalize(term ?? lastSearchTerm);
    if (!q) return products.slice();
    return products.filter((p) => normalize(p.name).includes(q));
  };

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get("http://localhost:5005/api/products");
        const body = res.data;
        const list = Array.isArray(body)
          ? body
          : Array.isArray(body?.items)
          ? body.items
          : [];
        setProducts(list);
      } catch (err) {
        setProducts([]);
        setError("Unable to load products from API");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const d = e?.detail || {};
      if (!d) return;
      showToast({ type: d.type, title: d.title, message: d.message });
    };
    window.addEventListener("toast", handler);
    return () => window.removeEventListener("toast", handler);
  }, []);

  useEffect(() => {
    fetchBasket();
  }, [token]);

  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: "http://localhost:5005/api",
      withCredentials: true,
    });
    if (token)
      instance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    return instance;
  }, [token]);

  useEffect(() => {
    if (!token) {
      setUserName("");
      setIsAdmin(false);
      return;
    }
    try {
      const parts = token.split(".");
      const payload = JSON.parse(
        atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
      );
      const roleClaim =
        payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
      const nameClaim =
        payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
        payload["unique_name"] ||
        payload["name"];
      setUserName(nameClaim || "");
      if (Array.isArray(roleClaim)) setIsAdmin(roleClaim.includes("Admin"));
      else setIsAdmin(roleClaim === "Admin");
    } catch {
      setUserName("");
      setIsAdmin(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    try {
      const raw = localStorage.getItem("guestCheckout");
      if (!raw) return;
      const data = JSON.parse(raw);
      const addr = data?.address || {};
      const payload = {
        FullName: addr.fullName || "",
        Address1: addr.address1 || "",
        Address2: addr.address2 || "",
        City: addr.city || "",
        State: addr.state || "",
        Zip: addr.zip || "",
        Country: addr.country || "",
      };
      api
        .put("/account/savedAddress", payload)
        .then(() => {
          showToast({
            type: "success",
            title: "Profile",
            message: "Details synced",
          });
          localStorage.removeItem("guestCheckout");
        })
        .catch(() => {
          showToast({
            type: "error",
            title: "Profile",
            message: "Sync failed",
          });
        });
    } catch {}
  }, [token]);

  const fetchBasket = async () => {
    try {
      setBasketLoading(true);
      const res = await api.get("/basket");
      setBasket(res.data);
    } catch (e) {
      setBasket(null);
    } finally {
      setBasketLoading(false);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    try {
      const currentQty =
        (basket?.items || []).find((i) => i.productId === productId)
          ?.quantity || 0;
      const p = (products || []).find((x) => (x?.id ?? x?._id) === productId);
      const stock =
        typeof p?.quantityInStock === "number" ? p.quantityInStock : Infinity;
      const maxByStock = Math.max(0, stock - currentQty);
      const maxByPerItem = Math.max(0, MAX_PER_ITEM - currentQty);
      const allowed = Math.min(quantity, maxByStock, maxByPerItem);
      if (!allowed || allowed <= 0) {
        const available = Math.max(0, stock - currentQty);
        showToast({
          type: "error",
          title: "Stock limit",
          message: `Cannot add more than ${
            stock === Infinity ? MAX_PER_ITEM : stock
          } units of this item - only ${available} available`,
        });
        return false;
      }
      if (allowed < quantity) {
        const available = Math.max(0, stock - currentQty);
        showToast({
          type: "error",
          title: "Stock limit",
          message: `Cannot add more than ${
            stock === Infinity ? MAX_PER_ITEM : stock
          } units of this item - only ${available} available`,
        });
      }
      await api.post(`/basket?productId=${productId}&quantity=${allowed}`);
      await fetchBasket();
      return true;
    } catch (e) {
      const msg = e?.response?.data?.title || "Unable to add to cart";
      showToast({ type: "error", title: "Cart", message: msg });
      return false;
    }
  };

  const removeFromCart = async (productId, quantity = 1) => {
    try {
      // Find the current quantity
      const currentQty =
        (basket?.items || []).find((i) => i.productId === productId)
          ?.quantity || 0;

      await api.delete(`/basket?productId=${productId}&quantity=${quantity}`);

      await fetchBasket();
      return true;
    } catch (e) {
      return false;
    }
  };

  const createPaymentIntent = async () => {
    const res = await api.post("/payments");
    setBasket(res.data);
    return res.data;
  };

  const checkout = async ({
    email,
    shippingAddress,
    saveAddress = false,
    deliveryOption,
    paymentType,
    creditTermMonths,
  }) => {
    try {
      const payload = {
        email,
        shippingAddress,
        saveAddress,
        deliveryOption,
        paymentType,
        creditTermMonths,
      };
      const res = await api.post("/orders", payload);
      await fetchBasket();
      return res.data;
    } catch (e) {
      throw e;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
  };

  const basketCount = useMemo(() => {
    return (basket?.items || []).reduce((sum, i) => sum + (i.quantity || 0), 0);
  }, [basket]);

  // Context value
  const value = {
    products,
    currency,
    delivery_fee,

    // Desktop search
    search,
    setSearch,
    showSearch,
    setShowSearch,
    lastSearchTerm,
    setLastSearchTerm,
    getSearchResults,

    // Mobile search
    mobileSearchOpen,
    setMobileSearchOpen,

    loading,
    error,
    basket,
    basketLoading,
    fetchBasket,
    addToCart,
    removeFromCart,
    checkout,
    createPaymentIntent,
    basketCount,
    MAX_PER_ITEM,
    token,
    setToken,
    userName,
    isAdmin,
    logout,
    toasts,
    showToast,
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};

export default ShopContextProvider;
