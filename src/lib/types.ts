export interface WorkoutSet {
  id: string;
  exerciseName: string;
  weight: number;
  reps: number;
  date: string; // ISO string
}

export type NewWorkoutSet = Omit<WorkoutSet, 'id' | 'date'>;
