import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "../components/ToastQueue";
import { forgotPassword, resetPassword } from "../services/api";
import Logo from "../assets/medsecure-logo.png";
import Hero from "../assets/medsecure-hero.png";
import HumanPassportLogin from '../components/HumanPassportLogin';

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  // Forgot-password state (client-side, dev only)
  const [forgotMode, setForgotMode] = useState(false);
  const [fpEmail, setFpEmail] = useState("");
  const [fpStage, setFpStage] = useState(1); // 1=request token, 2=reset
  const [fpToken, setFpToken] = useState("");
  const [fpNewPassword, setFpNewPassword] = useState("");
  const [fpConfirm, setFpConfirm] = useState("");

  // Handle Input Change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle Login
  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(form.email, form.password);
    if (success) navigate("/"); // Role redirection handled in AuthContext
  };

  // Toasts
  const { addToast } = useToast();

  // Utility: generate a short token (dev only)
  const makeToken = () => Math.random().toString(36).slice(2, 10).toUpperCase();

  // Forgot: request token (client-side, stores token in localStorage user)
  const handleRequestReset = async (e) => {
    e && e.preventDefault();
    if (!fpEmail) return addToast('Enter your email', 'error');

    try {
      // Prefer server API
      try {
        const res = await forgotPassword({ email: fpEmail });
        if (res.token) {
          addToast(`Reset token (dev): ${res.token}`, 'success', 8000);
          setFpToken(res.token);
        } else {
          addToast('If the email exists, a reset token was issued', 'info');
        }
        setFpStage(2);
      } catch (err) {
        // Fallback to old client-side behavior
        const stored = localStorage.getItem('medisecure_user');
        if (!stored) return addToast('If the email exists, a reset token was issued (dev)', 'info');
        const user = JSON.parse(stored);
        if (user.email !== fpEmail.toLowerCase()) return addToast('If the email exists, a reset token was issued (dev)', 'info');
        const token = makeToken();
        const expires = Date.now() + 1000 * 60 * 60;
        user.resetToken = token; user.resetExpires = expires; localStorage.setItem('medisecure_user', JSON.stringify(user));
        addToast(`Reset token (dev): ${token}`, 'success', 8000);
        setFpToken(token);
        setFpStage(2);
      }
    } catch (err) {
      addToast('Could not generate reset token', 'error');
    }
  };

  // Forgot: perform reset using token and new password (client-side)
  const handlePerformReset = async (e) => {
    e && e.preventDefault();
    if (!fpToken || !fpNewPassword || !fpConfirm) return addToast('Complete all fields', 'error');
    if (fpNewPassword !== fpConfirm) return addToast('Passwords do not match', 'error');
    try {
      // Try server reset first
      await resetPassword({ email: fpEmail, token: fpToken, password: fpNewPassword });
      addToast('Password reset successful. You can now sign in.', 'success');
      setForgotMode(false);
      setFpStage(1);
      setFpEmail(''); setFpToken(''); setFpNewPassword(''); setFpConfirm('');
    } catch (err) {
      // Fallback to localStorage behavior
      const stored = localStorage.getItem('medisecure_user');
      if (!stored) return addToast('Invalid token or user', 'error');
      const user = JSON.parse(stored);
      if (user.resetToken !== fpToken || !user.resetExpires || user.resetExpires < Date.now()) {
        return addToast('Invalid or expired token', 'error');
      }
      user.password = fpNewPassword; delete user.resetToken; delete user.resetExpires; localStorage.setItem('medisecure_user', JSON.stringify(user));
      addToast('Password reset successful (demo). You can now sign in.', 'success');
      setForgotMode(false);
      setFpStage(1);
      setFpEmail(''); setFpToken(''); setFpNewPassword(''); setFpConfirm('');
    }
  };

  return (
  <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-4xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Hero image (left on md+) */}
        <div className="hidden md:flex items-center justify-center bg-gradient-to-br from-white to-ms-accent/10 md:h-[520px]">
          <img src={Hero} alt="MediSecure Hero" className="w-full h-full object-cover" />
        </div>

        {/* Form column */}
        <div className="p-8 md:p-12 flex flex-col justify-center">
          {/* Logo / Title */}
          <div className="text-center mb-6">
            <img src={Logo} alt="logo" className="w-14 h-14 mx-auto object-contain" />
            <h1 className="mt-4 text-2xl font-bold text-gray-800">Welcome Back to MediSecure Chain</h1>
            <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
          </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold text-white bg-ms-accent hover:bg-ms-accent-600 transition ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Human Passport button */}
        <div className="mt-4">
          <HumanPassportLogin onVerified={(u)=>{ console.log('Human verified user', u); }} />
        </div>

        {/* Forgot password flow (client-side dev flow) */}
        <div className="mt-4 text-right">
          {!forgotMode ? (
            <button
              onClick={() => setForgotMode(true)}
              className="text-sm text-purple-600 hover:underline"
            >
              Forgot password?
            </button>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg mt-3">
              {fpStage === 1 && (
                <form onSubmit={handleRequestReset} className="space-y-3">
                  <label className="block text-gray-700 text-sm">Enter your account email to request a reset token (dev)</label>
                  <input
                    type="email"
                    value={fpEmail}
                    onChange={(e) => setFpEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3 py-2 border rounded"
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="px-3 py-2 bg-purple-600 text-white rounded">Request Token</button>
                    <button type="button" onClick={() => { setForgotMode(false); setFpEmail(''); }} className="px-3 py-2 border rounded">Cancel</button>
                  </div>
                </form>
              )}

              {fpStage === 2 && (
                <form onSubmit={handlePerformReset} className="space-y-3">
                  <label className="block text-gray-700 text-sm">Enter the token shown (dev) and a new password</label>
                  <input type="text" value={fpToken} onChange={(e)=>setFpToken(e.target.value)} placeholder="Reset token" className="w-full px-3 py-2 border rounded" />
                  <input type="password" value={fpNewPassword} onChange={(e)=>setFpNewPassword(e.target.value)} placeholder="New password" className="w-full px-3 py-2 border rounded" />
                  <input type="password" value={fpConfirm} onChange={(e)=>setFpConfirm(e.target.value)} placeholder="Confirm password" className="w-full px-3 py-2 border rounded" />
                  <div className="flex gap-2">
                    <button type="submit" className="px-3 py-2 bg-green-600 text-white rounded">Reset Password</button>
                    <button type="button" onClick={() => { setFpStage(1); setFpToken(''); setFpNewPassword(''); setFpConfirm(''); }} className="px-3 py-2 border rounded">Back</button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Links */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            Don’t have an account?{" "}
            <Link
              to="/signup"
              className="text-purple-600 hover:underline font-medium"
            >
              Create one
            </Link>
          </p>
        </div>
        </div>
      </div>
    </div>
  );
}
