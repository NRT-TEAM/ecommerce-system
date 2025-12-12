import React, { useEffect, useState, useContext } from "react";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";

const Cart = () => {
  const {
    basket,
    basketLoading,
    fetchBasket,
    checkout,
    currency,
    addToCart,
    removeFromCart,
    createPaymentIntent,
    token,
    MAX_PER_ITEM,
  } = useContext(ShopContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState({
    fullName: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
    country: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [deliveryOption, setDeliveryOption] = useState("standard");
  const [paymentType, setPaymentType] = useState("cash");
  const [creditMonths, setCreditMonths] = useState(12);
  const [saveAddress, setSaveAddress] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [cellphone, setCellphone] = useState("");

  useEffect(() => {
    fetchBasket();
  }, []);

  useEffect(() => {
    const init = async () => {
      if (!token) return;
      try {
        const me = await axios.get(
          "http://localhost:5005/api/account/currentUser",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setEmail(me?.data?.email || "");
        const addr = await axios.get(
          "http://localhost:5005/api/account/savedAddress",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (addr?.data) {
          setAddress({
            fullName: addr.data.fullName || "",
            address1: addr.data.address1 || "",
            address2: addr.data.address2 || "",
            city: addr.data.city || "",
            state: addr.data.state || "",
            zip: addr.data.zip || "",
            country: addr.data.country || "",
          });
        }
      } catch {}
    };
    init();
  }, [token]);

  const subtotal =
    basket?.items?.reduce((sum, i) => sum + i.price * i.quantity, 0) || 0;
  const baseDelivery = subtotal > 10000 ? 0 : 500;
  const deliveryFee =
    deliveryOption === "express"
      ? 1200
      : deliveryOption === "pickup"
      ? 0
      : baseDelivery;
  const total = subtotal + deliveryFee;

  const handleCheckout = async () => {
    setSaving(true);
    setMessage("");
    if (
      !email ||
      !cellphone ||
      !address.fullName ||
      !address.address1 ||
      !address.city ||
      !address.state ||
      !address.zip ||
      !address.country ||
      address.zip.length !== 4
    ) {
      setSaving(false);
      setShowErrors(true);
      setMessage("Please complete all required fields.");
      setErrorOpen(true);
      try {
        window.dispatchEvent(
          new CustomEvent("toast", {
            detail: {
              type: "error",
              title: "Checkout",
              message: "Required fields missing",
            },
          })
        );
      } catch {}
      return;
    }
    try {
      if (!token) {
        const data = {
          email,
          cellphone,
          address,
          deliveryOption,
          paymentType,
          creditMonths,
        };
        localStorage.setItem("guestCheckout", JSON.stringify(data));
      }
      let intentId = null;
      let clientSecret = null;
      if (token) {
        const intentBasket = await createPaymentIntent();
        intentId = intentBasket?.paymentIntentId || null;
        clientSecret = intentBasket?.clientSecret || null;
      }
      const orderId = await checkout({
        email,
        shippingAddress: {
          FullName: address.fullName,
          Address1: address.address1,
          Address2: address.address2,
          City: address.city,
          State: address.state,
          Zip: address.zip,
          Country: address.country,
        },
        saveAddress,
        deliveryOption,
        paymentType,
        creditTermMonths:
          paymentType === "credit"
            ? Math.max(1, Math.min(36, creditMonths))
            : undefined,
      });
      if (intentId && clientSecret) {
        try {
          await axios.post("http://localhost:5005/api/payments/webhook", {
            id: intentId,
            clientSecret,
          });
        } catch {}
      }
      try {
        const final = await axios.get(
          `http://localhost:5005/api/orders/${orderId}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
        setMessage("");
      } catch {}
      try {
        window.dispatchEvent(
          new CustomEvent("toast", {
            detail: {
              type: "success",
              title: "Checkout",
              message: "Order placed",
            },
          })
        );
      } catch {}
      navigate(`/profile`);
    } catch (e) {
      setMessage("Checkout failed. Please try again.");
      try {
        window.dispatchEvent(
          new CustomEvent("toast", {
            detail: {
              type: "error",
              title: "Checkout",
              message: "Checkout failed",
            },
          })
        );
      } catch {}
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6" data-testid="cart-title">
        Shopping Cart
      </h1>
      {basketLoading ? (
        <p>Loading cart...</p>
      ) : !basket || basket.items?.length === 0 ? (
        <p className="text-gray-600">Your cart is empty.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            {basket.items.map((item) => (
              <div
                key={item.productId}
                className="flex items-center gap-4 border rounded-xl p-3"
                data-testid={`cart-item-${item.productId}`}
              >
                {item.pictureUrl && (
                  <img
                    src={
                      item.pictureUrl.startsWith("/")
                        ? `http://localhost:5005${item.pictureUrl}`
                        : item.pictureUrl
                    }
                    className="w-20 h-20 rounded object-cover"
                  />
                )}
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <button
                      className="h-8 w-8 rounded-md border justify-center flex items-center disabled:opacity-50"
                      onClick={() => removeFromCart(item.productId, 1)}
                      data-testid={`cart-item-dec-${item.productId}`}
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      className="h-8 w-8 rounded-md border justify-center flex items-center disabled:opacity-50"
                      disabled={
                        item.quantity >= MAX_PER_ITEM ||
                        (typeof item.quantityInStock === "number" &&
                          item.quantity >= item.quantityInStock)
                      }
                      onClick={() => addToCart(item.productId, 1)}
                      data-testid={`cart-item-inc-${item.productId}`}
                    >
                      +
                    </button>
                  </div>
                  {typeof item.quantityInStock === "number" && (
                    <p
                      className="mt-1 text-xs text-gray-600"
                      data-testid={`cart-item-remaining-${item.productId}`}
                    >
                      Remaining:{" "}
                      {Math.max(0, item.quantityInStock - item.quantity)}
                    </p>
                  )}
                </div>
                <div className="font-semibold">
                  {currency}
                  {item.price}
                </div>
                <button
                  className="ml-2 text-sm text-red-600 hover:underline"
                  onClick={() => removeFromCart(item.productId, item.quantity)}
                  data-testid={`cart-item-remove-${item.productId}`}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="border rounded-xl p-4">
            <p className="font-semibold mb-2">Order Summary</p>
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>
                {currency}
                {subtotal}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Delivery</span>
              <span>
                {currency}
                {deliveryFee}
              </span>
            </div>
            <div className="flex justify-between font-semibold mt-2">
              <span>Total</span>
              <span>
                {currency}
                {total}
              </span>
            </div>

            <div className="mt-4">
              <label className="text-sm text-gray-600">Delivery Option</label>
              <select
                className="mt-1 w-full h-10 border rounded-md px-3"
                data-tooltip-id="tip-deliveryOptions"
                data-tooltip-content="standard delivery free for orders over R10000"
                value={deliveryOption}
                onChange={(e) => setDeliveryOption(e.target.value)}
                data-testid="cart-delivery-select"
              >
                <option value="standard" title="Ships within 1-5 Business days">
                  Standard (R{baseDelivery})
                </option>
                <option value="express" title="Ships within 1-2 Business days">
                  Express (R1200)
                </option>
                <option value="pickup" title="No extra delivery fees">
                  Pickup (R0)
                </option>
              </select>
              <div className="mt-2 text-xs text-gray-600 flex flex-wrap gap-3">
                <span
                  className="underline cursor-pointer"
                  data-tooltip-id="tip-standard"
                  data-tooltip-content="Ships within 1-5 business days"
                >
                  Standard
                </span>
                <span
                  className="underline cursor-pointer"
                  data-tooltip-id="tip-express"
                  data-tooltip-content="Ships within 1-2 working days"
                >
                  Express
                </span>
                <span
                  className="underline cursor-pointer"
                  data-tooltip-id="tip-pickup"
                  data-tooltip-content="No extra delivery fees"
                >
                  Pickup
                </span>
              </div>
              <Tooltip id="tip-standard" />
              <Tooltip id="tip-express" />
              <Tooltip id="tip-pickup" />
              <Tooltip id="tip-deliveryOptions" />
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-600">Payment Type</label>
                <select
                  className="mt-1 w-full h-10 border rounded-md px-3"
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                  data-testid="cart-payment-type"
                >
                  <option value="cash">Cash</option>
                  <option value="credit">Credit (1-36 months)</option>
                </select>
              </div>
              {paymentType === "credit" && (
                <div>
                  <label className="text-sm text-gray-600">Months</label>
                  <input
                    type="number"
                    min={1}
                    max={36}
                    className="mt-1 w-full h-10 border rounded-md px-3"
                    value={creditMonths}
                    onChange={(e) =>
                      setCreditMonths(parseInt(e.target.value || "12", 10))
                    }
                    data-testid="cart-credit-months"
                  />
                </div>
              )}
            </div>

            <div className="mt-4">
              <label className="text-sm text-gray-600">
                Email <span className="text-red-600">*</span>
              </label>
              <input
                placeholder="Enter your email here"
                required
                className={`mt-1 w-full h-10 border rounded-md px-3 ${
                  showErrors && !email ? "border-red-600" : ""
                }`}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="cart-email"
              />
              {showErrors && !email && (
                <span
                  className="text-xs text-red-600 mt-1 inline-block"
                  data-testid="cart-email-error"
                >
                  Email is required
                </span>
              )}
            </div>
            <div className="mt-4">
              <label className="text-sm text-gray-600">
                Cellphone <span className="text-red-600">*</span>
              </label>
              <input
                placeholder="(+27) Enter your cellphone here"
                required
                className={`mt-1 w-full h-10 border rounded-md px-3 ${
                  showErrors && !cellphone ? "border-red-600" : ""
                }`}
                value={cellphone}
                onChange={(e) =>
                  setCellphone(
                    e.target.value.replace(/[^\d+]/g, "").slice(0, 10)
                  )
                }
                data-testid="checkout-cellphone"
              />
              {showErrors && !cellphone && (
                <span
                  className="text-xs text-red-600 mt-1 inline-block"
                  data-testid="cart-cellphone-error"
                >
                  Cellphone is required
                </span>
              )}
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-600">
                  Full Name <span className="text-red-600">*</span>
                </label>
                <input
                  placeholder="Full Name"
                  required
                  className={`mt-1 w-full h-10 border rounded-md px-3 ${
                    showErrors && !address.fullName ? "border-red-600" : ""
                  }`}
                  value={address.fullName}
                  onChange={(e) =>
                    setAddress({ ...address, fullName: e.target.value })
                  }
                  data-testid="cart-addr-fullname"
                />
                {showErrors && !address.fullName && (
                  <span
                    className="text-xs text-red-600 mt-1 inline-block"
                    data-testid="cart-fullname-error"
                  >
                    Full name is required
                  </span>
                )}
              </div>
              <div>
                <label className="text-sm text-gray-600">
                  Address 1 <span className="text-red-600">*</span>
                </label>
                <input
                  placeholder="Address 1"
                  required
                  className={`mt-1 w-full h-10 border rounded-md px-3 ${
                    showErrors && !address.address1 ? "border-red-600" : ""
                  }`}
                  value={address.address1}
                  onChange={(e) =>
                    setAddress({ ...address, address1: e.target.value })
                  }
                  data-testid="cart-addr-address1"
                />
                {showErrors && !address.address1 && (
                  <span
                    className="text-xs text-red-600 mt-1 inline-block"
                    data-testid="cart-address1-error"
                  >
                    Address 1 is required
                  </span>
                )}
              </div>
              <div>
                <label className="text-sm text-gray-600">Address 2</label>
                <input
                  placeholder="Address 2"
                  className="mt-1 w-full h-10 border rounded-md px-3"
                  value={address.address2}
                  onChange={(e) =>
                    setAddress({ ...address, address2: e.target.value })
                  }
                  data-testid="cart-addr-address2"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">
                  City <span className="text-red-600">*</span>
                </label>
                <input
                  placeholder="City"
                  required
                  className={`mt-1 w-full h-10 border rounded-md px-3 ${
                    showErrors && !address.city ? "border-red-600" : ""
                  }`}
                  value={address.city}
                  onChange={(e) =>
                    setAddress({ ...address, city: e.target.value })
                  }
                  data-testid="cart-addr-city"
                />
                {showErrors && !address.city && (
                  <span
                    className="text-xs text-red-600 mt-1 inline-block"
                    data-testid="cart-city-error"
                  >
                    City is required
                  </span>
                )}
              </div>
              <div>
                <label className="text-sm text-gray-600">
                  Province <span className="text-red-600">*</span>
                </label>
                <input
                  placeholder="Province"
                  required
                  className={`mt-1 w-full h-10 border rounded-md px-3 ${
                    showErrors && !address.state ? "border-red-600" : ""
                  }`}
                  value={address.state}
                  onChange={(e) =>
                    setAddress({ ...address, state: e.target.value })
                  }
                  data-testid="cart-addr-state"
                />
                {showErrors && !address.state && (
                  <span
                    className="text-xs text-red-600 mt-1 inline-block"
                    data-testid="cart-state-error"
                  >
                    Province is required
                  </span>
                )}
              </div>
              <div>
                <label className="text-sm text-gray-600">
                  Zip <span className="text-red-600">*</span>
                </label>
                <input
                  placeholder="Postal Code"
                  required
                  className={`mt-1 w-full h-10 border rounded-md px-3 ${
                    showErrors && address.zip.length !== 4
                      ? "border-red-600"
                      : ""
                  }`}
                  maxLength={4}
                  value={address.zip}
                  onChange={(e) =>
                    setAddress({
                      ...address,
                      zip: e.target.value.replace(/\D/g, "").slice(0, 4),
                    })
                  }
                  data-testid="cart-addr-zip"
                />
                {showErrors && address.zip.length !== 4 && (
                  <span
                    className="text-xs text-red-600 mt-1 inline-block"
                    data-testid="cart-zip-error"
                  >
                    Zip must be 4 digits
                  </span>
                )}
              </div>
              <div>
                <label className="text-sm text-gray-600">
                  Country <span className="text-red-600">*</span>
                </label>
                <input
                  placeholder="Country"
                  required
                  className={`mt-1 w-full h-10 border rounded-md px-3 ${
                    showErrors && !address.country ? "border-red-600" : ""
                  }`}
                  value={address.country}
                  onChange={(e) =>
                    setAddress({ ...address, country: e.target.value })
                  }
                  data-testid="cart-addr-country"
                />
                {showErrors && !address.country && (
                  <span
                    className="text-xs text-red-600 mt-1 inline-block"
                    data-testid="cart-country-error"
                  >
                    Country is required
                  </span>
                )}
              </div>
            </div>

            <button
              disabled={saving}
              onClick={handleCheckout}
              className="mt-4 w-full h-10 rounded-md bg-red-600 text-white hover:bg-red-700"
              data-testid="cart-checkout"
            >
              {saving ? "Processing..." : "Checkout"}
            </button>

            <label className="mt-3 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={saveAddress}
                onChange={(e) => setSaveAddress(e.target.checked)}
                data-testid="cart-save-address"
              />
              Save this address to my profile
            </label>

            {message && <p className="mt-3 text-sm">{message}</p>}
          </div>
        </div>
      )}

      {errorOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[1000]">
          <div
            className="bg-white rounded-xl p-6 w-11/12 max-w-sm shadow-lg border border-gray-300"
            data-testid="cart-error-modal"
          >
            <h2 className="text-lg font-bold mb-2">Incomplete Form</h2>
            <p className="text-sm text-gray-700">
              Please complete all required fields to continue.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="h-9 px-4 rounded border"
                onClick={() => setErrorOpen(false)}
                data-testid="cart-error-ok"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
