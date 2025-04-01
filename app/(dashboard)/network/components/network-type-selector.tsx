"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { NetworkType } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NetworkTypeSelectorProps {
  currentType: NetworkType;
}

const NETWORK_TYPE_LABELS: Record<NetworkType, string> = {
  [NetworkType.FRIENDSHIP]: "Friendship",
  [NetworkType.ADVICE]: "Advice",
  [NetworkType.INFLUENCE]: "Influence",
  [NetworkType.DISRESPECT]: "Disrespect",
};

export function NetworkTypeSelector({ currentType }: NetworkTypeSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleTypeChange = (value: NetworkType) => {
    const params = new URLSearchParams(searchParams);
    params.set("type", value);
    router.push(`/network?${params.toString()}`);
  };

  return (
    <Select value={currentType} onValueChange={handleTypeChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select network type" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(NETWORK_TYPE_LABELS).map(([type, label]) => (
          <SelectItem key={type} value={type}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
