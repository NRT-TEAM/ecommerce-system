import React from "react";
import { Routes, Route } from "react-router-dom";

import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";

import Home from "./pages/Home";
import About from "./pages/About";
import Cart from "./pages/Cart";
import Product from "./pages/Product";
import Orders from "./pages/Orders";
import Collection from "./pages/Collection";
import Contact from "./pages/Contact";
import Partners from "./components/common/Partners";
import ScrollToTop from "./features/ScrollToTop";
import AdminProducts from "./pages/AdminProducts";
import AdminOrders from "./pages/AdminOrders";
import AdminReports from "./pages/AdminReports";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import TermsConditions from "./pages/Terms&Conditions";
import RefundPolicy from "./pages/RefundPolicy";
import ConditionOfUse from "./pages/ConditionOfUse";
import { useContext } from "react";
import { ShopContext } from "./context/ShopContext";

const AppContent = () => {
  const { toasts } = useContext(ShopContext);
  return (
    <>
      <Navbar />
      <ScrollToTop />

      <Routes>
        <Route path="/auth/:mode" element={<Auth />} />
      </Routes>

      {/* Page layout */}
      <div className="pt-[88px] md:pt-[96px] px-4 md:px-[7vw] lg:px-[9vw] fade-in-up">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/product/:id" element={<Product />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/collection" element={<Collection />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/terms" element={<TermsConditions />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/conditions-of-use" element={<ConditionOfUse />} />
        </Routes>

        <Footer />
      </div>

      <div
        className="fixed top-20 right-2 z-[2000] space-y-2"
        data-testid="toast-container"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`min-w-[240px] max-w-[360px] px-4 py-3 rounded shadow-lg border ${
              t.type === "success"
                ? "bg-green-600 text-white border-green-700"
                : "bg-red-600 text-white border-red-700"
            }`}
            data-testid="toast-message"
          >
            <div className="text-sm font-semibold">
              {t.title || (t.type === "success" ? "Success" : "Error")}
            </div>
            <div className="text-xs">{t.message}</div>
          </div>
        ))}
      </div>
    </>
  );
};

const App = () => {
  return <AppContent />;
};

export default App;
