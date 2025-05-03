"use client";
import { motion, MotionValue } from "motion/react";

export default function ParallaxBackground({ y }: { y: MotionValue<number> }) {
  return (
    <div className="absolute inset-0 overflow-hidden z-0">
      {/* Top Wave */}
      <motion.div
        style={{ y }}
        className="absolute top-0 left-0 w-full h-64 opacity-40"
      >
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          <path
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
            fill="#4F46E5"
          />
        </svg>
      </motion.div>

      {/* Middle Wave */}
      <motion.div
        style={{ y: y ? y.get() * 0.5 : 0 }}
        className="absolute top-48 left-0 w-full h-64 opacity-30"
      >
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          <path
            d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z"
            fill="#6366F1"
          />
        </svg>
      </motion.div>

      {/* Bottom Wave */}
      <motion.div
        style={{ y: y ? y.get() * 0.2 : 0 }}
        className="absolute top-96 left-0 w-full h-64 opacity-20"
      >
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          <path
            d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
            fill="#8B5CF6"
          />
        </svg>
      </motion.div>

      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-indigo-100 -z-10" />

      {/* Particles */}
      <div className="absolute inset-0 -z-5">
        {Array.from({ length: 20 }).map((_, index) => (
          <motion.div
            key={index}
            className="absolute rounded-full bg-indigo-200 opacity-40"
            style={{
              width: Math.random() * 8 + 2,
              height: Math.random() * 8 + 2,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              y: y ? y.get() * (Math.random() * 0.3) : 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}
