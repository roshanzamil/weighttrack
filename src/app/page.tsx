
"use client";

import { useState } from "react";
import { useWorkouts } from "@/hooks/use-workouts";
import { WorkoutLogger } from "@/components/workout-logger";
import { ProgressTracker } from "@/components/progress-tracker";
import { Settings, Plus, Sparkles, Library, BookOpen, ChevronRight, ChevronDown, Dumbbell, Timer, Calendar } from "lucide-react";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { type NewWorkoutSet } from "@/lib/types";
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


function MainContent() {
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
  const { isMobile, setOpenMobile, openMobile } = useSidebar();


  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDescription, setNewFolderDescription] = useState("");
  const [newExerciseName, setNewExerciseName] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedExerciseForLogging, setSelectedExerciseForLogging] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'workouts' | 'exercises' | 'folder'>('workouts');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  const exercises = getAllExercises();

  const handleAddFolder = () => {
    if (newFolderName.trim()) {
        addFolder(newFolderName.trim(), newFolderDescription.trim());
        setNewFolderName("");
        setNewFolderDescription("");
        toast({ title: "Folder created!" });
    }
  }

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
             <button className="w-full text-left p-2 rounded-md hover:bg-accent flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Library className="w-5 h-5"/>
                    <span>My Exercises</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <span>{exercises.length}</span>
                    <ChevronRight className="w-5 h-5"/>
                </div>
            </button>
            {folders.map(folder => (
                 <button key={folder.id} className="w-full text-left p-2 rounded-md hover:bg-accent flex items-center justify-between">
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
