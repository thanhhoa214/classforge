"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useInView } from "react-intersection-observer";
import { Button } from "@/components/ui/button";
import CTASVG from "./illustrations/CTASVG";
import { TransitionLink } from "../ui2/TransitionLink";

export default function CTASection() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });
  const { scrollYProgress } = useScroll();
  const ctaOpacity = useTransform(scrollYProgress, [0.7, 0.8, 0.9], [0, 1, 1]);

  return (
    <motion.section
      style={{ opacity: ctaOpacity }}
      className="py-24 bg-gradient-to-br from-indigo-900 to-purple-800 text-white relative overflow-hidden"
      id="cta"
    >
      {/* Background Particles */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-indigo-400 mix-blend-overlay filter blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-purple-400 mix-blend-overlay filter blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          <motion.div
            className="lg:w-1/2 text-center lg:text-left"
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold mb-6">
              Transform Your Classroom Today
            </h2>
            <p className="text-xl mb-8 text-indigo-100">
              Join hundreds of educators who are using ClassForge to create more
              balanced, collaborative, and effective learning environments.
            </p>
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <Button size="lg" asChild>
                <TransitionLink href="/signup">Sign Up Free</TransitionLink>
              </Button>
              <Button size="lg" variant="outline">
                <TransitionLink href="/demo">Request Demo</TransitionLink>
              </Button>
            </div>
          </motion.div>

          <motion.div
            ref={ref}
            className="lg:w-1/2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={
              inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }
            }
            transition={{ duration: 0.8 }}
          >
            <div className="relative h-[300px] w-full">
              <CTASVG />
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
