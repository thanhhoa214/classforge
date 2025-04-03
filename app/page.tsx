// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const { scrollYProgress } = useScroll();

  // Create parallax effect values
  const featuresOpacity = useTransform(
    scrollYProgress,
    [0.1, 0.2, 0.3],
    [0, 1, 1]
  );
  const howItWorksOpacity = useTransform(
    scrollYProgress,
    [0.3, 0.4, 0.5],
    [0, 1, 1]
  );
  const testimonialsOpacity = useTransform(
    scrollYProgress,
    [0.5, 0.6, 0.7],
    [0, 1, 1]
  );
  const ctaOpacity = useTransform(scrollYProgress, [0.7, 0.8, 0.9], [0, 1, 1]);

  // Handle mounting for client-side animations
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-indigo-50 via-white to-indigo-50">
      {/* Parallax Background */}

      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <motion.section style={{ opacity: featuresOpacity }}>
        <FeaturesSection />
      </motion.section>

      {/* How It Works Section */}
      <motion.section style={{ opacity: howItWorksOpacity }}>
        <HowItWorksSection />
      </motion.section>

      {/* Testimonials Section */}
      <motion.section style={{ opacity: testimonialsOpacity }}>
        <TestimonialsSection />
      </motion.section>

      {/* CTA Section */}
      <motion.section style={{ opacity: ctaOpacity }}>
        <CTASection />
      </motion.section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
