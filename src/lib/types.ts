
export interface WorkoutSet {
  id: string;
  exerciseId: string; // Added to link set to a specific exercise
  exerciseName: string;
  weight: number;
  reps: number;
  date: string; // ISO string
}

export type NewWorkoutSet = Omit<WorkoutSet, 'id' | 'date'>;

export interface Exercise {
    id: string;
    name: string;
}

export interface Folder {
    id: string;
    name: string;
    description: string;
    exercises: Exercise[];
}
