"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useInView } from "react-intersection-observer";
import { Card, CardContent } from "@/components/ui/card";
import {
  Network,
  UserCircle,
  BarChart4,
  Settings,
  Users,
  BrainCircuit,
} from "lucide-react";

export default function FeaturesSection() {
  const features = [
    {
      icon: <Network size={48} />,
      title: "Social Network Analysis",
      description:
        "Visualize classroom dynamics with powerful network graphs and identify key relationships.",
    },
    {
      icon: <UserCircle size={48} />,
      title: "Student Management",
      description:
        "Manage student data easily with advanced filtering and batch editing capabilities.",
    },
    {
      icon: <BarChart4 size={48} />,
      title: "Metrics Dashboard",
      description:
        "Monitor key classroom metrics like isolation count and connection density at a glance.",
    },
    {
      icon: <Settings size={48} />,
      title: "Algorithm Configuration",
      description:
        "Fine-tune allocation parameters with intuitive sliders and priority weighting.",
    },
    {
      icon: <Users size={48} />,
      title: "Classroom Allocation",
      description:
        "Generate balanced classrooms that optimize student interactions and learning outcomes.",
    },
    {
      icon: <BrainCircuit size={48} />,
      title: "AI-Powered Insights",
      description:
        "Uncover hidden patterns in classroom dynamics with advanced analytics.",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 },
    },
  };

  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const { scrollYProgress } = useScroll();

  // Create parallax effect values
  const featuresOpacity = useTransform(
    scrollYProgress,
    [0.1, 0.2, 0.3],
    [0, 1, 1]
  );

  return (
    <motion.section
      style={{ opacity: featuresOpacity }}
      className="py-24 bg-white relative"
      id="features"
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.h2
            className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600"
            initial={{ opacity: 0, y: -20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
            transition={{ duration: 0.6 }}
          >
            Powerful Features
          </motion.h2>
          <motion.p
            className="text-xl text-gray-600 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Everything you need to understand and optimize classroom dynamics
          </motion.p>
        </div>

        <motion.div
          ref={ref}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={itemVariants} className="h-full">
              <Card className="h-full transition-all duration-300 hover:shadow-lg hover:border-indigo-200">
                <CardContent className="pt-6 pb-8 px-6 flex flex-col items-center text-center h-full">
                  <div className="mb-4 p-3 rounded-full bg-indigo-50 text-indigo-600">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}
