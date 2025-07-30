
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { type WorkoutSet, type NewWorkoutSet, type Folder, type Exercise } from '@/lib/types';

const WORKOUTS_STORAGE_KEY = 'overload-pro-workouts';
const FOLDERS_STORAGE_KEY = 'overload-pro-folders';

export function useWorkouts() {
  const [workouts, setWorkouts] = useState<WorkoutSet[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedWorkouts = localStorage.getItem(WORKOUTS_STORAGE_KEY);
      if (storedWorkouts) {
        setWorkouts(JSON.parse(storedWorkouts));
      }
      const storedFolders = localStorage.getItem(FOLDERS_STORAGE_KEY);
       if (storedFolders) {
        setFolders(JSON.parse(storedFolders));
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(WORKOUTS_STORAGE_KEY, JSON.stringify(workouts));
        localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(folders));
      } catch (error) {
        console.error("Failed to save data to localStorage", error);
      }
    }
  }, [workouts, folders, isLoaded]);

  const addWorkout = useCallback((newWorkout: NewWorkoutSet) => {
    const workoutWithMetadata: WorkoutSet = {
      ...newWorkout,
      id: new Date().toISOString() + Math.random(),
      date: new Date().toISOString(),
      notes: newWorkout.notes || ''
    };
    setWorkouts(prevWorkouts => [workoutWithMetadata, ...prevWorkouts]);
  }, []);

  const updateWorkoutSet = useCallback((updatedSet: WorkoutSet) => {
    setWorkouts(prev => prev.map(w => w.id === updatedSet.id ? updatedSet : w));
  }, []);

  const deleteWorkoutSet = useCallback((workoutId: string) => {
    setWorkouts(prev => prev.filter(w => w.id !== workoutId));
  }, []);

  const addFolder = useCallback((name: string, description: string) => {
    const newFolder: Folder = {
      id: new Date().toISOString() + Math.random(),
      name,
      description,
      exercises: [],
    };
    setFolders(prev => [...prev, newFolder]);
  }, []);

  const deleteFolder = useCallback((folderId: string) => {
    setFolders(prev => prev.filter(f => f.id !== folderId));
  }, []);

  const addExerciseToFolder = useCallback((folderId: string, exerciseName: string) => {
    const newExercise: Exercise = {
      id: new Date().toISOString() + Math.random(),
      name: exerciseName,
    };
    setFolders(prev => prev.map(folder => {
      if (folder.id === folderId) {
        // Prevent adding duplicate exercise names within the same folder
        if (folder.exercises.some(ex => ex.name.toLowerCase() === exerciseName.toLowerCase())) {
            return folder;
        }
        return { ...folder, exercises: [...folder.exercises, newExercise] };
      }
      return folder;
    }));
  }, []);
  
  const deleteExerciseFromFolder = useCallback((folderId: string, exerciseId: string) => {
    setFolders(prev => prev.map(folder => {
      if (folder.id === folderId) {
        // also delete workouts associated with this exercise
        setWorkouts(w => w.filter(workout => workout.exerciseId !== exerciseId));
        return { ...folder, exercises: folder.exercises.filter(ex => ex.id !== exerciseId) };
      }
      return folder;
    }));
  }, []);


  const getAllExercises = useCallback(() => {
    const allExercises = folders.flatMap(f => f.exercises);
    const uniqueExercises = allExercises.filter((exercise, index, self) =>
        index === self.findIndex((t) => (
            t.id === exercise.id
        ))
    );
    return uniqueExercises;
  }, [folders]);

  const getHistoryForExercise = useCallback((exerciseId: string) => {
    return workouts
      .filter(w => w.exerciseId === exerciseId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [workouts]);

  const getPersonalBest = useCallback((exerciseId: string) => {
    const exerciseHistory = getHistoryForExercise(exerciseId);
    if (exerciseHistory.length === 0) return null;
    return exerciseHistory.reduce((pb, current) => current.weight > pb.weight ? current : pb);
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
