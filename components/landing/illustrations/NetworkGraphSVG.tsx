"use client";

import { useRef } from "react";
import { motion } from "motion/react";

export default function NetworkGraphSVG() {
  const svgRef = useRef(null);

  // Animation for nodes and connections
  const nodeVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: (i: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        delay: i * 0.05,
        duration: 0.5,
      },
    }),
  };

  const lineVariants = {
    initial: { pathLength: 0, opacity: 0 },
    animate: (i: number) => ({
      pathLength: 1,
      opacity: 0.6,
      transition: {
        delay: i * 0.03 + 0.5,
        duration: 1,
        ease: "easeInOut",
      },
    }),
  };

  // Nodes positioning for the network
  const nodes = [
    { id: 1, x: 200, y: 100, r: 15, color: "#4f46e5" }, // indigo-600
    { id: 2, x: 120, y: 180, r: 12, color: "#7c3aed" }, // violet-600
    { id: 3, x: 280, y: 180, r: 12, color: "#4f46e5" },
    { id: 4, x: 70, y: 250, r: 10, color: "#6366f1" }, // indigo-500
    { id: 5, x: 170, y: 250, r: 10, color: "#8b5cf6" }, // violet-500
    { id: 6, x: 240, y: 250, r: 10, color: "#6366f1" },
    { id: 7, x: 320, y: 250, r: 10, color: "#8b5cf6" },
    { id: 8, x: 50, y: 320, r: 8, color: "#818cf8" }, // indigo-400
    { id: 9, x: 120, y: 320, r: 8, color: "#a78bfa" }, // violet-400
    { id: 10, x: 190, y: 320, r: 8, color: "#818cf8" },
    { id: 11, x: 260, y: 320, r: 8, color: "#a78bfa" },
    { id: 12, x: 330, y: 320, r: 8, color: "#818cf8" },
  ];

  // Connections between nodes
  const connections = [
    { from: 1, to: 2 },
    { from: 1, to: 3 },
    { from: 2, to: 4 },
    { from: 2, to: 5 },
    { from: 3, to: 6 },
    { from: 3, to: 7 },
    { from: 4, to: 8 },
    { from: 4, to: 9 },
    { from: 5, to: 9 },
    { from: 5, to: 10 },
    { from: 6, to: 10 },
    { from: 6, to: 11 },
    { from: 7, to: 11 },
    { from: 7, to: 12 },
    { from: 2, to: 3 },
    { from: 5, to: 6 },
    { from: 9, to: 10 },
    { from: 10, to: 11 },
  ];

  return (
    <svg viewBox="0 0 400 400" ref={svgRef} className="w-full h-full">
      {/* Background grid for depth */}
      <pattern
        id="smallGrid"
        width="10"
        height="10"
        patternUnits="userSpaceOnUse"
      >
        <path
          d="M 10 0 L 0 0 0 10"
          fill="none"
          stroke="rgba(107, 114, 128, 0.1)"
          strokeWidth="0.5"
        />
      </pattern>
      <rect width="100%" height="100%" fill="url(#smallGrid)" />

      {/* Graph connections */}
      {connections.map((connection, i) => {
        const from = nodes.find((n) => n.id === connection.from);
        const to = nodes.find((n) => n.id === connection.to);
        if (!from || !to) return null;
        return (
          <motion.line
            key={`connection-${from.id}-${to.id}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke="url(#lineGradient)"
            strokeWidth="2"
            custom={i}
            variants={lineVariants}
            initial="initial"
            animate="animate"
          />
        );
      })}

      {/* Line gradient */}
      <defs>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#7c3aed" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.8" />
        </linearGradient>
      </defs>

      {/* Network nodes */}
      {nodes.map((node, i) => (
        <motion.g
          key={`node-${node.id}`}
          custom={i}
          variants={nodeVariants}
          initial="initial"
          animate="animate"
        >
          {/* Glow effect */}
          <circle
            cx={node.x}
            cy={node.y}
            r={node.r + 5}
            fill={node.color}
            opacity="0.2"
          />
          {/* Node */}
          <circle cx={node.x} cy={node.y} r={node.r} fill={node.color} />
          {/* Reflection */}
          <circle
            cx={node.x - node.r * 0.3}
            cy={node.y - node.r * 0.3}
            r={node.r * 0.3}
            fill="white"
            opacity="0.5"
          />
        </motion.g>
      ))}
    </svg>
  );
}
