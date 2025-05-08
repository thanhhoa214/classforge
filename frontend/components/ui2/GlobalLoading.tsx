"use client";

import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { useEffect } from "react";
import { create } from "zustand";
import CTASVG from "../landing/illustrations/CTASVG";

interface GlobalLoadingState {
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useGlobalLoading = create<GlobalLoadingState>((set) => ({
  loading: false,
  setLoading: (loading) => set({ loading }),
}));

export default function GlobalLoading() {
  const { loading } = useGlobalLoading();

  useEffect(() => {
    document.body.style.overflow = loading ? "hidden" : "auto";
  }, [loading]);

  return (
    <div
      className={cn(
        "flex justify-center items-center h-[100dvh] w-full top-0 left-0 fixed bg-neutral-100/80 backdrop-blur-md z-50 animate-in animate-out fade-in-50 duration-300",
        loading ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      <motion.div
        className="lg:w-1/2"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="relative h-[300px] w-full">
          <CTASVG color="#000000" />
        </div>
      </motion.div>
    </div>
  );
}
