import React, { useState } from "react";
import { sendSupportMessage } from "../services/api";

export default function Support() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    try {
      await sendSupportMessage(form);
      setStatus("sent");
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      setStatus("error");
      console.error(err);
    }
  };

  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-4">Support</h1>
      <p className="text-gray-600 mb-6">Reach out to our support team and we'll get back to you shortly.</p>

      <form onSubmit={handleSubmit} className="max-w-xl bg-white p-6 rounded-lg shadow">
        <label className="block mb-2 text-sm font-medium">Full name</label>
        <input name="name" value={form.name} onChange={handleChange} required className="w-full mb-4 px-3 py-2 border rounded" />

        <label className="block mb-2 text-sm font-medium">Email</label>
        <input name="email" type="email" value={form.email} onChange={handleChange} required className="w-full mb-4 px-3 py-2 border rounded" />

        <label className="block mb-2 text-sm font-medium">Message</label>
        <textarea name="message" value={form.message} onChange={handleChange} rows={6} required className="w-full mb-4 px-3 py-2 border rounded" />

        <div className="flex items-center gap-3">
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Send</button>
          {status === "loading" && <span>Sending…</span>}
          {status === "sent" && <span className="text-green-600">Message sent</span>}
          {status === "error" && <span className="text-red-600">Error sending</span>}
        </div>
      </form>
    </div>
  );
}
