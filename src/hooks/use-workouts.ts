
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { type WorkoutSet, type NewWorkoutSet, type Folder, type Exercise } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from './use-toast';
import type { User } from '@supabase/supabase-js';

export function useWorkouts(user: User | null) {
  const [workouts, setWorkouts] = useState<WorkoutSet[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFoldersAndExercises = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: foldersData, error: foldersError } = await supabase
      .from('folders')
      .select(`
        *,
        exercises (*)
      `)
      .eq('user_id', user.id);

    if (foldersError) {
      toast({ title: "Error fetching folders", description: foldersError.message, variant: "destructive" });
    } else {
      setFolders(foldersData || []);
    }
  }, [toast, user]);

  const fetchWorkouts = useCallback(async () => {
     if (!user) return;
    const { data, error } = await supabase
      .from('workout_sets')
      .select('*, exercises(name)')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      toast({ title: "Error fetching workouts", description: error.message, variant: "destructive" });
    } else {
      const formattedWorkouts = data.map(w => ({
        ...w,
        exerciseName: (w.exercises as any)?.name || 'Unknown Exercise',
      }));
      setWorkouts(formattedWorkouts || []);
    }
  }, [toast, user]);


  useEffect(() => {
    if (user) {
        fetchFoldersAndExercises();
        fetchWorkouts();
    }
    setLoading(false);
  }, [fetchFoldersAndExercises, fetchWorkouts, user]);


  const addWorkout = useCallback(async (newWorkout: NewWorkoutSet) => {
    if (!user) return;

    const { exerciseName, ...restOfWorkout } = newWorkout;

    const workoutToInsert = {
      ...restOfWorkout,
      date: new Date().toISOString(),
      notes: newWorkout.notes || '',
      user_id: user.id
    }
    const { data, error } = await supabase
      .from('workout_sets')
      .insert(workoutToInsert)
      .select('*, exercises(name)')
      .single();

    if (error) {
      toast({ title: "Error adding workout", description: error.message, variant: "destructive" });
    } else if (data) {
       const formattedWorkout = {
         ...data,
         exerciseName: (data.exercises as any)?.name || 'Unknown Exercise',
       };
      setWorkouts(prev => [formattedWorkout, ...prev]);
    }
  }, [toast, user]);


  const updateWorkoutSet = useCallback(async (updatedSet: WorkoutSet) => {
    const { user_id, exerciseName, ...restOfSet } = updatedSet;
    const { data, error } = await supabase
      .from('workout_sets')
      .update(restOfSet)
      .eq('id', restOfSet.id)
      .select('*, exercises(name)')
      .single();
    
    if (error) {
        toast({ title: "Error updating set", description: error.message, variant: "destructive" });
    } else if (data) {
        const formattedWorkout = {
          ...data,
          exerciseName: (data.exercises as any)?.name || 'Unknown Exercise',
        };
        setWorkouts(prev => prev.map(w => w.id === formattedWorkout.id ? formattedWorkout : w));
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
    if (!user) return;
    const { data, error } = await supabase
        .from('folders')
        .insert({ name, description, user_id: user.id })
        .select()
        .single();
    
    if (error) {
        toast({ title: "Error creating folder", description: error.message, variant: "destructive" });
    } else if (data) {
        setFolders(prev => [...prev, { ...data, exercises: []}]);
    }
  }, [toast, user]);

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
    if (!user) return;
    const { data, error } = await supabase
        .from('exercises')
        .insert({ folder_id: folderId, name: exerciseName, user_id: user.id })
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
  }, [toast, user]);
  
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
        setWorkouts(prev => prev.filter(w => w.exercise_id !== exerciseId));
    }
  }, [toast]);


  const getAllExercises = useCallback(() => {
    const allExercises = folders.flatMap(f => f.exercises);
    return allExercises;
  }, [folders]);

  const getHistoryForExercise = useCallback((exerciseId: string) => {
    return workouts
      .filter(w => w.exercise_id === exerciseId)
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
    loading,
  }), [workouts, addWorkout, updateWorkoutSet, deleteWorkoutSet, getAllExercises, getHistoryForExercise, getPersonalBest, getLatestWorkout, folders, addFolder, deleteFolder, addExerciseToFolder, deleteExerciseFromFolder, loading]);
}
