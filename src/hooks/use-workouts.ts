
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { type WorkoutSet, type NewWorkoutSet, type Folder, type Exercise } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from './use-toast';

export function useWorkouts() {
  const [workouts, setWorkouts] = useState<WorkoutSet[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFoldersAndExercises = useCallback(async () => {
    setLoading(true);
    const { data: foldersData, error: foldersError } = await supabase
      .from('folders')
      .select(`
        *,
        exercises (*)
      `);

    if (foldersError) {
      toast({ title: "Error fetching folders", description: foldersError.message, variant: "destructive" });
    } else {
      setFolders(foldersData || []);
    }
  }, [toast]);

  const fetchWorkouts = useCallback(async () => {
    const { data, error } = await supabase.from('workout_sets').select('*').order('date', { ascending: false });
    if (error) {
      toast({ title: "Error fetching workouts", description: error.message, variant: "destructive" });
    } else {
      setWorkouts(data || []);
    }
  }, [toast]);


  useEffect(() => {
    fetchFoldersAndExercises();
    fetchWorkouts();
    setLoading(false);
  }, [fetchFoldersAndExercises, fetchWorkouts]);


  const addWorkout = useCallback(async (newWorkout: NewWorkoutSet) => {
    const workoutWithDate = {
      ...newWorkout,
      date: new Date().toISOString(),
      notes: newWorkout.notes || ''
    }
    const { data, error } = await supabase
      .from('workout_sets')
      .insert(workoutWithDate)
      .select()
      .single();

    if (error) {
      toast({ title: "Error adding workout", description: error.message, variant: "destructive" });
    } else if (data) {
      setWorkouts(prev => [data, ...prev]);
    }
  }, [toast]);


  const updateWorkoutSet = useCallback(async (updatedSet: WorkoutSet) => {
    const { data, error } = await supabase
      .from('workout_sets')
      .update(updatedSet)
      .eq('id', updatedSet.id)
      .select()
      .single();
    
    if (error) {
        toast({ title: "Error updating set", description: error.message, variant: "destructive" });
    } else if (data) {
        setWorkouts(prev => prev.map(w => w.id === data.id ? data : w));
    }
  }, [toast]);

  const deleteWorkoutSet = useCallback(async (workoutId: string) => {
     const { error } = await supabase.from('workout_sets').delete().eq('id', workoutId);
     if (error) {
        toast({ title: "Error deleting set", description: error.message, variant: "destructive" });
     } else {
        setWorkouts(prev => prev.filter(w => w.id !== workoutId));
     }
  }, [toast]);

  const addFolder = useCallback(async (name: string, description: string) => {
    const { data, error } = await supabase
        .from('folders')
        .insert({ name, description })
        .select()
        .single();
    
    if (error) {
        toast({ title: "Error creating folder", description: error.message, variant: "destructive" });
    } else if (data) {
        setFolders(prev => [...prev, { ...data, exercises: []}]);
    }
  }, [toast]);

  const deleteFolder = useCallback(async (folderId: string) => {
    // Supabase will cascade delete exercises and sets if set up correctly
    const { error } = await supabase.from('folders').delete().eq('id', folderId);
     if (error) {
        toast({ title: "Error deleting folder", description: error.message, variant: "destructive" });
     } else {
        setFolders(prev => prev.filter(f => f.id !== folderId));
     }
  }, [toast]);

  const addExerciseToFolder = useCallback(async (folderId: string, exerciseName: string) => {
    const { data, error } = await supabase
        .from('exercises')
        .insert({ folder_id: folderId, name: exerciseName })
        .select()
        .single();

    if (error) {
        toast({ title: "Error adding exercise", description: error.message, variant: "destructive" });
    } else if(data) {
        setFolders(prev => prev.map(folder => {
            if (folder.id === folderId) {
                return { ...folder, exercises: [...folder.exercises, data] };
            }
            return folder;
        }));
    }
  }, [toast]);
  
  const deleteExerciseFromFolder = useCallback(async (folderId: string, exerciseId: string) => {
    const { error } = await supabase.from('exercises').delete().eq('id', exerciseId);
    if (error) {
        toast({ title: "Error deleting exercise", description: error.message, variant: "destructive" });
    } else {
        setFolders(prev => prev.map(folder => {
            if (folder.id === folderId) {
                return { ...folder, exercises: folder.exercises.filter(ex => ex.id !== exerciseId) };
            }
            return folder;
        }));
        // also delete orphaned workouts
        setWorkouts(prev => prev.filter(w => w.exerciseId !== exerciseId));
    }
  }, [toast]);


  const getAllExercises = useCallback(() => {
    const allExercises = folders.flatMap(f => f.exercises);
    return allExercises;
  }, [folders]);

  const getHistoryForExercise = useCallback((exerciseId: string) => {
    return workouts
      .filter(w => w.exerciseId === exerciseId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [workouts]);

  const getPersonalBest = useCallback((exerciseId: string) => {
    const exerciseHistory = getHistoryForExercise(exerciseId);
    if (exerciseHistory.length === 0) return null;
    return exerciseHistory.reduce((pb, current) => current.weight > pb.weight ? current : pb, exerciseHistory[0]);
  }, [getHistoryForExercise]);

  const getLatestWorkout = useCallback((exerciseId: string) => {
    const exerciseHistory = getHistoryForExercise(exerciseId);
    return exerciseHistory.length > 0 ? exerciseHistory[0] : null;
  }, [getHistoryForExercise]);
  
  return useMemo(() => ({
    workouts,
    addWorkout,
    updateWorkoutSet,
    deleteWorkoutSet,
    getAllExercises,
    getHistoryForExercise,
    getPersonalBest,
    getLatestWorkout,
    folders,
    addFolder,
    deleteFolder,
    addExerciseToFolder,
    deleteExerciseFromFolder,
  }), [workouts, addWorkout, updateWorkoutSet, deleteWorkoutSet, getAllExercises, getHistoryForExercise, getPersonalBest, getLatestWorkout, folders, addFolder, deleteFolder, addExerciseToFolder, deleteExerciseFromFolder]);
}
