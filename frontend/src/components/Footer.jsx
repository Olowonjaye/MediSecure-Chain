// ========================================
// Footer.jsx
// ========================================

import React from "react";
import { Mail, Phone, MapPin, Github, Linkedin, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-emerald-700 text-white py-10 mt-10 border-t border-emerald-600">
      <div className="container mx-auto px-6 md:px-12 grid md:grid-cols-4 gap-8">
        {/* ------------------ About Section ------------------ */}
        <div>
          <h2 className="text-2xl font-bold mb-4">MediSecure</h2>
          <p className="text-sm text-emerald-100 leading-relaxed">
            Empowering healthcare professionals with blockchain-backed 
            electronic health records (EHR) and secure medical data management. 
            Protecting patient trust through technology.
          </p>
        </div>

        {/* ------------------ Quick Links ------------------ */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
          <ul className="space-y-2 text-emerald-100">
            <li><a href="/" className="hover:text-white transition">Home</a></li>
            <li><a href="/about" className="hover:text-white transition">About</a></li>
            <li><a href="/contact" className="hover:text-white transition">Contact</a></li>
            <li><a href="/support" className="hover:text-white transition">Support</a></li>
            <li><a href="/login" className="hover:text-white transition">Login</a></li>
          </ul>
        </div>

        {/* ------------------ Contact Info ------------------ */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Contact</h2>
          <ul className="space-y-3 text-emerald-100 text-sm">
            <li className="flex items-center gap-2">
              <Mail size={16} /> support@medisecure.health
            </li>
            <li className="flex items-center gap-2">
              <Phone size={16} /> +234 809 123 4567
            </li>
            <li className="flex items-center gap-2">
              <MapPin size={16} /> 45 HealthTech Avenue, Lagos, Nigeria
            </li>
          </ul>
        </div>

        {/* ------------------ Social Links ------------------ */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Connect</h2>
          <div className="flex space-x-4">
            <a href="https://twitter.com" target="_blank" className="hover:text-gray-200 transition">
              <Twitter size={20} />
            </a>
            <a href="https://linkedin.com" target="_blank" className="hover:text-gray-200 transition">
              <Linkedin size={20} />
            </a>
            <a href="https://github.com" target="_blank" className="hover:text-gray-200 transition">
              <Github size={20} />
            </a>
          </div>
          <p className="text-xs text-emerald-200 mt-4">
            Blockchain-based Health Data Security for the Future.
          </p>
        </div>
      </div>

      {/* ------------------ Footer Bottom ------------------ */}
      <div className="border-t border-emerald-600 mt-8 pt-4 text-center text-sm text-emerald-200">
        © {new Date().getFullYear()} MediSecure | All Rights Reserved.
      </div>
    </footer>
  );
};

export default Footer;
