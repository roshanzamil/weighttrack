export interface WorkoutSet {
  id: string;
  user_id: string;
  exercise_id: string; 
  exerciseName: string; 
  weight: number;
  reps: number;
  date: string; // ISO string
  notes?: string;
}

export type NewWorkoutSet = Omit<WorkoutSet, 'id' | 'date' | 'user_id'>;


export interface Exercise {
    id: string;
    name: string;
    folder_id: string; 
    user_id: string;
}

export interface Folder {
    id: string;
    name: string;
    notes?: string | null;
    user_id: string;
    exercises: Exercise[];
}
