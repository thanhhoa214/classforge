"use client";
import { useGlobalLoading } from "@/components/ui2/GlobalLoading";
import { motion } from "motion/react";
import { PropsWithChildren, useEffect } from "react";

export default function GlobalTransition({ children }: PropsWithChildren) {
  const { setLoading } = useGlobalLoading();

  useEffect(() => {
    setTimeout(() => setLoading(false), 100);
  }, [setLoading]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }} // Start from the bottom
      animate={{ opacity: 1, y: 0 }} // End at the original position
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
      }}
      className="w-full space-y-4"
    >
      {children}
    </motion.div>
  );
}
