// components/landing/illustrations/ProcessSVG.jsx
"use client";

import { motion } from "motion/react";
import { useInView } from "react-intersection-observer";

export default function ProcessSVG() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const pathVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        duration: 1.5,
        ease: "easeInOut",
      },
    },
  };

  const iconVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: (i: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        delay: i * 0.3 + 0.5,
        duration: 0.5,
        type: "spring",
        stiffness: 200,
      },
    }),
  };

  return (
    <svg ref={ref} viewBox="0 0 400 450" className="w-full h-full">
      {/* Background grid */}
      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path
          d="M 20 0 L 0 0 0 20"
          fill="none"
          stroke="rgba(107, 114, 128, 0.1)"
          strokeWidth="0.5"
        />
      </pattern>
      <rect width="100%" height="100%" fill="url(#grid)" />

      {/* Process flow path */}
      <motion.path
        d="M 80 60 
           C 80 100, 120 100, 120 140
           C 120 180, 80 180, 80 220
           C 80 260, 120 260, 120 300
           C 120 340, 80 340, 80 380"
        fill="none"
        stroke="url(#flowGradient)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="0 1"
        variants={pathVariants}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
      />

      {/* Flow gradient */}
      <defs>
        <linearGradient id="flowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="50%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>

      {/* Process step 1: Import Data */}
      <motion.g
        custom={0}
        variants={iconVariants}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
      >
        <rect
          x="140"
          y="40"
          width="220"
          height="70"
          rx="8"
          fill="white"
          stroke="#e5e7eb"
          strokeWidth="2"
        />
        <rect
          x="155"
          y="55"
          width="80"
          height="40"
          rx="4"
          fill="#eef2ff"
          stroke="#818cf8"
          strokeWidth="1"
        />
        <rect x="250" y="55" width="95" height="10" rx="2" fill="#eef2ff" />
        <rect x="250" y="75" width="60" height="10" rx="2" fill="#eef2ff" />
        <path d="M165 75 L185 65 L205 75 L185 85 Z" fill="#4f46e5" />
      </motion.g>

      {/* Process step 2: Collect Relationship Data */}
      <motion.g
        custom={1}
        variants={iconVariants}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
      >
        <rect
          x="140"
          y="140"
          width="220"
          height="70"
          rx="8"
          fill="white"
          stroke="#e5e7eb"
          strokeWidth="2"
        />
        <circle
          cx="180"
          cy="175"
          r="20"
          fill="#eef2ff"
          stroke="#818cf8"
          strokeWidth="1"
        />
        <circle
          cx="215"
          cy="165"
          r="15"
          fill="#eef2ff"
          stroke="#818cf8"
          strokeWidth="1"
        />
        <circle
          cx="240"
          cy="185"
          r="18"
          fill="#eef2ff"
          stroke="#818cf8"
          strokeWidth="1"
        />
        <line
          x1="180"
          y1="175"
          x2="215"
          y2="165"
          stroke="#4f46e5"
          strokeWidth="2"
        />
        <line
          x1="215"
          y1="165"
          x2="240"
          y2="185"
          stroke="#7c3aed"
          strokeWidth="2"
        />
        <rect x="270" y="155" width="75" height="10" rx="2" fill="#eef2ff" />
        <rect x="270" y="175" width="50" height="10" rx="2" fill="#eef2ff" />
      </motion.g>

      {/* Process step 3: Analyze Network */}
      <motion.g
        custom={2}
        variants={iconVariants}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
      >
        <rect
          x="140"
          y="240"
          width="220"
          height="70"
          rx="8"
          fill="white"
          stroke="#e5e7eb"
          strokeWidth="2"
        />
        <circle cx="160" cy="260" r="8" fill="#4f46e5" />
        <circle cx="190" cy="265" r="8" fill="#7c3aed" />
        <circle cx="175" cy="290" r="8" fill="#8b5cf6" />
        <circle cx="210" cy="285" r="8" fill="#a78bfa" />
        <line
          x1="160"
          y1="260"
          x2="190"
          y2="265"
          stroke="#4f46e5"
          strokeWidth="1"
        />
        <line
          x1="160"
          y1="260"
          x2="175"
          y2="290"
          stroke="#7c3aed"
          strokeWidth="1"
        />
        <line
          x1="190"
          y1="265"
          x2="210"
          y2="285"
          stroke="#8b5cf6"
          strokeWidth="1"
        />
        <line
          x1="175"
          y1="290"
          x2="210"
          y2="285"
          stroke="#a78bfa"
          strokeWidth="1"
        />
        <rect x="240" y="255" width="105" height="40" rx="2" fill="#eef2ff" />
        <rect
          x="245"
          y="260"
          width="95"
          height="5"
          rx="1"
          fill="#4f46e5"
          opacity="0.3"
        />
        <rect
          x="245"
          y="270"
          width="75"
          height="5"
          rx="1"
          fill="#7c3aed"
          opacity="0.5"
        />
        <rect
          x="245"
          y="280"
          width="85"
          height="5"
          rx="1"
          fill="#8b5cf6"
          opacity="0.4"
        />
      </motion.g>

      {/* Process step 4: Generate Classes */}
      <motion.g
        custom={3}
        variants={iconVariants}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
      >
        <rect
          x="140"
          y="340"
          width="220"
          height="70"
          rx="8"
          fill="white"
          stroke="#e5e7eb"
          strokeWidth="2"
        />
        <rect
          x="160"
          y="350"
          width="60"
          height="50"
          rx="4"
          fill="#eef2ff"
          stroke="#818cf8"
          strokeWidth="1"
        />
        <rect
          x="230"
          y="350"
          width="60"
          height="50"
          rx="4"
          fill="#eef2ff"
          stroke="#818cf8"
          strokeWidth="1"
        />
        <rect
          x="300"
          y="350"
          width="40"
          height="50"
          rx="4"
          fill="#eef2ff"
          stroke="#818cf8"
          strokeWidth="1"
        />
        <circle cx="175" cy="365" r="5" fill="#4f46e5" />
        <circle cx="190" cy="375" r="5" fill="#7c3aed" />
        <circle cx="180" cy="390" r="5" fill="#8b5cf6" />
        <circle cx="245" cy="365" r="5" fill="#4f46e5" />
        <circle cx="260" cy="375" r="5" fill="#7c3aed" />
        <circle cx="250" cy="390" r="5" fill="#8b5cf6" />
        <text x="315" y="380" fontSize="16" fontWeight="bold" fill="#4f46e5">
          ...
        </text>
      </motion.g>
    </svg>
  );
}
