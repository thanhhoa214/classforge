import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type FormatNumberOption = {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  useGrouping?: boolean;
};

export function formatNumber(
  value: number | string = "0.0",
  decimals?: FormatNumberOption
) {
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
    useGrouping,
  } = decimals || {};
  const factor = Math.pow(10, maximumFractionDigits);
  const truncatedValue = Math.floor(Number(value) * factor) / factor;
  return truncatedValue.toLocaleString("en-US", {
    minimumFractionDigits,
    maximumFractionDigits,
    useGrouping,
  });
}
