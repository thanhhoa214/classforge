"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { comparePresets, getPresets } from "@/app/actions/allocations";
import {
  type Preset,
  type AllocationConfig,
  type AllocationResult,
} from "../types";

const comparisonSchema = z.object({
  preset1Id: z.string().min(1, "Please select a preset"),
  preset2Id: z.string().min(1, "Please select a preset"),
});

type ComparisonFormData = z.infer<typeof comparisonSchema>;

interface ComparisonResult {
  preset1: {
    name: string;
    config: AllocationConfig;
    allocation: AllocationResult;
  };
  preset2: {
    name: string;
    config: AllocationConfig;
    allocation: AllocationResult;
  };
}

export function PresetComparison() {
  const { toast } = useToast();
  const [presets, setPresets] = useState<Preset[]>([]);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ComparisonFormData>({
    resolver: zodResolver(comparisonSchema),
    defaultValues: {
      preset1Id: "",
      preset2Id: "",
    },
  });

  // Load presets on component mount
  useEffect(() => {
    getPresets()
      .then(setPresets)
      .catch(() => {
        toast({
          title: "Error",
          description: "Failed to load presets",
          variant: "destructive",
        });
      });
  }, [toast]);

  async function onSubmit(data: ComparisonFormData) {
    try {
      setIsLoading(true);
      const comparisonResult = await comparePresets(
        data.preset1Id,
        data.preset2Id
      );
      setResult(comparisonResult);
      toast({
        title: "Success",
        description: "Presets compared successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to compare presets",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Select Presets to Compare</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="preset1Id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Preset</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a preset" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {presets.map((preset) => (
                            <SelectItem key={preset.id} value={preset.id}>
                              {preset.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preset2Id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Second Preset</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a preset" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {presets.map((preset) => (
                            <SelectItem key={preset.id} value={preset.id}>
                              {preset.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Comparing..." : "Compare Presets"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {result && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{result.preset1.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Configuration</h3>
                  <pre className="bg-muted p-4 rounded-lg overflow-auto">
                    {JSON.stringify(result.preset1.config, null, 2)}
                  </pre>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Allocation Result</h3>
                  <pre className="bg-muted p-4 rounded-lg overflow-auto">
                    {JSON.stringify(result.preset1.allocation, null, 2)}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{result.preset2.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Configuration</h3>
                  <pre className="bg-muted p-4 rounded-lg overflow-auto">
                    {JSON.stringify(result.preset2.config, null, 2)}
                  </pre>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Allocation Result</h3>
                  <pre className="bg-muted p-4 rounded-lg overflow-auto">
                    {JSON.stringify(result.preset2.allocation, null, 2)}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
