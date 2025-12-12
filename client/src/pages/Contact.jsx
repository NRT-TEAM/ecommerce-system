import React, { useContext, useState } from "react";
import { ShopContext } from "../context/ShopContext";

const Contact = () => {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [errors, setErrors] = useState({});
  const { showToast } = useContext(ShopContext);
  const FORMSPREE_CONTACT_ID = import.meta.env.VITE_FORMSPREE_CONTACT_ID || "";

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    setFeedback("");
    setErrors({});
    const errs = {};
    const emailValid = /.+@.+\..+/.test(form.email);
    if (!form.firstName) errs.firstName = "First name is required";
    if (!form.lastName) errs.lastName = "Last name is required";
    if (!form.email || !emailValid) errs.email = "Valid email is required";
    if (!form.message) errs.message = "Message is required";
    if (Object.keys(errs).length) {
      setErrors(errs);
      setSending(false);
      return;
    }
    try {
      if (!FORMSPREE_CONTACT_ID) throw new Error("Formspree not configured");
      const fd = new FormData();
      fd.append("firstName", form.firstName);
      fd.append("lastName", form.lastName);
      fd.append("email", form.email);
      fd.append("message", form.message);
      fd.append("subject", "Website contact message");
      const res = await fetch(
        `https://formspree.io/f/${FORMSPREE_CONTACT_ID}`,
        {
          method: "POST",
          headers: { Accept: "application/json" },
          body: fd,
        }
      );
      if (!res.ok) throw new Error("Failed to send");
      setFeedback("Message sent! We'll get back to you shortly.");
      showToast({ type: "success", title: "Contact", message: "Message sent" });
      setForm({ firstName: "", lastName: "", email: "", message: "" });
    } catch (err) {
      setFeedback("Unable to send message. Please try again.");
      showToast({ type: "error", title: "Contact", message: "Send failed" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 fade-in-up">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h1
            className="text-3xl md:text-4xl font-bold mb-4"
            data-testid="contact-title"
          >
            Contact Us
          </h1>
          <p className="text-gray-700 mb-6">
            We're here to help. Reach out for product inquiries, delivery, or
            support.
          </p>

          <div className="space-y-3 text-gray-700">
            <p>
              <span className="font-semibold">Phone:</span> +27(0) 21 460 4400
            </p>
            <p>
              <span className="font-semibold">Email:</span>{" "}
              Lewis@furniture.co.za
            </p>
            <p>
              <span className="font-semibold">Hours:</span> Mon-Fri 9:00-17:00
            </p>
          </div>
        </div>

        <form
          className="bg-white border rounded-xl shadow-sm p-6"
          onSubmit={submit}
          data-testid="contact-form"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">First Name</label>
              <input
                className="mt-1 w-full h-10 border rounded-md px-3"
                placeholder="Enter your first name"
                value={form.firstName}
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
                data-testid="contact-first-name"
              />
              {errors.firstName && (
                <p
                  className="text-xs text-red-600 mt-1"
                  data-testid="contact-first-name-error"
                >
                  {errors.firstName}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm text-gray-600">Last Name</label>
              <input
                className="mt-1 w-full h-10 border rounded-md px-3"
                placeholder="Enter your last name"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                data-testid="contact-last-name"
              />
              {errors.lastName && (
                <p
                  className="text-xs text-red-600 mt-1"
                  data-testid="contact-last-name-error"
                >
                  {errors.lastName}
                </p>
              )}
            </div>
          </div>
          <div className="mt-4">
            <label className="text-sm text-gray-600">Email</label>
            <input
              type="email"
              className="mt-1 w-full h-10 border rounded-md px-3"
              placeholder="Enter your email (you@example.com)"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              data-testid="contact-email"
            />
            {errors.email && (
              <p
                className="text-xs text-red-600 mt-1"
                data-testid="contact-email-error"
              >
                {errors.email}
              </p>
            )}
          </div>
          <div className="mt-4">
            <label className="text-sm text-gray-600">Message</label>
            <textarea
              className="mt-1 w-full min-h-28 border rounded-md px-3 py-2"
              placeholder="Tell us more"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              data-testid="contact-message"
            />
            {errors.message && (
              <p
                className="text-xs text-red-600 mt-1"
                data-testid="contact-message-error"
              >
                {errors.message}
              </p>
            )}
          </div>
          <button
            disabled={sending}
            className="mt-6 h-10 px-6 rounded-md bg-red-600 text-white hover:bg-red-700 drop-shadow justify-center flex items-center"
            data-testid="contact-submit"
          >
            {sending ? "Sending..." : "Send Message"}
          </button>
          {feedback && (
            <p className="mt-3 text-sm" data-testid="contact-feedback">
              {feedback}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default Contact;
