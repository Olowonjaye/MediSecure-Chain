import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Send } from "lucide-react";

/**
 * ------------------------------------------------------------
 * Contact Component
 * ------------------------------------------------------------
 * - Consistent with Hero and Footer design (gradient, tone, rhythm)
 * - Smooth entrance animation using Framer Motion
 * - Responsive grid layout for form and contact info
 * - Clear, modern visual hierarchy
 * ------------------------------------------------------------
 */

const Contact = () => {
  return (
    <section
      id="contact"
      className="relative bg-white text-black py-24 overflow-hidden"
    >
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(37,99,235,0.25),transparent_70%)]" />

      <div className="container relative mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            <span className="text-ms-accent">
              Get in Touch
            </span>
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg">
            Have a question, partnership proposal, or just want to say hello?  
            We'd love to hear from you.
          </p>
        </motion.div>

        {/* Contact Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left - Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4">
              <Mail className="text-blue-400 w-6 h-6" />
              <p className="text-gray-300">support@medisecure.io</p>
            </div>
            <div className="flex items-center gap-4">
              <Phone className="text-blue-400 w-6 h-6" />
              <p className="text-gray-300">+234 809 123 4567</p>
            </div>
            <div className="flex items-center gap-4">
              <MapPin className="text-blue-400 w-6 h-6" />
              <p className="text-gray-300">
                42 Innovation Hub, Victoria Island, Lagos, Nigeria
              </p>
            </div>

            <p className="text-gray-400 pt-6 leading-relaxed">
              We are committed to transparency, security, and innovation.  
              Reach out to discuss collaboration, integration, or to learn more about our platform.
            </p>
          </motion.div>

          {/* Right - Contact Form */}
          <motion.form
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
            className="bg-gray-800/60 backdrop-blur-md rounded-2xl shadow-lg p-8 space-y-6 border border-gray-700"
          >
            <div>
              <label className="block text-gray-300 mb-2 font-medium">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Enter your name"
                className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2 font-medium">
                Email Address
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2 font-medium">
                Message
              </label>
              <textarea
                placeholder="Type your message here..."
                rows="5"
                className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 outline-none transition resize-none"
                required
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg rounded-xl flex items-center justify-center gap-2 shadow-md transition"
            >
              Send Message <Send className="w-5 h-5" />
            </button>
          </motion.form>
        </div>
      </div>
    </section>
  );
};

export default Contact;
