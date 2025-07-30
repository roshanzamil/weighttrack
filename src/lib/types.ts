
export interface WorkoutSet {
  id: string;
  user_id: string;
  exercise_id: string; // Corresponds to Supabase schema
  exerciseName: string; // Kept for display purposes
  weight: number;
  reps: number;
  date: string; // ISO string
  notes?: string;
  exerciseId?: string; // Keep for compatibility, will be mapped
}

export type NewWorkoutSet = Omit<WorkoutSet, 'id' | 'date' | 'user_id'>;


export interface Exercise {
    id: string;
    name: string;
    folder_id: string; // Corresponds to Supabase schema
    user_id: string;
}

export interface Folder {
    id: string;
    name: string;
    description: string;
    user_id: string;
    exercises: Exercise[];
}
