
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell, Plus } from "lucide-react";
import { type NewWorkoutSet } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { DialogClose } from "./ui/dialog";

const formSchema = z.object({
  exerciseName: z.string(),
  exerciseId: z.string(),
  weight: z.coerce.number().min(0, { message: "Weight must be a positive number." }),
  reps: z.coerce.number().min(1, { message: "Reps must be at least 1." }),
});

interface WorkoutLoggerProps {
  onAddWorkout: (workout: NewWorkoutSet) => void;
  exerciseName: string;
  exerciseId: string;
  inDialog?: boolean;
}

export function WorkoutLogger({ onAddWorkout, exerciseName, exerciseId, inDialog = false }: WorkoutLoggerProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      exerciseName: exerciseName || "",
      exerciseId: exerciseId || "",
      weight: 0,
      reps: 0,
    },
  });

  useEffect(() => {
      form.setValue("exerciseName", exerciseName);
      form.setValue("exerciseId", exerciseId);
  }, [exerciseName, exerciseId, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
     const newSet: NewWorkoutSet = {
        exercise_id: values.exerciseId,
        exerciseName: values.exerciseName,
        weight: values.weight,
        reps: values.reps,
    }
    onAddWorkout(newSet);
    if (!inDialog) { 
        toast({
          title: "Workout Logged!",
          description: `${values.exerciseName} added to your history.`,
        });
    }
    form.reset({exerciseName: exerciseName || "", exerciseId: exerciseId || "", weight: 0, reps: 0});
  }
  
  const content = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weight (kg)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="60" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="reps"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reps</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="10" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {inDialog ? (
           <DialogClose asChild>
            <Button type="submit" className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Set
            </Button>
           </DialogClose>
        ) : (
            <Button type="submit" className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Set
            </Button>
        )}

      </form>
    </Form>
  )

  if (inDialog) {
    return content;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-primary" />
          Log a New Set
        </CardTitle>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
}
