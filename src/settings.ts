export interface WorkoutPlan {
  id: string;
  name: string;
}

export interface GymPluginSettings {
  exercisesFolder: string;
  openAfterCreate: boolean;
  addFrontmatter: boolean;

  workoutPlans: WorkoutPlan[];
  activeWorkoutPlanId: string | null;
}

export const DEFAULT_SETTINGS: GymPluginSettings = {
  exercisesFolder: "Exercises",
  openAfterCreate: true,
  addFrontmatter: true,

  workoutPlans: [],
  activeWorkoutPlanId: null,
};
