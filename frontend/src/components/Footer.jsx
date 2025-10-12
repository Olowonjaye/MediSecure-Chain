// ========================================
// Footer.jsx
// ========================================

import React from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Github, Linkedin, Twitter } from "lucide-react";

const Footer = () => {
  return (
  <footer className="bg-blue-600 text-white py-10 mt-10 border-t border-blue-700">
      <div className="container mx-auto px-6 md:px-12 grid md:grid-cols-4 gap-8">
        {/* ------------------ About Section ------------------ */}
        <div>
          <h2 className="text-2xl font-bold mb-4">MediSecure</h2>
          <p className="text-sm leading-relaxed">
            Empowering healthcare professionals with blockchain-backed 
            electronic health records (EHR) and secure medical data management. 
            Protecting patient trust through technology.
          </p>
        </div>

        {/* ------------------ Quick Links ------------------ */}
        <div>
          <h2 className="text-lg font-semibold mb-4 text-white">Quick Links</h2>
          <ul className="space-y-2">
            <li><Link to="/" className="text-white visited:text-white hover:text-white focus:text-white active:text-white">Home</Link></li>
            <li><Link to="/about" className="text-white visited:text-white hover:text-white focus:text-white active:text-white">About</Link></li>
            <li><Link to="/contact" className="text-white visited:text-white hover:text-white focus:text-white active:text-white">Contact</Link></li>
            <li><Link to="/support" className="text-white visited:text-white hover:text-white focus:text-white active:text-white">Support</Link></li>
            <li><Link to="/login" className="text-white visited:text-white hover:text-white focus:text-white active:text-white">Login</Link></li>
          </ul>
        </div>

        {/* ------------------ Contact Info ------------------ */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Contact</h2>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <Mail size={16} /> <span className="text-white">support@medisecure.health</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone size={16} /> <span className="text-white">+234 806 585 5694</span>
            </li>
            <li className="flex items-center gap-2">
              <MapPin size={16} /> <span className="text-white">45 HealthTech Avenue, Ilorin-Kwara, Nigeria</span>
            </li>
          </ul>
        </div>

        {/* ------------------ Social Links ------------------ */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Connect</h2>
          <div className="flex space-x-4">
            <a href="https://twitter.com" target="_blank" className="text-white hover:text-white transition">
              <Twitter size={20} />
            </a>
            <a href="https://linkedin.com" target="_blank" className="text-white hover:text-white transition">
              <Linkedin size={20} />
            </a>
            <a href="https://github.com" target="_blank" className="text-white hover:text-white transition">
              <Github size={20} />
            </a>
          </div>
          <p className="text-xs mt-4 text-white">
            Blockchain-based Health Data Security for the Future.
          </p>
        </div>
      </div>

      {/* ------------------ Footer Bottom ------------------ */}
      <div className="border-t border-blue-700 mt-8 pt-4 text-center text-sm text-white">
        © {new Date().getFullYear()} MediSecure | All Rights Reserved.
      </div>
    </footer>
  );
};

export default Footer;
