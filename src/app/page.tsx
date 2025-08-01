

"use client";

import { useState, useEffect } from "react";
import { useWorkouts } from "@/hooks/use-workouts";
import {
  Plus,
  BookOpen,
  ChevronRight,
  ArrowLeft,
  Trash2,
  MoreVertical,
  TrendingUp,
  LogOut,
  Copy,
  Weight,
  Target,
  Repeat,
  Info,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { type NewWorkoutSet, type Exercise, type Folder, type WorkoutSet } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format, formatDistanceToNowStrict, parseISO } from "date-fns";
import { ProgressChart } from "@/components/progress-chart";
import { ScrollArea } from "@/components/ui/scroll-area";
import { WorkoutComparison } from "@/components/workout-comparison";
import { createClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { useSwipeable } from "react-swipeable";
import { BottomNavBar, type NavItem } from "@/components/bottom-nav-bar";
import { TrainerPage } from "@/components/trainer-page";
import { ProfilePage } from "@/components/profile-page";
import { WorkoutLogger } from "@/components/workout-logger";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";


const popularExercises = [
    // Chest
    "Barbell Bench Press", "Dumbbell Bench Press", "Incline Barbell Bench Press", "Incline Dumbbell Bench Press",
    "Decline Barbell Bench Press", "Decline Dumbbell Bench Press", "Push Up", "Dips", "Chest Fly (Dumbbell)",
    "Chest Fly (Machine)", "Cable Crossover", "Peck Deck Machine", "Incline Dumbbell Flyes", "Decline Dumbbell Flyes",
    "Landmine Press", "Svend Press", "Chest Squeeze Push-up", "Dumbbell Pullover", "Around the Worlds",

    // Back
    "Deadlift (Conventional)", "Deadlift (Sumo)", "Barbell Row", "Bent Over Row", "T-Bar Row", "Pendlay Row",
    "Pull Up", "Chin Up", "Lat Pulldown (Wide Grip)", "Lat Pulldown (Close Grip)", "Seated Cable Row",
    "Dumbbell Row", "Single Arm Dumbbell Row", "Good Mornings", "Back Extension (Hyperextension)",
    "Face Pull", "Rack Pull", "Kroc Row", "Meadows Row", "Chest-Supported Row", "Inverted Row", "Superman",
    "Renegade Row", "Lat Prayer",

    // Legs
    "Back Squat", "Front Squat", "Leg Press", "Leg Extension", "Lying Leg Curl", "Seated Leg Curl",
    "Romanian Deadlift", "Stiff-Legged Deadlift", "Bulgarian Split Squat", "Lunge (Dumbbell/Barbell)",
    "Walking Lunge", "Calf Raise (Standing)", "Calf Raise (Seated)", "Hip Thrust (Barbell)", "Hack Squat",
    "Goblet Squat", "Box Squat", "Sissy Squat", "Nordic Hamstring Curl", "Pistol Squat", "Glute Bridge",
    "Hip Abduction (Machine)", "Hip Adduction (Machine)", "Step-up",

    // Shoulders
    "Overhead Press (Barbell/Military Press)", "Seated Dumbbell Press", "Arnold Press", "Dumbbell Lateral Raise",
    "Front Raise (Dumbbell/Plate)", "Reverse Pec-Deck", "Bent-Over Dumbbell Raise", "Upright Row",
    "Barbell Shrug", "Dumbbell Shrug", "Cable Lateral Raise", "Lu Raises", "Y-Raises", "Bus Drivers",
    "Viking Press", "Pike Push-up", "Handstand Push-up",

    // Biceps
    "Barbell Curl", "Dumbbell Curl", "Alternating Dumbbell Curl", "Hammer Curl", "Preacher Curl (Barbell/Dumbbell)",
    "Concentration Curl", "Cable Curl (Straight Bar/EZ Bar)", "Incline Dumbbell Curl", "Spider Curl",
    "Zottman Curl", "Waiter Curl", "Reverse Barbell Curl", "Drag Curl",

    // Triceps
    "Close Grip Bench Press", "Skull Crusher (Lying Tricep Extension)", "Tricep Pushdown (Rope/V-Bar)",
    "Overhead Tricep Extension (Dumbbell/Cable)", "Tricep Dips (Bench/Parallel Bars)", "Rope Pushdown",
    "JM Press", "Tate Press", "Diamond Push-up", "Kickback (Dumbbell/Cable)", "Single Arm Tricep Pushdown",

    // Abs
    "Crunch", "Sit-up", "Leg Raise (Lying/Hanging)", "Plank", "Russian Twist", "Cable Crunch", "Ab Roller",
    "Side Plank", "Bicycle Crunch", "Woodchopper (Cable)", "Pallof Press", "Dragon Flag", "V-up", "Flutter Kicks",
    "Mountain Climber",

    // Forearms
    "Wrist Curl (Dumbbell/Barbell)", "Reverse Wrist Curl", "Farmer's Walk", "Plate Pinch", "Gripper", "Behind-the-Back Wrist Curl",

    // Glutes (often covered in Legs, but can be specialized)
    "Cable Kickback", "Banded Side Walk", "Fire Hydrant", "Hip Abduction", "Sumo Squat", "Single-Leg Glute Bridge",

    // Calves (often covered in Legs)
    "Donkey Calf Raise", "Leg Press Calf Raise", "Jump Rope",

    // Full Body / Compound
    "Clean and Jerk", "Snatch", "Thruster (Barbell/Dumbbell)", "Kettlebell Swing", "Burpee", "Turkish Get-Up",
    "Man Maker", "Bear Crawl", "Tire Flip", "Sled Push/Pull"
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
            <DialogContent>
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
            <div
                className="absolute inset-y-0 left-0 flex items-center justify-center bg-primary text-primary-foreground px-6"
                style={{ width: `${Math.max(0, swipeX)}px`, opacity: Math.max(0, swipeX) / 80 }}
            >
                <Copy className="w-5 h-5" />
            </div>

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

  const handleAboutExercise = () => {
    window.open(`https://www.google.com/search?q=${encodeURIComponent(exercise.name + " exercise")}`, '_blank');
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
            <DropdownMenuItem onSelect={handleAboutExercise}>
              <Info className="w-4 h-4 mr-2" /> About Exercise
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onDeleteExercise(folder.id, exercise.id)} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Exercise
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        
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
      
        <Dialog open={isLoggingOpen} onOpenChange={setIsLoggingOpen}>
          <DialogTrigger asChild>
            <Button size="default" className="rounded-full w-14 h-14 fixed bottom-20 right-6 shadow-lg z-20">
              <Plus className="w-6 h-6"/>
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
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);

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
      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        <Dialog open={isAddExerciseOpen} onOpenChange={setIsAddExerciseOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="mr-2" /> Add Exercise
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add an Exercise</DialogTitle>
              <DialogDescription>
                Select a popular exercise or add your own custom one.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
               <div className="space-y-2">
                <Label>Popular Exercises</Label>
                <DropdownMenu open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                      disabled={!!newExerciseName.trim()}
                    >
                      {selectedPopularExercise || "Select exercise..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Search exercises..." />
                      <ScrollArea className="h-[200px]">
                        <CommandList>
                          <CommandEmpty>No exercise found.</CommandEmpty>
                          <CommandGroup>
                            {popularExercises.slice().sort().map((ex) => (
                              <CommandItem
                                key={ex}
                                value={ex}
                                onSelect={(currentValue) => {
                                  setSelectedPopularExercise(
                                    currentValue === selectedPopularExercise ? "" : currentValue
                                  );
                                  setIsComboboxOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedPopularExercise === ex
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {ex}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </ScrollArea>
                    </Command>
                  </DropdownMenuContent>
                </DropdownMenu>
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

function WorkoutsView({user, onSignOut}) {
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

  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderNotes, setNewFolderNotes] = useState("");
  const [activeView, setActiveView] = useState<'workouts' | 'folder' | 'exercise'>('workouts');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const selectedFolder = folders.find(f => f.id === selectedFolderId);

  const handleAddFolder = () => {
    if (newFolderName.trim()) {
        addFolder(newFolderName.trim(), newFolderNotes.trim());
        setNewFolderName("");
        setNewFolderNotes("");
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
      </header>
      <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        <div className="space-y-2">
            <Dialog>
                <DialogTrigger asChild>
                    <button className="w-full text-left p-2 rounded-md hover:bg-accent flex items-center gap-3 text-primary">
                        <Plus className="w-5 h-5"/>
                        <span className="font-semibold">New Workout Folder...</span>
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
                            <Label htmlFor="folder-notes">Notes</Label>
                            <Textarea id="folder-notes" placeholder="e.g. Focus on slow, controlled reps this week." value={newFolderNotes} onChange={(e) => setNewFolderNotes(e.target.value)} />
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
                 }} className="w-full text-left p-3 rounded-md hover:bg-accent flex items-center justify-between">
                    <div className="flex items-start gap-3">
                        <BookOpen className="w-5 h-5 mt-1"/>
                        <div className="flex flex-col items-start">
                            <span>{folder.name}</span>
                            {folder.notes && <p className="text-xs text-muted-foreground text-left">{folder.notes}</p>}
                        </div>
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

function MainContent({user}: {user: User}) {
    const [activeTab, setActiveTab] = useState<NavItem>('workouts');
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState(user);
    const supabase = createClient();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.refresh();
    }

    const refreshUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setCurrentUser(user);
        }
    }

    useEffect(() => {
      if (user) {
        setCurrentUser(user);
      }
    }, [user]);

    return (
        <div className="h-full flex flex-col">
            <main className="flex-1 overflow-y-auto">
                {activeTab === 'workouts' && <WorkoutsView user={currentUser} onSignOut={handleSignOut} />}
                {activeTab === 'trainer' && <TrainerPage user={currentUser} onRoleChange={refreshUser} />}
                {activeTab === 'profile' && <ProfilePage user={currentUser} onSignOut={handleSignOut} onRoleChange={refreshUser} />}
            </main>
            <BottomNavBar activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
    )
}

function LoadingSkeleton() {
    return (
        <div className="flex flex-col h-screen">
            <header className="flex items-center justify-between p-4 border-b">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-8 w-8 rounded-full" />
            </header>
            <main className="flex-1 overflow-y-auto p-4 space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
            </main>
            <div className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border z-20">
                <div className="flex justify-around items-center h-full">
                    <Skeleton className="h-10 w-16" />
                    <Skeleton className="h-10 w-16" />
                    <Skeleton className="h-10 w-16" />
                </div>
            </div>
        </div>
    )
}


export default function Home() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const getSession = async () => {
          const { data: { session } } = await supabase.auth.getSession();
          setUser(session?.user ?? null);
          if (!session?.user) {
              router.push('/login');
          }
          setLoading(false);
        }
        getSession();

        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
           setUser(session?.user ?? null);
            if (!session?.user) {
                router.push('/login');
           }
           setLoading(false);
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [router, supabase]);

    if (loading) {
        return <LoadingSkeleton />;
    }

    if (!user) {
        return null;
    }
    
    return <MainContent user={user} />
}
