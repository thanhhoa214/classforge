// components/landing/HowItWorksSection.jsx
"use client";
import { motion } from "motion/react";
import { useInView } from "react-intersection-observer";
import ProcessSVG from "./illustrations/ProcessSVG";

export default function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Import Student Data",
      description:
        "Upload your student information using our CSV/Excel templates or input data directly.",
    },
    {
      number: "02",
      title: "Collect Relationship Data",
      description:
        "Gather student social preference data through our built-in survey tools.",
    },
    {
      number: "03",
      title: "Analyze Network Dynamics",
      description:
        "View interactive visualizations of classroom social networks and key metrics.",
    },
    {
      number: "04",
      title: "Generate Optimal Allocations",
      description:
        "Create balanced class groups using our advanced allocation algorithms.",
    },
  ];

  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { x: -30, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.6 },
    },
  };

  return (
    <section
      className="py-24 bg-gradient-to-br from-indigo-50 to-purple-50 relative"
      id="how-it-works"
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.h2
            className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600"
            initial={{ opacity: 0, y: -20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
            transition={{ duration: 0.6 }}
          >
            How ClassForge Works
          </motion.h2>
          <motion.p
            className="text-xl text-gray-600 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Transform your classroom dynamics in four simple steps
          </motion.p>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 items-center">
          <motion.div
            className="lg:w-1/2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={
              inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }
            }
            transition={{ duration: 0.8 }}
          >
            <div className="relative h-[400px] w-full">
              <ProcessSVG />
            </div>
          </motion.div>

          <motion.div
            ref={ref}
            className="lg:w-1/2"
            variants={containerVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
          >
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className="mb-8 flex"
                variants={itemVariants}
              >
                <div className="mr-6">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold">
                    {step.number}
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
