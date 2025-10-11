import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

/**
 * ------------------------------------------------------------
 * Hero Component
 * ------------------------------------------------------------
 * - Synchronized with Footer and Navbar design.
 * - Clean typography and responsive layout.
 * - Subtle animations for premium feel.
 * - Reusable for blockchain / health / AI platforms.
 * ------------------------------------------------------------
 */

const Hero = () => {
  return (
    <section className="relative bg-gradient-to-b from-gray-950 via-gray-900 to-gray-800 text-white overflow-hidden">
      {/* Animated background gradient effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.25),transparent_60%)]" />

      <div className="container relative mx-auto px-6 py-24 text-center lg:text-left lg:py-40">
        {/* Left Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="max-w-3xl mx-auto lg:mx-0"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              Building Trust on the Blockchain
            </span>
            <br />
            for a Smarter, Secure Future.
          </h1>

          <p className="text-gray-300 text-lg sm:text-xl max-w-2xl mx-auto lg:mx-0 mb-8">
            Empowering individuals and organizations through transparent,
            decentralized, and verifiable solutions — where innovation meets
            integrity.
          </p>

          <div className="flex justify-center lg:justify-start gap-4">
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg rounded-xl shadow-lg"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              className="border border-gray-500 text-gray-300 hover:text-white hover:border-blue-400 hover:bg-blue-900/30 px-6 py-3 text-lg rounded-xl"
            >
              Learn More
            </Button>
          </div>
        </motion.div>

        {/* Right Section (optional visuals) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.3 }}
          className="mt-16 lg:mt-0 lg:absolute lg:right-10 lg:top-24"
        >
          <img
            src="/assets/hero-illustration.png"
            alt="Blockchain Network Illustration"
            className="w-full max-w-md mx-auto lg:max-w-lg"
          />
        </motion.div>
      </div>

      {/* Decorative bottom wave */}
      <svg
        className="absolute bottom-0 left-0 w-full"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 320"
      >
        <path
          fill="#0f172a"
          fillOpacity="1"
          d="M0,224L48,186.7C96,149,192,75,288,69.3C384,64,480,128,576,138.7C672,149,768,107,864,117.3C960,128,1056,192,1152,213.3C1248,235,1344,213,1392,202.7L1440,192V320H0Z"
        ></path>
      </svg>
    </section>
  );
};

export default Hero;
