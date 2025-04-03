// components/landing/illustrations/CTASVG.jsx
"use client";

import { motion } from "motion/react";
import { useInView } from "react-intersection-observer";

export default function CTASVG() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const pathVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (i: number) => ({
      pathLength: 1,
      opacity: 1,
      transition: {
        delay: i * 0.1,
        duration: 1,
        ease: "easeInOut",
      },
    }),
  };

  const circleVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: (i: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        delay: i * 0.05 + 0.3,
        duration: 0.5,
        type: "spring",
        stiffness: 200,
      },
    }),
  };

  return (
    <svg ref={ref} viewBox="0 0 400 300" className="w-full h-full">
      {/* Graph grid */}
      <pattern
        id="ctaGrid"
        width="20"
        height="20"
        patternUnits="userSpaceOnUse"
      >
        <path
          d="M 20 0 L 0 0 0 20"
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="0.5"
        />
      </pattern>
      <rect width="100%" height="100%" fill="url(#ctaGrid)" />

      {/* Classroom Groups */}
      <g>
        {/* Group 1 */}
        <motion.circle
          cx="100"
          cy="150"
          r="60"
          fill="none"
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="2"
          strokeDasharray="4 2"
          custom={0}
          variants={pathVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        />

        {/* Group 2 */}
        <motion.circle
          cx="230"
          cy="130"
          r="50"
          fill="none"
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="2"
          strokeDasharray="4 2"
          custom={1}
          variants={pathVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        />

        {/* Group 3 */}
        <motion.circle
          cx="300"
          cy="200"
          r="40"
          fill="none"
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="2"
          strokeDasharray="4 2"
          custom={2}
          variants={pathVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        />
      </g>

      {/* Students */}
      <g>
        {/* Group 1 Students */}
        <motion.circle
          cx="80"
          cy="130"
          r="10"
          fill="white"
          opacity="0.9"
          custom={0}
          variants={circleVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        />
        <motion.circle
          cx="110"
          cy="160"
          r="8"
          fill="white"
          opacity="0.9"
          custom={1}
          variants={circleVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        />
        <motion.circle
          cx="70"
          cy="170"
          r="9"
          fill="white"
          opacity="0.9"
          custom={2}
          variants={circleVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        />
        <motion.circle
          cx="120"
          cy="130"
          r="7"
          fill="white"
          opacity="0.9"
          custom={3}
          variants={circleVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        />

        {/* Group 2 Students */}
        <motion.circle
          cx="210"
          cy="120"
          r="9"
          fill="white"
          opacity="0.9"
          custom={4}
          variants={circleVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        />
        <motion.circle
          cx="240"
          cy="150"
          r="8"
          fill="white"
          opacity="0.9"
          custom={5}
          variants={circleVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        />
        <motion.circle
          cx="260"
          cy="110"
          r="7"
          fill="white"
          opacity="0.9"
          custom={6}
          variants={circleVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        />

        {/* Group 3 Students */}
        <motion.circle
          cx="280"
          cy="190"
          r="8"
          fill="white"
          opacity="0.9"
          custom={7}
          variants={circleVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        />
        <motion.circle
          cx="320"
          cy="210"
          r="9"
          fill="white"
          opacity="0.9"
          custom={8}
          variants={circleVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        />
      </g>

      {/* Connections */}
      <g>
        {/* Group 1 Connections */}
        <motion.line
          x1="80"
          y1="130"
          x2="110"
          y2="160"
          stroke="white"
          strokeWidth="1.5"
          opacity="0.6"
          custom={0}
          variants={pathVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        />
        <motion.line
          x1="80"
          y1="130"
          x2="70"
          y2="170"
          stroke="white"
          strokeWidth="1.5"
          opacity="0.6"
          custom={1}
          variants={pathVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        />
        <motion.line
          x1="110"
          y1="160"
          x2="70"
          y2="170"
          stroke="white"
          strokeWidth="1.5"
          opacity="0.6"
          custom={2}
          variants={pathVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        />
        <motion.line
          x1="120"
          y1="130"
          x2="80"
          y2="130"
          stroke="white"
          strokeWidth="1.5"
          opacity="0.6"
          custom={3}
          variants={pathVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        />
        <motion.line
          x1="120"
          y1="130"
          x2="110"
          y2="160"
          stroke="white"
          strokeWidth="1.5"
          opacity="0.6"
          custom={4}
          variants={pathVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        />

        {/* Group 2 Connections */}
        <motion.line
          x1="210"
          y1="120"
          x2="240"
          y2="150"
          stroke="white"
          strokeWidth="1.5"
          opacity="0.6"
          custom={5}
          variants={pathVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        />
        <motion.line
          x1="210"
          y1="120"
          x2="260"
          y2="110"
          stroke="white"
          strokeWidth="1.5"
          opacity="0.6"
          custom={6}
          variants={pathVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        />
        <motion.line
          x1="240"
          y1="150"
          x2="260"
          y2="110"
          stroke="white"
          strokeWidth="1.5"
          opacity="0.6"
          custom={7}
          variants={pathVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        />

        {/* Group 3 Connections */}
        <motion.line
          x1="280"
          y1="190"
          x2="320"
          y2="210"
          stroke="white"
          strokeWidth="1.5"
          opacity="0.6"
          custom={8}
          variants={pathVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        />

        {/* Cross-group optimal connections */}
        <motion.line
          x1="110"
          y1="160"
          x2="210"
          y2="120"
          stroke="white"
          strokeWidth="1"
          opacity="0.3"
          strokeDasharray="4 2"
          custom={9}
          variants={pathVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        />
        <motion.line
          x1="240"
          y1="150"
          x2="280"
          y2="190"
          stroke="white"
          strokeWidth="1"
          opacity="0.3"
          strokeDasharray="4 2"
          custom={10}
          variants={pathVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        />
      </g>
    </svg>
  );
}
