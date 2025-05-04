"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { NetworkType } from "@/lib/neo4j";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface NetworkTypeSelectorProps {
  currentType: NetworkType;
  onChange: (type: NetworkType) => void; // Add the onChange prop
}

const NETWORK_TYPE_LABELS: Record<NetworkType, string> = {
  [NetworkType.has_friend]: "Friendship",
  [NetworkType.has_influence]: "Influence",
  [NetworkType.get_advice]: "Advice",
  [NetworkType.has_feedback]: "Feedback",
  [NetworkType.spend_more_time]: "Spend More Time",
  [NetworkType.disrespect]: "Disrespect",
};

export function NetworkTypeSelector({
  currentType,
  onChange,
}: NetworkTypeSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleTypeChange = (value: NetworkType) => {
    // Update the search param
    const params = new URLSearchParams(searchParams);
    params.set("type", value);
    router.push(`/network?${params.toString()}`);

    // Inform the parent component
    onChange(value); // <-- this ensures the UI state updates immediately
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
