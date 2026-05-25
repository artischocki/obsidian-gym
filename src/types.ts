export type FileType = "plan" | "session" | "exercise" | "workout";

export interface Exercise {
  /** Resolved by file basename, e.g. "Bench Press" */
  name: string;
  path: string;
  muscleGroups: string[];
  /** Default rep range, can be overridden per session */
  repRange: [number, number];
  /** Default set count */
  defaultSets: number;
  /** Default rest in seconds */
  restSeconds: number;
  notes: string;
}

export interface SessionExerciseRef {
  /** Name (basename) of exercise file */
  exercise: string;
  /** Optional override of sets */
  sets?: number;
  /** Optional override of rep range */
  repRange?: [number, number];
  /** Optional override of rest */
  restSeconds?: number;
}

export interface Session {
  name: string;
  path: string;
  exercises: SessionExerciseRef[];
  notes: string;
}

export interface Plan {
  name: string;
  path: string;
  /** Ordered list of session names */
  sessions: string[];
  active: boolean;
  notes: string;
}

export interface WorkoutSet {
  exercise: string;
  set: number;
  weight: number;
  reps: number;
  completed: boolean;
  /** Set as PR at time of logging */
  pr?: boolean;
}

export interface Workout {
  path: string;
  date: string; // ISO YYYY-MM-DD
  plan: string;
  session: string;
  sets: WorkoutSet[];
  durationSeconds?: number;
  notes: string;
}

export interface GymData {
  plans: Plan[];
  sessions: Session[];
  exercises: Exercise[];
  workouts: Workout[];
}

export interface GymSettings {
  /** Folder for plans */
  plansFolder: string;
  /** Folder for sessions */
  sessionsFolder: string;
  /** Folder for exercises */
  exercisesFolder: string;
  /** Folder for workout logs */
  workoutsFolder: string;
  /** Default rest in seconds for new exercises */
  defaultRestSeconds: number;
  /** Default sets for new exercises */
  defaultSets: number;
  /** Default rep range for new exercises */
  defaultRepRange: [number, number];
  /** Unit shown next to weight inputs */
  weightUnit: "kg" | "lbs";
}

export const DEFAULT_SETTINGS: GymSettings = {
  plansFolder: "Gym/Plans",
  sessionsFolder: "Gym/Sessions",
  exercisesFolder: "Gym/Exercises",
  workoutsFolder: "Gym/Workouts",
  defaultRestSeconds: 120,
  defaultSets: 3,
  defaultRepRange: [8, 12],
  weightUnit: "kg",
};

export const WORKOUT_VIEW_TYPE = "gym-workout-view";
export const PROGRESS_VIEW_TYPE = "gym-progress-view";
