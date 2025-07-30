
"use client";

import { useState } from "react";
import { useWorkouts } from "@/hooks/use-workouts";
import { WorkoutLogger } from "@/components/workout-logger";
import {
  Settings,
  Plus,
  Sparkles,
  Library,
  BookOpen,
  ChevronRight,
  Dumbbell,
  Timer,
  Calendar,
  ArrowLeft,
  Trash2,
  MoreVertical,
  AlertCircle,
  TrendingUp,
  X,
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
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format, formatDistanceToNowStrict, parseISO } from "date-fns";
import { ProgressChart } from "@/components/progress-chart";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";

const popularExercises = [
  "Bench Press", "Squat", "Deadlift", "Overhead Press", "Barbell Row",
  "Pull Up", "Dumbbell Curl", "Tricep Extension", "Leg Press", "Lat Pulldown"
];

function EditSetDialog({ set, isOpen, onOpenChange, onUpdateSet, onDeleteSet, allExercises }) {
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
                      <p>{set.exerciseName}</p>
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
                        <Label>Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className="w-full justify-start text-left font-normal"
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {format(editedDate, "PPP")}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <CalendarPicker
                                    mode="single"
                                    selected={editedDate}
                                    onSelect={(day) => day && setEditedDate(day)}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                <DialogFooter className="justify-between">
                     <Button variant="destructive" onClick={handleDelete} className="mr-auto">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button onClick={handleSave}>Save</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
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
  allExercises
}) {
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isLoggingOpen, setIsLoggingOpen] = useState(false);
  const [editingSet, setEditingSet] = useState<WorkoutSet | null>(null);

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
            <DropdownMenuItem onSelect={() => onDeleteExercise(folder.id, exercise.id)} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Exercise
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          <Button variant="outline" className="w-full justify-start" onClick={() => setIsAnalyticsOpen(true)}>
            <TrendingUp className="mr-2" /> Analytics
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-280px)]">
           <div className="p-4 space-y-6">
            {Object.keys(groupedSets).length > 0 ? Object.entries(groupedSets).map(([date, setsInDay], dayIndex) => (
              <div key={date}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-1">{date.toUpperCase()}</h3>
                <div className="space-y-1">
                  {setsInDay.map((set, setIndex) => (
                    <button 
                      key={set.id} 
                      className="w-full text-left p-3 rounded-lg bg-card hover:bg-accent transition-colors"
                      onClick={() => handleEditSet(set)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-sm text-muted-foreground">{setsInDay.length - setIndex}</span>
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Analytics: {exercise.name}</DialogTitle>
          </DialogHeader>
          <div className="h-[400px] w-full">
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
          allExercises={allExercises}
      />
    </div>
  );
}


function FolderView({ folder, onBack, onAddExercise, onDeleteFolder, onLogSet, onDeleteExercise, onSelectExercise }) {
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
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <CardTitle className="text-lg">{exercise.name}</CardTitle>
                   <Dialog>
                        <DialogTrigger asChild>
                           <Button size="sm" onClick={(e) => e.stopPropagation()}>
                                <Plus className="w-4 h-4 mr-2" /> Add Set
                           </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Log Set: {exercise.name}</DialogTitle>
                            </DialogHeader>
                            <WorkoutLogger
                                onAddWorkout={(workout) => {
                                    onLogSet(workout);
                                }}
                                exerciseName={exercise.name}
                                exerciseId={exercise.id}
                                inDialog={true}
                            />
                        </DialogContent>
                    </Dialog>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function MainContent() {
  const {
    workouts,
    addWorkout,
    updateWorkoutSet,
    deleteWorkoutSet,
    getHistoryForExercise,
    folders,
    addFolder,
    addExerciseToFolder,
    deleteFolder,
    deleteExerciseFromFolder,
    getAllExercises
  } = useWorkouts();
  const { toast } = useToast();
  const { isMobile, setOpenMobile, openMobile } = useSidebar();


  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDescription, setNewFolderDescription] = useState("");
  const [activeView, setActiveView] = useState<'workouts' | 'folder' | 'exercise'>('workouts');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const allExercises = folders.flatMap(f => f.exercises);
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
      allExercises={getAllExercises()}
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
      onLogSet={handleLogSet}
      onDeleteExercise={handleDeleteExercise}
      onSelectExercise={handleSelectExercise}
      />
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          {isMobile && (
             <Button variant="ghost" size="icon" onClick={() => setOpenMobile(!openMobile)}>
              <Settings className="w-6 h-6" />
            </Button>
          )}
          <h1 className="text-2xl font-bold">My Workouts</h1>
        </div>
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
            <button className="w-full text-left p-2 rounded-md hover:bg-accent flex items-center gap-3 text-primary">
                <Sparkles className="w-5 h-5"/>
                <span className="font-semibold">New Custom Plan...</span>
            </button>
        </div>

        <div className="space-y-1">
             <button className="w-full text-left p-2 rounded-md hover:bg-accent flex items-center justify-between" onClick={() => toast({title: "Coming soon!"})}>
                <div className="flex items-center gap-3">
                    <Library className="w-5 h-5"/>
                    <span>My Exercises</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <span>{allExercises.length}</span>
                    <ChevronRight className="w-5 h-5"/>
                </div>
            </button>
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

        <div>
            <Accordion type="single" collapsible defaultValue="item-1">
                <AccordionItem value="item-1" className="border-none">
                    <AccordionTrigger>
                        <h2 className="text-xl font-semibold">Workout Templates</h2>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Card className="bg-card">
                                <CardHeader>
                                    <CardTitle>Grow Your Upper Body</CardTitle>
                                    <CardDescription>Incline Bench Press, Seated Cable Row, Du...</CardDescription>
                                </CardHeader>
                            </Card>
                             <Card className="bg-card">
                                <CardHeader>
                                    <CardTitle>Burn Fat & Boost Endurance</CardTitle>
                                    <CardDescription>Goblet Squat, Kettlebell Swing, Dumbbell Pus...</CardDescription>
                                </CardHeader>
                            </Card>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
      </main>

      {/* Bottom Nav for Mobile */}
      {isMobile && (
        <footer className="sticky bottom-0 left-0 right-0 bg-background border-t p-2 flex justify-around items-center">
            <Button variant="ghost" className="flex flex-col h-auto items-center gap-1 text-primary">
                <Dumbbell className="w-6 h-6"/>
                <span className="text-xs">Sets</span>
            </Button>
            <Button variant="ghost" className="flex flex-col h-auto items-center gap-1 text-muted-foreground">
                <Timer className="w-6 h-6"/>
                <span className="text-xs">Sessions</span>
            </Button>
            <Button variant="ghost" className="flex flex-col h-auto items-center gap-1 text-muted-foreground">
                <Calendar className="w-6 h-6"/>
                <span className="text-xs">Today</span>
            </Button>
        </footer>
       )}
    </div>
  );
}


export default function Home() {
  const {
    workouts,
    folders,
  } = useWorkouts();
  return (
    <SidebarProvider>
      <Sidebar side="left" collapsible="offcanvas">
        <SidebarContent className="p-0">
          <SidebarHeader className="p-4 border-b">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Settings className="w-6 h-6" />
              </Button>
            </div>
          </SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="My Workouts" isActive>My Workouts</SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton tooltip="Progress">Progress</SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <MainContent />
      </SidebarInset>
    </SidebarProvider>
  )
}
