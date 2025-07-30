"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProgressChart } from "./progress-chart";
import { type WorkoutSet } from "@/lib/types";
import { TrendingUp, Target, Bot, Sparkles } from "lucide-react";
import { type SuggestWeightIncreaseOutput } from "@/ai/flows/suggest-weight-increase";
import { getAISuggestion } from "@/app/actions";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

interface ProgressTrackerProps {
  exercises: string[];
  getHistoryForExercise: (exercise: string) => WorkoutSet[];
  getPersonalBest: (exercise: string) => WorkoutSet | null;
  getLatestWorkout: (exercise: string) => WorkoutSet | null;
}

export function ProgressTracker({
  exercises,
  getHistoryForExercise,
  getPersonalBest,
  getLatestWorkout,
}: ProgressTrackerProps) {
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<SuggestWeightIncreaseOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (exercises.length > 0 && !selectedExercise) {
      setSelectedExercise(exercises[0]);
    }
  }, [exercises, selectedExercise]);

  const chartData = useMemo(() => {
    if (!selectedExercise) return [];
    return getHistoryForExercise(selectedExercise);
  }, [selectedExercise, getHistoryForExercise]);

  const personalBest = useMemo(() => {
    if (!selectedExercise) return null;
    return getPersonalBest(selectedExercise);
  }, [selectedExercise, getPersonalBest]);

  const handleGetSuggestion = async () => {
    if (!selectedExercise) return;
    const latestWorkout = getLatestWorkout(selectedExercise);
    const pb = getPersonalBest(selectedExercise);

    if (!latestWorkout || !pb) {
      setError("Not enough data to make a suggestion. Keep logging!");
      return;
    }

    setIsLoading(true);
    setError(null);
    setAiSuggestion(null);

    const result = await getAISuggestion({
      exerciseName: selectedExercise,
      previousWeight: latestWorkout.weight,
      previousReps: latestWorkout.reps,
      personalBestWeight: pb.weight,
    });

    if (result.success) {
      setAiSuggestion(result.data!);
    } else {
      setError(result.error);
    }
    setIsLoading(false);
  };
  
  return (
    <Card className="min-h-[500px]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Progress Tracker
        </CardTitle>
        <CardDescription>
          Visualize your gains and get AI-powered advice.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Select
          value={selectedExercise ?? ""}
          onValueChange={(value) => {
            setSelectedExercise(value);
            setAiSuggestion(null);
            setError(null);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select an exercise" />
          </SelectTrigger>
          <SelectContent>
            {exercises.map((ex) => (
              <SelectItem key={ex} value={ex}>
                {ex}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedExercise && (
          <>
            <div className="h-[250px]">
              <ProgressChart data={chartData} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {personalBest && (
                <Card className="bg-accent/10 border-accent">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2 text-accent">
                      <Target className="w-5 h-5" /> Personal Best
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold font-mono text-white">
                      {personalBest.weight}kg for {personalBest.reps} reps
                    </p>
                  </CardContent>
                </Card>
              )}
              
              <Card className="bg-secondary">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Bot className="w-5 h-5 text-primary" />
                        Next Step
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleGetSuggestion} disabled={isLoading || !personalBest}>
                        Suggest Next Set
                    </Button>
                </CardContent>
              </Card>

            </div>

             {isLoading && (
                <div className="space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                </div>
            )}
            
            {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

            {aiSuggestion && (
              <Alert className="border-primary bg-primary/5">
                <Sparkles className="h-5 w-5 text-primary" />
                <AlertTitle className="text-primary">AI Suggestion</AlertTitle>
                <AlertDescription>
                  <p className="font-semibold text-foreground">
                    Try {aiSuggestion.suggestedWeightIncrease > 0 ? `${personalBest!.weight + aiSuggestion.suggestedWeightIncrease}kg` : ''} 
                    {aiSuggestion.suggestedWeightIncrease > 0 && aiSuggestion.suggestedRepsIncrease > 0 ? ' for ' : ''}
                    {aiSuggestion.suggestedRepsIncrease > 0 ? `${personalBest!.reps + aiSuggestion.suggestedRepsIncrease} reps` : ''}.
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">{aiSuggestion.reasoning}</p>
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
