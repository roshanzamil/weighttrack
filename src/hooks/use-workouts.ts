
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
    };
    setWorkouts(prevWorkouts => [workoutWithMetadata, ...prevWorkouts]);
  }, []);

  const addFolder = useCallback((name: string) => {
    const newFolder: Folder = {
      id: new Date().toISOString() + Math.random(),
      name,
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

  const getAllExercises = useCallback(() => {
    const exerciseNames = new Set(workouts.map(w => w.exerciseName));
    return Array.from(exerciseNames);
  }, [workouts]);

  const getHistoryForExercise = useCallback((exerciseName: string) => {
    return workouts
      .filter(w => w.exerciseName === exerciseName)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [workouts]);

  const getPersonalBest = useCallback((exerciseName: string) => {
    const exerciseHistory = getHistoryForExercise(exerciseName);
    if (exerciseHistory.length === 0) return null;
    return exerciseHistory.reduce((pb, current) => current.weight > pb.weight ? current : pb);
  }, [getHistoryForExercise]);

  const getLatestWorkout = useCallback((exerciseName: string) => {
    const exerciseHistory = getHistoryForExercise(exerciseName);
    return exerciseHistory.length > 0 ? exerciseHistory[exerciseHistory.length - 1] : null;
  }, [getHistoryForExercise]);
  
  return useMemo(() => ({
    workouts,
    addWorkout,
    getAllExercises,
    getHistoryForExercise,
    getPersonalBest,
    getLatestWorkout,
    folders,
    addFolder,
    deleteFolder,
    addExerciseToFolder,
  }), [workouts, addWorkout, getAllExercises, getHistoryForExercise, getPersonalBest, getLatestWorkout, folders, addFolder, deleteFolder, addExerciseToFolder]);
}
