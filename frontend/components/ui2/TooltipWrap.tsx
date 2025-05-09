import { cn } from "@/lib/utils";
import { Info, type LucideProps } from "lucide-react";
import type React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface TooltipWrapProps {
  content: React.ReactNode;
  asChild?: boolean;
  className?: string;
  size?: "sm" | "md";
}

export default function TooltipWrap({
  asChild,
  children,
  content,
  className,
  size = "md",
}: React.PropsWithChildren<TooltipWrapProps>) {
  if (!content) return children;

  return (
    <Tooltip>
      <TooltipTrigger asChild={asChild}>{children}</TooltipTrigger>
      <TooltipContent
        className={cn("max-w-xs w-60", size === "sm" && "px-2 py-1", className)}
      >
        {content}
      </TooltipContent>
    </Tooltip>
  );
}

export function TooltipWrapInfo({
  content,
  tooltipClassName,
  tooltipSize,

  className,
  size,
  ...props
}: LucideProps & {
  content: React.ReactNode;
  tooltipSize?: TooltipWrapProps["size"];
  tooltipClassName?: string;
}) {
  return (
    <TooltipWrap
      content={content}
      size={tooltipSize}
      className={tooltipClassName}
    >
      <Info
        size={size || 16}
        className={cn("inline-block mb-0.5", className)}
        {...props}
      />
    </TooltipWrap>
  );
}
