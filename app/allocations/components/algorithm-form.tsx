"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Form, FormLabel } from "@/components/ui/form";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  AlgorithmType,
  type AllocationConfig,
  AllocationConfigSchema,
  type AllocationResult,
  PriorityType,
  type Preset,
  type Priority,
} from "../types";
import {
  generateAllocation,
  savePreset,
  loadPresets,
  deletePreset,
} from "../actions";

interface AlgorithmFormProps {
  onResult: (result: AllocationResult) => void;
}

interface SortablePriorityItemProps {
  id: string;
  name: string;
  weight: number;
  onWeightChange: (value: number) => void;
  onDelete: () => void;
}

function SortablePriorityItem({
  id,
  name,
  weight,
  onWeightChange,
  onDelete,
}: SortablePriorityItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 p-4 bg-card border rounded-lg"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        ⋮⋮
      </div>
      <div className="flex-1">
        <p className="font-medium">{name}</p>
      </div>
      <div className="w-48">
        <Slider
          value={[weight]}
          onValueChange={([value]) => onWeightChange(value)}
          min={0}
          max={1}
          step={0.1}
        />
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onDelete}
        className="text-destructive"
      >
        ×
      </Button>
    </div>
  );
}

export function AlgorithmForm({ onResult }: AlgorithmFormProps) {
  const { toast } = useToast();
  const [presets, setPresets] = useState<Preset[]>([]);
  const [isPresetDialogOpen, setIsPresetDialogOpen] = useState(false);
  const [presetName, setPresetName] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const form = useForm<AllocationConfig>({
    resolver: zodResolver(AllocationConfigSchema),
    defaultValues: {
      algorithm: AlgorithmType.GNN,
      parameters: {
        learningRate: 0.01,
        epochs: 100,
        batchSize: 32,
      },
      priorities: Object.entries(PriorityType).map(([key, value], index) => ({
        id: crypto.randomUUID(),
        name: key.charAt(0) + key.slice(1).toLowerCase(),
        type: value,
        weight: 0.5,
        order: index,
      })),
      constraints: [],
    },
  });

  useEffect(() => {
    loadPresets().then(setPresets).catch(console.error);
  }, []);

  async function onSubmit(data: AllocationConfig) {
    try {
      const result = await generateAllocation(data);
      onResult(result);
      toast({
        title: "Allocation Generated",
        description:
          "The classroom allocation has been generated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to generate allocation",
        variant: "destructive",
      });
    }
  }

  async function handleSavePreset() {
    try {
      await savePreset(presetName, form.getValues());
      const updatedPresets = await loadPresets();
      setPresets(updatedPresets);
      setIsPresetDialogOpen(false);
      setPresetName("");
      toast({
        title: "Preset Saved",
        description: "Your configuration has been saved as a preset.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save preset",
        variant: "destructive",
      });
    }
  }

  async function handleDeletePreset(id: string) {
    try {
      await deletePreset(id);
      const updatedPresets = await loadPresets();
      setPresets(updatedPresets);
      toast({
        title: "Preset Deleted",
        description: "The preset has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete preset",
        variant: "destructive",
      });
    }
  }

  function handlePriorityReorder(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const priorities = form.getValues("priorities");
    const oldIndex = priorities.findIndex((p) => p.id === active.id);
    const newIndex = priorities.findIndex((p) => p.id === over.id);

    const newPriorities = arrayMove(priorities, oldIndex, newIndex).map(
      (priority: Priority, index: number) => ({ ...priority, order: index })
    );

    form.setValue("priorities", newPriorities);
  }

  function handlePriorityWeightChange(id: string, weight: number) {
    const priorities = form.getValues("priorities");
    const newPriorities = priorities.map((p) =>
      p.id === id ? { ...p, weight } : p
    );
    form.setValue("priorities", newPriorities);
  }

  function handlePriorityDelete(id: string) {
    const priorities = form.getValues("priorities");
    const newPriorities = priorities.filter((p) => p.id !== id);
    form.setValue("priorities", newPriorities);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <FormLabel>Saved Presets</FormLabel>
          <div className="mt-2 space-y-2">
            {presets.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No presets saved yet.
              </p>
            )}
            {presets.map((preset) => (
              <div
                key={preset.id}
                className="flex items-center justify-between p-2 border rounded"
              >
                <span>{preset.name}</span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => form.reset(preset.config)}
                  >
                    Load
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => handleDeletePreset(preset.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <FormLabel>Priorities</FormLabel>
            <Dialog
              open={isPresetDialogOpen}
              onOpenChange={setIsPresetDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Save as Preset
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Configuration as Preset</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Preset name"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                  />
                  <Button onClick={handleSavePreset}>Save</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handlePriorityReorder}
          >
            <SortableContext
              items={form.getValues("priorities").map((p) => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {form.getValues("priorities").map((priority) => (
                  <SortablePriorityItem
                    key={priority.id}
                    id={priority.id}
                    name={priority.name}
                    weight={priority.weight}
                    onWeightChange={(value) =>
                      handlePriorityWeightChange(priority.id, value)
                    }
                    onDelete={() => handlePriorityDelete(priority.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        <Button type="submit">Generate Allocation</Button>
      </form>
    </Form>
  );
}
