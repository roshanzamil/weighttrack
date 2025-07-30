
"use client";

import { useState, useEffect } from "react";
import { useWorkouts } from "@/hooks/use-workouts";
import { WorkoutLogger } from "@/components/workout-logger";
import {
  Settings,
  Plus,
  Library,
  BookOpen,
  ChevronRight,
  Dumbbell,
  Timer,
  Calendar,
  ArrowLeft,
  Trash2,
  MoreVertical,
  TrendingUp,
  LogOut,
  Copy,
  BarChart,
  Target,
  Repeat,
  Weight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { type NewWorkoutSet, type Exercise, type Folder, type WorkoutSet } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format, formatDistanceToNowStrict, parseISO } from "date-fns";
import { ProgressChart } from "@/components/progress-chart";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { WorkoutComparison } from "@/components/workout-comparison";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { useSwipeable } from "react-swipeable";
import { cn } from "@/lib/utils";


const popularExercises = [
  "Bench Press", "Squat", "Deadlift", "Overhead Press", "Barbell Row",
  "Pull Up", "Dumbbell Curl", "Tricep Extension", "Leg Press", "Lat Pulldown"
];

function EditSetDialog({ set, isOpen, onOpenChange, onUpdateSet, onDeleteSet, exerciseName }) {
    if (!set) return null;

    const [editedWeight, setEditedWeight] = useState(set.weight);
    const [editedReps, setEditedReps] = useState(set.reps);
    const [editedNotes, setEditedNotes] = useState(set.notes || "");
    const [editedDate, setEditedDate] = useState(new Date(set.date));

    const handleSave = () => {
        onUpdateSet({
            ...set,
            weight: Number(editedWeight),
            reps: Number(editedReps),
            notes: editedNotes,
            date: editedDate.toISOString(),
        });
        onOpenChange(false);
    }

    const handleDelete = () => {
        onDeleteSet(set.id);
        onOpenChange(false);
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent onPointerDownOutside={(e) => e.preventDefault()} vaul-drawer-wrapper="">
                <DialogHeader>
                    <DialogTitle>Edit Set</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="p-3 rounded-md bg-accent">
                      <Label className="text-xs text-muted-foreground">Exercise</Label>
                      <p>{exerciseName}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="reps">Repetitions</Label>
                            <Input id="reps" type="number" value={editedReps} onChange={e => setEditedReps(Number(e.target.value))} />
                        </div>
                        <div>
                            <Label htmlFor="weight">Weight (kg)</Label>
                            <Input id="weight" type="number" value={editedWeight} onChange={e => setEditedWeight(Number(e.target.value))} />
                        </div>
                    </div>
                     <div>
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea id="notes" placeholder="Comment" value={editedNotes} onChange={e => setEditedNotes(e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="date">Date</Label>
                        <Input
                            id="date"
                            type="date"
                            value={format(editedDate, 'yyyy-MM-dd')}
                            onChange={(e) => {
                                const dateValue = e.target.value;
                                // Add 'T00:00:00' to avoid timezone issues where it might select the previous day
                                const date = new Date(dateValue + 'T00:00:00');
                                if (!isNaN(date.getTime())) {
                                    setEditedDate(date);
                                }
                            }}
                        />
                    </div>
                </div>
                <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                     <Button variant="destructive" onClick={handleDelete} className="sm:mr-auto">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                    </Button>
                    <div className="flex flex-col-reverse sm:flex-row sm:gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button onClick={handleSave}>Save</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function SwipeableSetRow({ set, setIndexInDay, totalSetsInDay, onEdit, onReLog, onDelete }) {
    const [swipeX, setSwipeX] = useState(0);

    const handlers = useSwipeable({
        onSwiping: (event) => {
            if (event.dir === 'Right') {
                const newX = Math.max(0, Math.min(80, event.deltaX));
                setSwipeX(newX);
            } else if (event.dir === 'Left') {
                const newX = Math.min(0, Math.max(-80, event.deltaX));
                setSwipeX(newX);
            }
        },
        onSwiped: () => {
            // Snap back
            setSwipeX(0);
        },
        onSwipedRight: () => {
            onReLog(set);
        },
        onSwipedLeft: () => {
            onDelete(set.id);
        },
        trackMouse: true,
    });

    return (
        <div {...handlers} className="relative overflow-hidden bg-card rounded-lg">
            {/* Right Swipe Action */}
            <div
                className="absolute inset-y-0 left-0 flex items-center justify-center bg-primary text-primary-foreground px-6"
                style={{ width: `${Math.max(0, swipeX)}px`, opacity: Math.max(0, swipeX) / 80 }}
            >
                <Copy className="w-5 h-5" />
            </div>

            {/* Left Swipe Action */}
             <div
                className="absolute inset-y-0 right-0 flex items-center justify-center bg-destructive text-destructive-foreground px-6"
                style={{ width: `${Math.abs(Math.min(0, swipeX))}px`, opacity: Math.abs(Math.min(0, swipeX)) / 80 }}
            >
                <Trash2 className="w-5 h-5" />
            </div>

            <div
                className="relative bg-card transition-transform duration-200 ease-in-out"
                style={{ transform: `translateX(${swipeX}px)` }}
            >
                <button
                    className="w-full text-left p-3 hover:bg-accent transition-colors"
                    onClick={() => onEdit(set)}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span className="font-mono text-sm text-muted-foreground">{totalSetsInDay - setIndexInDay}</span>
                            <div className="text-sm">
                                {format(parseISO(set.date), 'p')}
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="font-semibold">{set.reps} rep</span>
                            <span className="font-semibold text-primary">{set.weight} kg</span>
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                    </div>
                </button>
            </div>
        </div>
    );
}

function ExerciseDetailView({
  folder,
  exercise,
  onBack,
  onLogSet,
  onDeleteExercise,
  sets,
  onUpdateSet,
  onDeleteSet,
}) {
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isLoggingOpen, setIsLoggingOpen] = useState(false);
  const [editingSet, setEditingSet] = useState<WorkoutSet | null>(null);
  const { toast } = useToast();

  const groupedSets = sets.reduce((acc, set) => {
    const date = format(parseISO(set.date), "eeee, dd MMM yyyy");
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(set);
    return acc;
  }, {});
  
  const handleEditSet = (set: WorkoutSet) => {
    setEditingSet(set);
  }

  const handleReLogSet = (set: WorkoutSet) => {
    onLogSet({
      exercise_id: set.exercise_id,
      exerciseName: exercise.name,
      weight: set.weight,
      reps: set.reps,
      notes: `Re-logged from a previous set.`
    });
    toast({
      title: "Set Re-logged!",
      description: `${set.weight}kg for ${set.reps} reps added.`
    })
  }

  const handleDeleteSetWithToast = (setId: string) => {
    onDeleteSet(setId);
    toast({
      title: "Set Deleted",
      description: "The set has been removed from your history.",
      variant: "destructive"
    });
  };

  const sessionDates = Object.keys(groupedSets).sort((a,b) => new Date(b).getTime() - new Date(a).getTime());
  const latestSession = sessionDates[0] ? groupedSets[sessionDates[0]] : [];
  const previousSession = sessionDates[1] ? groupedSets[sessionDates[1]] : [];

  const analyticsStats = {
    totalVolume: sets.reduce((sum, s) => sum + s.weight * s.reps, 0),
    totalSets: sets.length,
    personalBest: sets.reduce((pb, current) => (current.weight > pb.weight ? current : pb), sets[0] || {weight: 0, reps: 0}),
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="flex items-center justify-between p-4 border-b sticky top-0 bg-background z-10">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <div className="text-sm text-primary">{folder.name}</div>
            <h1 className="text-xl font-bold">{exercise.name}</h1>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => setIsAnalyticsOpen(true)}>
              <TrendingUp className="w-4 h-4 mr-2" /> View Analytics
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onDeleteExercise(folder.id, exercise.id)} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Exercise
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <main className="flex-1 overflow-y-auto">
        
        <ScrollArea className="h-[calc(100vh-140px)]">
           <div className="p-4 space-y-6">
            {Object.keys(groupedSets).length > 0 ? Object.entries(groupedSets).map(([date, setsInDay], dayIndex) => (
              <div key={date}>
                {dayIndex === 0 && <WorkoutComparison latestSession={latestSession} previousSession={previousSession} />}
                <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-1 mt-4">{date.toUpperCase()}</h3>
                <div className="space-y-1">
                  {setsInDay.map((set, setIndex) => (
                    <SwipeableSetRow
                      key={set.id}
                      set={set}
                      setIndexInDay={setIndex}
                      totalSetsInDay={setsInDay.length}
                      onEdit={handleEditSet}
                      onReLog={handleReLogSet}
                      onDelete={handleDeleteSetWithToast}
                    />
                  ))}
                </div>
              </div>
            )) : (
              <div className="text-center text-muted-foreground py-12">
                <p>No sets logged for this exercise yet.</p>
                <p>Tap the '+' button to get started!</p>
              </div>
            )}
           </div>
        </ScrollArea>
      </main>
      
      <footer className="p-4 border-t sticky bottom-0 bg-background z-10">
         <Dialog open={isLoggingOpen} onOpenChange={setIsLoggingOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="rounded-full w-16 h-16 absolute bottom-20 right-6 shadow-lg">
              <Plus className="w-8 h-8"/>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log Set: {exercise.name}</DialogTitle></DialogHeader>
            <WorkoutLogger 
              onAddWorkout={onLogSet}
              exerciseName={exercise.name}
              exerciseId={exercise.id}
              inDialog={true}
            />
          </DialogContent>
        </Dialog>
      </footer>

      {/* Analytics Dialog */}
      <Dialog open={isAnalyticsOpen} onOpenChange={setIsAnalyticsOpen}>
        <DialogContent className="max-w-3xl w-[95vw] h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Analytics: {exercise.name}</DialogTitle>
            <DialogDescription>
              Your performance overview for this exercise.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
                  <Weight className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analyticsStats.totalVolume.toLocaleString()} kg</div>
                  <p className="text-xs text-muted-foreground">across {analyticsStats.totalSets} sets</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Personal Best</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analyticsStats.personalBest.weight}kg</div>
                  <p className="text-xs text-muted-foreground">for {analyticsStats.personalBest.reps} reps</p>
                </CardContent>
              </Card>
               <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sets</CardTitle>
                  <Repeat className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analyticsStats.totalSets}</div>
                   <p className="text-xs text-muted-foreground invisible">hidden</p>
                </CardContent>
              </Card>
            </div>
          <div className="flex-1 w-full min-h-0">
            <ProgressChart data={sets} />
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Edit Set Dialog */}
      <EditSetDialog
          set={editingSet}
          isOpen={!!editingSet}
          onOpenChange={() => setEditingSet(null)}
          onUpdateSet={onUpdateSet}
          onDeleteSet={onDeleteSet}
          exerciseName={exercise.name}
      />
    </div>
  );
}


function FolderView({ folder, onBack, onAddExercise, onDeleteFolder, onSelectExercise, getLatestWorkout }) {
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [selectedPopularExercise, setSelectedPopularExercise] = useState("");
  const { toast } = useToast();

  const handleAddExercise = () => {
    const exerciseToAdd = newExerciseName.trim() || selectedPopularExercise;
    if (exerciseToAdd) {
      onAddExercise(folder.id, exerciseToAdd);
      toast({ title: `"${exerciseToAdd}" added!` });
      setNewExerciseName("");
      setSelectedPopularExercise("");
      setIsAddExerciseOpen(false);
    }
  };

  const ExerciseLastLogged = ({ exerciseId }) => {
    const lastWorkout = getLatestWorkout(exerciseId);
    if (!lastWorkout) return <div className="text-xs text-muted-foreground">No sets yet</div>;

    const timeAgo = formatDistanceToNowStrict(parseISO(lastWorkout.date), { addSuffix: true });
    return <div className="text-xs text-muted-foreground">Last set: {timeAgo}</div>;
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-bold">{folder.name}</h1>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => onDeleteFolder(folder.id)} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Folder
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        <Dialog open={isAddExerciseOpen} onOpenChange={setIsAddExerciseOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="mr-2" /> Add Exercise
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add an Exercise</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Popular Exercises</Label>
                <Select onValueChange={setSelectedPopularExercise} value={selectedPopularExercise}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a popular exercise" />
                  </SelectTrigger>
                  <SelectContent>
                    {popularExercises.map(ex => (
                      <SelectItem key={ex} value={ex}>{ex}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="text-center text-sm text-muted-foreground">OR</div>
              <div className="space-y-2">
                <Label htmlFor="custom-exercise">Add a custom exercise</Label>
                <Input
                  id="custom-exercise"
                  placeholder="e.g. Incline Dumbbell Press"
                  value={newExerciseName}
                  onChange={(e) => setNewExerciseName(e.target.value)}
                  disabled={!!selectedPopularExercise}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddExerciseOpen(false)}>Cancel</Button>
              <Button onClick={handleAddExercise} disabled={!newExerciseName.trim() && !selectedPopularExercise}>Add Exercise</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {folder.exercises.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <p>This folder has no exercises.</p>
            <p>Add one to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {folder.exercises.map(exercise => (
              <Card key={exercise.id} className="bg-card hover:bg-accent/50 cursor-pointer" onClick={() => onSelectExercise(exercise)}>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">{exercise.name}</CardTitle>
                  <CardDescription>
                    <ExerciseLastLogged exerciseId={exercise.id} />
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function MainContent({user}: {user: User}) {
  const {
    addWorkout,
    updateWorkoutSet,
    deleteWorkoutSet,
    getHistoryForExercise,
    getLatestWorkout,
    folders,
    addFolder,
    addExerciseToFolder,
    deleteFolder,
    deleteExerciseFromFolder,
  } = useWorkouts(user);
  const { toast } = useToast();
  const router = useRouter();


  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDescription, setNewFolderDescription] = useState("");
  const [activeView, setActiveView] = useState<'workouts' | 'folder' | 'exercise'>('workouts');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const selectedFolder = folders.find(f => f.id === selectedFolderId);

  const handleAddFolder = () => {
    if (newFolderName.trim()) {
        addFolder(newFolderName.trim(), newFolderDescription.trim());
        setNewFolderName("");
        setNewFolderDescription("");
        toast({ title: "Folder created!" });
    }
  }
  
  const handleDeleteFolder = (folderId: string) => {
    deleteFolder(folderId);
    toast({ title: "Folder deleted." });
    setActiveView('workouts');
    setSelectedFolderId(null);
  };

  const handleDeleteExercise = (folderId: string, exerciseId: string) => {
    deleteExerciseFromFolder(folderId, exerciseId);
    toast({ title: "Exercise deleted."});
    setActiveView('folder');
    setSelectedExercise(null);
  }

  const handleLogSet = (workout: NewWorkoutSet) => {
    addWorkout(workout);
    toast({
      title: "Workout Logged!",
      description: `${workout.exerciseName} added to your history.`,
    });
  };

  const handleUpdateSet = (workout: WorkoutSet) => {
    updateWorkoutSet(workout);
    toast({
      title: "Set Updated!",
      description: `Your set for ${workout.exerciseName} has been updated.`,
    });
  };

  const handleDeleteSet = (workoutId: string) => {
    deleteWorkoutSet(workoutId);
    toast({
      title: "Set Deleted",
      description: "The workout set has been removed from your history.",
      variant: "destructive"
    });
  }

  const handleSelectExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setActiveView('exercise');
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  }

  if (activeView === 'exercise' && selectedFolder && selectedExercise) {
    return <ExerciseDetailView
      folder={selectedFolder}
      exercise={selectedExercise}
      onBack={() => {
        setActiveView('folder');
        setSelectedExercise(null);
      }}
      onLogSet={handleLogSet}
      onUpdateSet={handleUpdateSet}
      onDeleteSet={handleDeleteSet}
      onDeleteExercise={handleDeleteExercise}
      sets={getHistoryForExercise(selectedExercise.id)}
      />
  }

  if (activeView === 'folder' && selectedFolder) {
    return <FolderView
      folder={selectedFolder}
      onBack={() => {
        setActiveView('workouts');
        setSelectedFolderId(null);
      }}
      onAddExercise={addExerciseToFolder}
      onDeleteFolder={handleDeleteFolder}
      onSelectExercise={handleSelectExercise}
      getLatestWorkout={getLatestWorkout}
      />
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">My Workouts</h1>
        </div>
         <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="w-5 h-5" />
        </Button>
      </header>
      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="space-y-2">
            <Dialog>
                <DialogTrigger asChild>
                    <button className="w-full text-left p-2 rounded-md hover:bg-accent flex items-center gap-3 text-primary">
                        <Plus className="w-5 h-5"/>
                        <span className="font-semibold">New Workout...</span>
                    </button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create a new workout folder</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="folder-name">Name</Label>
                            <Input id="folder-name" placeholder="e.g. Upper Body" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="folder-description">Description</Label>
                            <Textarea id="folder-description" placeholder="A short description of this workout plan." value={newFolderDescription} onChange={(e) => setNewFolderDescription(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <DialogClose asChild>
                            <Button onClick={handleAddFolder} disabled={!newFolderName.trim()}>Create Folder</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>

        <div className="space-y-1">
            {folders.map(folder => (
                 <button key={folder.id} onClick={() => {
                    setSelectedFolderId(folder.id);
                    setActiveView('folder');
                 }} className="w-full text-left p-2 rounded-md hover:bg-accent flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <BookOpen className="w-5 h-5"/>
                        <span>{folder.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <span>{folder.exercises.length}</span>
                        <ChevronRight className="w-5 h-5"/>
                    </div>
                </button>
            ))}
        </div>
      </main>
    </div>
  );
}


export default function Home() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUser(session.user);
            } else {
                router.push('/login');
            }
            setLoading(false);
        };

        checkUser();

        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                router.push('/login');
            } else if (session?.user){
                setUser(session.user);
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [router]);

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    if (!user) {
        return null; // Or a loading spinner, router will redirect
    }

    return <MainContent user={user} />;
}

    
