"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { Button } from "@/components/ui/button";
import NetworkGraphSVG from "./illustrations/NetworkGraphSVG";
import ParallaxBackground from "./ParallaxBackground";
import { useIsClient } from "usehooks-ts";
import { TransitionLink } from "../ui2/TransitionLink";

export default function HeroSection() {
  const { scrollYProgress } = useScroll();
  const backgroundY = useTransform(scrollYProgress, [0, 1], [0, 0.3]);
  const isClient = useIsClient();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-16">
      {isClient && <ParallaxBackground y={backgroundY} />}
      {/* Background Animation */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="container mx-auto px-4 z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          <motion.div
            className="lg:w-1/2 text-center lg:text-left"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-6xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              ClassForge
            </h1>
            <p className="text-2xl md:text-3xl font-semibold text-gray-700 mb-4">
              Optimize classroom dynamics with powerful social network analysis
            </p>
            <p className="text-lg text-gray-600 mb-8">
              Create balanced classrooms that foster collaboration, reduce
              isolation, and improve educational outcomes
            </p>
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <Button size="lg">
                <TransitionLink href="/dashboard">
                  Explore Dashboard
                </TransitionLink>
              </Button>
              <Button size="lg" variant="outline">
                Sign In
              </Button>
            </div>
          </motion.div>

          <motion.div
            className="lg:w-1/2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="relative w-full h-[400px]">
              <NetworkGraphSVG />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
