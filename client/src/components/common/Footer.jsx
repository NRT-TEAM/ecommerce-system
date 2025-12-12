import React, { useContext } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { assets } from "../../assets/assets";
import { ShopContext } from "../../context/ShopContext";

const Footer = () => {
  const partners = [
    { name: "Lewis Group", url: "https://www.lewisgroup.co.za" },
    { name: "Best Electric", url: "https://www.bestelectric.co.za" },
    { name: "Bearers", url: "https://beares.co.za" },
    { name: "UFO", url: "https://www.unitedfurnitureoutlets.co.za" },
    { name: "Bedzone", url: "https://shop.bedzone.co.za" },
  ];

  return (
    <footer className="mt-20 border-t fade-in-up" data-testid="footer">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 text-sm">
          <div className="flex flex-col gap-4">
            <img
              src={assets.LewisStore_Logo}
              className="w-32"
              alt="Logo"
              data-testid="footer-logo"
            />
            <p className="text-gray-600">
              Leading retailer of furniture, appliances and electronics across
              Southern Africa.
            </p>
          </div>

          <div>
            <p className="text-xl font-medium mb-4">Navigate</p>
            <ul className="flex flex-col gap-2 text-gray-700">
              <li>
                <Link to="/" data-testid="footer-nav-home">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" data-testid="footer-nav-about">
                  About
                </Link>
              </li>
              <li>
                <Link to="/collection" data-testid="footer-nav-collection">
                  Collection
                </Link>
              </li>
              <li>
                <Link to="/contact" data-testid="footer-nav-contact">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xl font-medium mb-4">Partners</p>
            <ul className="flex flex-col gap-2 text-gray-700">
              {partners.map((partner) => (
                <li key={partner.name}>
                  <a
                    href={partner.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid={`footer-partner-${partner.name
                      .toLowerCase()
                      .replace(/\s+/g, "-")}`}
                  >
                    {partner.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xl font-medium mb-4">Newsletter</p>
            <NewsletterForm />
            <p className="mt-2 text-xs text-gray-500">
              By subscribing you agree to our policy.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between text-sm text-gray-600">
          <p>© 2025 Lewis.com — All Rights Reserved</p>
          <div className="flex gap-4 mt-4 sm:mt-0">
            <Link to="/terms" data-testid="footer-link-terms">
              Terms & Conditions
            </Link>
            <Link to="/refund-policy" data-testid="footer-link-refund">
              Refund Policy
            </Link>
            <Link to="/conditions-of-use" data-testid="footer-link-conditions">
              Conditions of Use
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

const NewsletterForm = () => {
  const [email, setEmail] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [msg, setMsg] = React.useState("");
  const { showToast } = useContext(ShopContext);
  const FORMSPREE_NEWSLETTER_ID =
    import.meta.env.VITE_FORMSPREE_NEWSLETTER_ID || "";

  const onSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setMsg("");
    try {
      const emailValid = /.+@.+\..+/.test(email);
      if (!emailValid) throw new Error("Please enter a valid email address");
      const res = await axios.post(
        "http://localhost:5005/api/newsletter/subscribe",
        { email }
      );
      if (!res || res.status < 200 || res.status >= 300)
        throw new Error("Subscription failed");
      setMsg("You are now subscribed.");
      setEmail("");
      showToast({
        type: "success",
        title: "Newsletter",
        message: "Subscribed",
      });
    } catch (e) {
      const m =
        e?.response?.status === 409
          ? "This email is already subscribed."
          : e?.message || "Subscription failed. Please try again.";
      setMsg(m);
      showToast({ type: "error", title: "Newsletter", message: m });
    } finally {
      setSending(false);
    }
  };

  return (
    <form
      className="flex gap-2"
      onSubmit={onSubmit}
      data-testid="footer-newsletter-form"
    >
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1 h-10 rounded-md border px-3"
        required
        data-testid="footer-newsletter-input"
      />
      <button
        className="h-10 px-4 rounded-md bg-red-600  hover:bg-red-700 transition text-white justify-center flex items-center"
        data-testid="footer-newsletter-submit"
      >
        {sending ? "Subscribing..." : "Subscribe"}
      </button>
      {msg && (
        <span className="text-xs ml-2" data-testid="footer-newsletter-msg">
          {msg}
        </span>
      )}
    </form>
  );
};
