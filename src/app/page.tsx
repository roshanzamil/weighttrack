"use client";

import { useWorkouts } from "@/hooks/use-workouts";
import { Logo } from "@/components/logo";
import { WorkoutLogger } from "@/components/workout-logger";
import { WorkoutHistory } from "@/components/workout-history";
import { ProgressTracker } from "@/components/progress-tracker";
import { Dumbbell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Toaster } from "@/components/ui/toaster";

export default function Home() {
  const {
    workouts,
    addWorkout,
    getHistoryForExercise,
    getPersonalBest,
    getAllExercises,
    getLatestWorkout,
  } = useWorkouts();

  const exercises = getAllExercises();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 py-8">
        <header className="flex flex-col items-center text-center mb-12">
          <Logo />
          <h1 className="text-4xl md:text-5xl font-bold text-primary mt-4 tracking-tighter">
            Overload Pro
          </h1>
          <p className="mt-2 text-lg text-muted-foreground max-w-2xl">
            Track your lifts, visualize your progress, and crush your goals with AI-powered guidance.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 flex flex-col gap-8">
            <WorkoutLogger onAddWorkout={addWorkout} />
            <WorkoutHistory workouts={workouts} />
          </div>

          <div className="lg:col-span-2">
            {workouts.length > 0 ? (
               <ProgressTracker
                exercises={exercises}
                getHistoryForExercise={getHistoryForExercise}
                getPersonalBest={getPersonalBest}
                getLatestWorkout={getLatestWorkout}
              />
            ) : (
              <Card className="h-full min-h-[500px] flex flex-col items-center justify-center bg-card/50">
                <CardHeader>
                  <CardTitle className="text-center">Start Your Journey</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center text-center">
                   <Dumbbell className="w-16 h-16 text-primary mb-4" />
                  <p className="text-muted-foreground">
                    Log your first workout to see your progress here.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      <Toaster />
    </div>
  );
}
