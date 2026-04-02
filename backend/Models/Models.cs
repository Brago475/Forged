using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ForgedApi.Models;

[Table("users")]
public class User
{
    [Key] [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("email")] [Required, MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    [Column("username")] [Required, MaxLength(50)]
    public string Username { get; set; } = string.Empty;

    [Column("password_hash")] [Required]
    public string PasswordHash { get; set; } = string.Empty;

    [Column("display_name")] [MaxLength(100)]
    public string? DisplayName { get; set; }

    [Column("height_inches")]
    public decimal? HeightInches { get; set; }

    [Column("starting_weight")]
    public decimal? StartingWeight { get; set; }

    [Column("goal_weight")]
    public decimal? GoalWeight { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

[Table("weight_entries")]
public class WeightEntry
{
    [Key] [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("user_id")]
    public Guid UserId { get; set; }

    [Column("weight")] [Required]
    public decimal Weight { get; set; }

    [Column("date")] [Required]
    public DateOnly Date { get; set; }

    [Column("notes")]
    public string? Notes { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey("UserId")]
    public User? User { get; set; }
}

[Table("workout_logs")]
public class WorkoutLog
{
    [Key] [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("user_id")]
    public Guid UserId { get; set; }

    [Column("date")] [Required]
    public DateOnly Date { get; set; }

    [Column("plan_type")] [MaxLength(20)]
    public string? PlanType { get; set; }

    [Column("day_name")] [MaxLength(50)]
    public string? DayName { get; set; }

    [Column("duration_minutes")]
    public int? DurationMinutes { get; set; }

    [Column("notes")]
    public string? Notes { get; set; }

    [Column("completed")]
    public bool Completed { get; set; } = false;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey("UserId")]
    public User? User { get; set; }

    public List<ExerciseLog> ExerciseLogs { get; set; } = new();
}

[Table("exercise_logs")]
public class ExerciseLog
{
    [Key] [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("workout_log_id")]
    public Guid WorkoutLogId { get; set; }

    [Column("exercise_name")] [Required, MaxLength(100)]
    public string ExerciseName { get; set; } = string.Empty;

    [Column("sets_completed")]
    public int? SetsCompleted { get; set; }

    [Column("reps_completed")] [MaxLength(50)]
    public string? RepsCompleted { get; set; }

    [Column("weight_used")]
    public decimal? WeightUsed { get; set; }

    [Column("completed")]
    public bool Completed { get; set; } = false;

    [Column("notes")]
    public string? Notes { get; set; }

    [ForeignKey("WorkoutLogId")]
    public WorkoutLog? WorkoutLog { get; set; }
}

[Table("home_workout_logs")]
public class HomeWorkoutLog
{
    [Key] [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("user_id")]
    public Guid UserId { get; set; }

    [Column("date")] [Required]
    public DateOnly Date { get; set; }

    [Column("exercises_completed")]
    public int ExercisesCompleted { get; set; } = 0;

    [Column("total_exercises")]
    public int TotalExercises { get; set; } = 8;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey("UserId")]
    public User? User { get; set; }
}

[Table("journal_entries")]
public class JournalEntry
{
    [Key] [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("user_id")]
    public Guid UserId { get; set; }

    [Column("date")] [Required]
    public DateOnly Date { get; set; }

    [Column("content")] [Required]
    public string Content { get; set; } = string.Empty;

    [Column("mood")] [MaxLength(20)]
    public string? Mood { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey("UserId")]
    public User? User { get; set; }
}

[Table("food_logs")]
public class FoodLog
{
    [Key] [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("user_id")]
    public Guid UserId { get; set; }

    [Column("food_id")]
    public Guid FoodId { get; set; }

    [Column("date")] [Required]
    public DateOnly Date { get; set; }

    [Column("meal_type")] [Required, MaxLength(20)]
    public string MealType { get; set; } = string.Empty;

    [Column("servings")]
    public decimal Servings { get; set; } = 1.0m;

    [Column("food_weight_grams")]
    public decimal? FoodWeightGrams { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey("UserId")]
    public User? User { get; set; }

    [ForeignKey("FoodId")]
    public Food? Food { get; set; }
}

[Table("foods")]
public class Food
{
    [Key] [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("user_id")]
    public Guid? UserId { get; set; }

    [Column("name")] [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Column("brand")] [MaxLength(100)]
    public string? Brand { get; set; }

    [Column("serving_size")]
    public decimal? ServingSize { get; set; }

    [Column("serving_unit")] [MaxLength(20)]
    public string? ServingUnit { get; set; }

    [Column("calories")]
    public decimal? Calories { get; set; }

    [Column("protein")]
    public decimal? Protein { get; set; }

    [Column("carbs")]
    public decimal? Carbs { get; set; }

    [Column("fat")]
    public decimal? Fat { get; set; }

    [Column("fiber")]
    public decimal? Fiber { get; set; }

    [Column("sugar")]
    public decimal? Sugar { get; set; }

    [Column("sodium")]
    public decimal? Sodium { get; set; }

    [Column("is_custom")]
    public bool IsCustom { get; set; } = true;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

[Table("fasting_logs")]
public class FastingLog
{
    [Key] [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("user_id")]
    public Guid UserId { get; set; }

    [Column("start_time")]
    public DateTime StartTime { get; set; }

    [Column("end_time")]
    public DateTime? EndTime { get; set; }

    [Column("target_hours")]
    public int TargetHours { get; set; } = 16;

    [Column("completed")]
    public bool Completed { get; set; } = false;

    [Column("notes")]
    public string? Notes { get; set; }

    [ForeignKey("UserId")]
    public User? User { get; set; }
}

[Table("goals")]
public class Goal
{
    [Key] [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("user_id")]
    public Guid UserId { get; set; }

    [Column("goal_type")] [Required, MaxLength(30)]
    public string GoalType { get; set; } = string.Empty;

    [Column("target_value")]
    public decimal? TargetValue { get; set; }

    [Column("target_unit")] [MaxLength(20)]
    public string? TargetUnit { get; set; }

    [Column("deadline")]
    public DateOnly? Deadline { get; set; }

    [Column("status")] [MaxLength(20)]
    public string Status { get; set; } = "active";

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey("UserId")]
    public User? User { get; set; }
}