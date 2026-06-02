"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MissionCanvasProps {
  children: React.ReactNode;
  className?: string;
  wide?: boolean;
}

/** Spacious main content frame — dense data lives inside, not in chrome. */
export default function MissionCanvas({
  children,
  className,
  wide = false,
}: MissionCanvasProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "mx-auto w-full px-5 md:px-8 lg:px-10 pt-7 md:pt-10 pb-28 md:pb-36",
        wide ? "max-w-[1600px]" : "max-w-[1400px]",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}
