
"use client";

import { useState } from "react";
import { useWorkouts } from "@/hooks/use-workouts";
import { Logo } from "@/components/logo";
import { WorkoutLogger } from "@/components/workout-logger";
import { WorkoutHistory } from "@/components/workout-history";
import { ProgressTracker } from "@/components/progress-tracker";
import { FolderPlus, Dumbbell, Plus, Trash2, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { type NewWorkoutSet } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";


export default function Home() {
  const {
    workouts,
    addWorkout,
    getHistoryForExercise,
    getPersonalBest,
    getAllExercises,
    getLatestWorkout,
    folders,
    addFolder,
    addExerciseToFolder,
    deleteFolder,
  } = useWorkouts();
  const { toast } = useToast();

  const [newFolderName, setNewFolderName] = useState("");
  const [newExerciseName, setNewExerciseName] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState('folders'); // 'folders' or 'dashboard'
  const [selectedExerciseForLogging, setSelectedExerciseForLogging] = useState<string | null>(null);


  const exercises = getAllExercises();

  const handleAddFolder = () => {
    if (newFolderName.trim()) {
      addFolder(newFolderName.trim());
      setNewFolderName("");
      toast({ title: "Folder created!" });
    }
  };

  const handleAddExercise = () => {
    if (newExerciseName.trim() && selectedFolderId) {
      addExerciseToFolder(selectedFolderId, newExerciseName.trim());
      setNewExerciseName("");
      toast({ title: "Exercise added!" });
    }
  };

  const handleLogSet = (workout: NewWorkoutSet) => {
    addWorkout(workout);
    toast({
      title: "Workout Logged!",
      description: `${workout.exerciseName} added to your history.`,
    });
  };

  if (activeView === 'dashboard') {
    return (
      <div className="min-h-screen bg-background text-foreground">
         <Button onClick={() => setActiveView('folders')} variant="outline" className="m-4">Back to Folders</Button>
        <main className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 flex flex-col gap-8">
              <WorkoutHistory workouts={workouts} />
            </div>
            <div className="lg:col-span-2">
              <ProgressTracker
                  exercises={exercises}
                  getHistoryForExercise={getHistoryForExercise}
                  getPersonalBest={getPersonalBest}
                  getLatestWorkout={getLatestWorkout}
                />
            </div>
          </div>
        </main>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 py-8">
        <header className="flex flex-col items-center text-center mb-12">
          <Logo />
          <h1 className="text-4xl md:text-5xl font-bold text-primary mt-4 tracking-tighter">
            Overload Pro
          </h1>
          <p className="mt-2 text-lg text-muted-foreground max-w-2xl">
            Create folders to organize your exercises, then log your sets and track your progress.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderPlus /> Create Folder
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="e.g. Push Day"
                  />
                  <Button onClick={handleAddFolder}>Create</Button>
                </div>
              </CardContent>
            </Card>
             <Button onClick={() => setActiveView('dashboard')} className="mt-4 w-full">View Progress Dashboard</Button>

          </div>
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>My Exercise Folders</CardTitle>
              </CardHeader>
              <CardContent>
                {folders.length === 0 ? (
                   <p className="text-muted-foreground text-center py-8">No folders yet. Create one to get started!</p>
                ) : (
                <Accordion type="single" collapsible className="w-full">
                  {folders.map(folder => (
                    <AccordionItem value={folder.id} key={folder.id}>
                      <AccordionTrigger className="text-lg font-semibold">
                        <div className="flex items-center justify-between w-full pr-4">
                            {folder.name}
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={(e) => {e.stopPropagation(); deleteFolder(folder.id)}}>
                                <Trash2 className="w-4 h-4"/>
                            </Button>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {folder.exercises.length > 0 &&
                          <ul className="space-y-2 mb-4">
                            {folder.exercises.map(exercise => (
                              <li key={exercise.id} className="flex justify-between items-center p-2 rounded-md bg-secondary">
                                <span>{exercise.name}</span>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" onClick={() => setSelectedExerciseForLogging(exercise.name)}>Add Set</Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Log Set for {selectedExerciseForLogging}</DialogTitle>
                                    </DialogHeader>
                                    <WorkoutLogger onAddWorkout={handleLogSet} exerciseName={selectedExerciseForLogging!} />
                                  </DialogContent>
                                </Dialog>
                              </li>
                            ))}
                          </ul>
                        }

                        <Dialog onOpenChange={(isOpen) => { if (isOpen) setSelectedFolderId(folder.id)}}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Plus className="mr-2 h-4 w-4" /> Add Exercise
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add Exercise to {folder.name}</DialogTitle>
                            </DialogHeader>
                            <div className="flex gap-2 mt-4">
                              <Input
                                value={newExerciseName}
                                onChange={(e) => setNewExerciseName(e.target.value)}
                                placeholder="e.g. Bench Press"
                              />
                              <DialogClose asChild>
                                <Button onClick={handleAddExercise}>Add</Button>
                              </DialogClose>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

