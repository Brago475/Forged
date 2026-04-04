namespace ForgedApi.DTOs;

// Auth
public record RegisterRequest(string Email, string Username, string Password, string? DisplayName);
public record LoginRequest(string Email, string Password);
public record AuthResponse(string Token, UserDto User);

// User
public record UserDto(Guid Id, string Email, string Username, string? DisplayName,
    decimal? HeightInches, decimal? StartingWeight, decimal? GoalWeight);
public record UpdateProfileRequest(string? DisplayName, decimal? HeightInches,
    decimal? StartingWeight, decimal? GoalWeight);

// Weight
public record WeightEntryDto(Guid Id, decimal Weight, DateOnly Date, string? Notes);
public record CreateWeightRequest(decimal Weight, DateOnly Date, string? Notes);

// Workouts
public record WorkoutLogDto(Guid Id, DateOnly Date, string? PlanType, string? DayName,
    int? DurationMinutes, string? Notes, bool Completed, List<ExerciseLogDto> Exercises);
public record CreateWorkoutRequest(DateOnly Date, string? PlanType, string? DayName,
    int? DurationMinutes, string? Notes);
public record ExerciseLogDto(Guid Id, string ExerciseName, int? SetsCompleted,
    string? RepsCompleted, decimal? WeightUsed, bool Completed, string? Notes);
public record LogExerciseRequest(string ExerciseName, int? SetsCompleted,
    string? RepsCompleted, decimal? WeightUsed, bool Completed, string? Notes);

// Home Workout
public record HomeWorkoutDto(Guid Id, DateOnly Date, int ExercisesCompleted, int TotalExercises);
public record CreateHomeWorkoutRequest(DateOnly Date, int ExercisesCompleted, int TotalExercises);

// Journal
public record JournalEntryDto(Guid Id, DateOnly Date, string Content, string? Mood);
public record CreateJournalRequest(DateOnly Date, string Content, string? Mood);

// Food
public record FoodDto(Guid Id, string Name, string? Brand, decimal? ServingSize,
    string? ServingUnit, decimal? Calories, decimal? Protein, decimal? Carbs,
    decimal? Fat, decimal? Fiber, decimal? Sugar, decimal? Sodium);
public record CreateFoodRequest(string Name, string? Brand, decimal? ServingSize,
    string? ServingUnit, decimal? Calories, decimal? Protein, decimal? Carbs,
    decimal? Fat, decimal? Fiber, decimal? Sugar, decimal? Sodium);
public record FoodLogDto(Guid Id, DateOnly Date, string MealType, decimal Servings,
    decimal? FoodWeightGrams, FoodDto Food);
public record CreateFoodLogRequest(Guid FoodId, DateOnly Date, string MealType,
    decimal Servings, decimal? FoodWeightGrams);

// Food Summary (monthly calendar)
public record FoodDaySummaryDto(DateOnly Date, decimal TotalCalories, List<string> Meals);

// Fasting
public record FastingLogDto(Guid Id, DateTime StartTime, DateTime? EndTime,
    int TargetHours, bool Completed, string? Notes);
public record StartFastRequest(int TargetHours, string? Notes);
public record EndFastRequest(string? Notes);

// Goals
public record GoalDto(Guid Id, string GoalType, decimal? TargetValue,
    string? TargetUnit, DateOnly? Deadline, string Status);
public record CreateGoalRequest(string GoalType, decimal? TargetValue,
    string? TargetUnit, DateOnly? Deadline);

// Dashboard
public record DashboardStats(decimal CurrentWeight, decimal WeightLost,
    int TotalWorkouts, int CurrentStreak, List<WeightEntryDto> RecentWeights);