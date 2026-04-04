using Microsoft.EntityFrameworkCore;
using ForgedApi.Data;
using ForgedApi.DTOs;
using ForgedApi.Models;

namespace ForgedApi.Services;

public class WorkoutService
{
    private readonly ForgedDbContext _db;

    public WorkoutService(ForgedDbContext db) => _db = db;

    // ── Gym Workouts ──
    public async Task<List<WorkoutLogDto>> GetLogs(Guid userId, int limit = 30)
    {
        return await _db.WorkoutLogs
            .Where(w => w.UserId == userId)
            .OrderByDescending(w => w.Date)
            .Take(limit)
            .Include(w => w.ExerciseLogs)
            .Select(w => new WorkoutLogDto(
                w.Id, w.Date, w.PlanType, w.DayName, w.DurationMinutes,
                w.Notes, w.Completed,
                w.ExerciseLogs.Select(e => new ExerciseLogDto(
                    e.Id, e.ExerciseName, e.SetsCompleted, e.RepsCompleted,
                    e.WeightUsed, e.Completed, e.Notes
                )).ToList()
            )).ToListAsync();
    }

    public async Task<WorkoutLogDto?> CreateLog(Guid userId, CreateWorkoutRequest request)
    {
        var log = new WorkoutLog
        {
            UserId = userId,
            Date = request.Date,
            PlanType = request.PlanType,
            DayName = request.DayName,
            DurationMinutes = request.DurationMinutes,
            Notes = request.Notes
        };

        _db.WorkoutLogs.Add(log);
        await _db.SaveChangesAsync();
        return new WorkoutLogDto(log.Id, log.Date, log.PlanType, log.DayName,
            log.DurationMinutes, log.Notes, log.Completed, new());
    }

    public async Task<WorkoutLogDto?> CompleteWorkout(Guid userId, Guid workoutId)
    {
        var log = await _db.WorkoutLogs
            .Include(w => w.ExerciseLogs)
            .FirstOrDefaultAsync(w => w.Id == workoutId && w.UserId == userId);
        if (log == null) return null;

        log.Completed = true;
        await _db.SaveChangesAsync();

        return new WorkoutLogDto(log.Id, log.Date, log.PlanType, log.DayName,
            log.DurationMinutes, log.Notes, log.Completed,
            log.ExerciseLogs.Select(e => new ExerciseLogDto(
                e.Id, e.ExerciseName, e.SetsCompleted, e.RepsCompleted,
                e.WeightUsed, e.Completed, e.Notes
            )).ToList());
    }

    public async Task<ExerciseLogDto?> LogExercise(Guid userId, Guid workoutId, LogExerciseRequest request)
    {
        var workout = await _db.WorkoutLogs
            .FirstOrDefaultAsync(w => w.Id == workoutId && w.UserId == userId);
        if (workout == null) return null;

        var log = new ExerciseLog
        {
            WorkoutLogId = workoutId,
            ExerciseName = request.ExerciseName,
            SetsCompleted = request.SetsCompleted,
            RepsCompleted = request.RepsCompleted,
            WeightUsed = request.WeightUsed,
            Completed = request.Completed,
            Notes = request.Notes
        };

        _db.ExerciseLogs.Add(log);
        await _db.SaveChangesAsync();
        return new ExerciseLogDto(log.Id, log.ExerciseName, log.SetsCompleted,
            log.RepsCompleted, log.WeightUsed, log.Completed, log.Notes);
    }

    // ── Home Workouts ──
    public async Task<HomeWorkoutDto?> LogHomeWorkout(Guid userId, CreateHomeWorkoutRequest request)
    {
        var existing = await _db.HomeWorkoutLogs
            .FirstOrDefaultAsync(h => h.UserId == userId && h.Date == request.Date);

        if (existing != null)
        {
            existing.ExercisesCompleted = request.ExercisesCompleted;
        }
        else
        {
            existing = new HomeWorkoutLog
            {
                UserId = userId,
                Date = request.Date,
                ExercisesCompleted = request.ExercisesCompleted,
                TotalExercises = request.TotalExercises
            };
            _db.HomeWorkoutLogs.Add(existing);
        }

        await _db.SaveChangesAsync();
        return new HomeWorkoutDto(existing.Id, existing.Date,
            existing.ExercisesCompleted, existing.TotalExercises);
    }

    // ── Journal ──
    public async Task<JournalEntryDto?> AddJournal(Guid userId, CreateJournalRequest request)
    {
        var entry = new JournalEntry
        {
            UserId = userId,
            Date = request.Date,
            Content = request.Content,
            Mood = request.Mood
        };

        _db.JournalEntries.Add(entry);
        await _db.SaveChangesAsync();
        return new JournalEntryDto(entry.Id, entry.Date, entry.Content, entry.Mood);
    }

    public async Task<List<JournalEntryDto>> GetJournal(Guid userId, int limit = 30)
    {
        return await _db.JournalEntries
            .Where(j => j.UserId == userId)
            .OrderByDescending(j => j.Date)
            .Take(limit)
            .Select(j => new JournalEntryDto(j.Id, j.Date, j.Content, j.Mood))
            .ToListAsync();
    }

    // ── Food ──
    public async Task<FoodDto?> CreateFood(Guid userId, CreateFoodRequest request)
    {
        var food = new Food
        {
            UserId = userId,
            Name = request.Name,
            Brand = request.Brand,
            ServingSize = request.ServingSize,
            ServingUnit = request.ServingUnit,
            Calories = request.Calories,
            Protein = request.Protein,
            Carbs = request.Carbs,
            Fat = request.Fat,
            Fiber = request.Fiber,
            Sugar = request.Sugar,
            Sodium = request.Sodium
        };

        _db.Foods.Add(food);
        await _db.SaveChangesAsync();
        return ToFoodDto(food);
    }

    public async Task<List<FoodDto>> SearchFoods(Guid userId, string query)
    {
        return await _db.Foods
            .Where(f => f.UserId == null || f.UserId == userId)
            .Where(f => f.Name.ToLower().Contains(query.ToLower()))
            .Take(20)
            .Select(f => new FoodDto(f.Id, f.Name, f.Brand, f.ServingSize,
                f.ServingUnit, f.Calories, f.Protein, f.Carbs, f.Fat,
                f.Fiber, f.Sugar, f.Sodium))
            .ToListAsync();
    }

    public async Task<FoodLogDto?> LogFood(Guid userId, CreateFoodLogRequest request)
    {
        var food = await _db.Foods.FindAsync(request.FoodId);
        if (food == null) return null;

        var log = new FoodLog
        {
            UserId = userId,
            FoodId = request.FoodId,
            Date = request.Date,
            MealType = request.MealType,
            Servings = request.Servings,
            FoodWeightGrams = request.FoodWeightGrams
        };

        _db.FoodLogs.Add(log);
        await _db.SaveChangesAsync();
        return new FoodLogDto(log.Id, log.Date, log.MealType, log.Servings,
            log.FoodWeightGrams, ToFoodDto(food));
    }

    public async Task<List<FoodLogDto>> GetFoodLogs(Guid userId, DateOnly date)
    {
        return await _db.FoodLogs
            .Where(f => f.UserId == userId && f.Date == date)
            .Include(f => f.Food)
            .Select(f => new FoodLogDto(f.Id, f.Date, f.MealType, f.Servings,
                f.FoodWeightGrams, new FoodDto(f.Food!.Id, f.Food.Name, f.Food.Brand,
                    f.Food.ServingSize, f.Food.ServingUnit, f.Food.Calories, f.Food.Protein,
                    f.Food.Carbs, f.Food.Fat, f.Food.Fiber, f.Food.Sugar, f.Food.Sodium)))
            .ToListAsync();
    }

    public async Task<bool> DeleteFoodLog(Guid userId, Guid logId)
    {
        var log = await _db.FoodLogs
            .FirstOrDefaultAsync(f => f.Id == logId && f.UserId == userId);
        if (log == null) return false;
        _db.FoodLogs.Remove(log);
        await _db.SaveChangesAsync();
        return true;
    }

    // ── Food Summary (monthly calendar) ──
    public async Task<List<FoodDaySummaryDto>> GetFoodSummary(Guid userId, int year, int month)
    {
        var startDate = new DateOnly(year, month, 1);
        var endDate = startDate.AddMonths(1).AddDays(-1);

        var logs = await _db.FoodLogs
            .Where(f => f.UserId == userId && f.Date >= startDate && f.Date <= endDate)
            .Include(f => f.Food)
            .ToListAsync();

        return logs
            .GroupBy(f => f.Date)
            .Select(g => new FoodDaySummaryDto(
                g.Key,
                g.Sum(f => (f.Food?.Calories ?? 0) * f.Servings),
                g.Select(f => f.MealType).Distinct().ToList()
            ))
            .OrderBy(d => d.Date)
            .ToList();
    }

    // ── Fasting ──
    public async Task<FastingLogDto?> StartFast(Guid userId, StartFastRequest request)
    {
        var log = new FastingLog
        {
            UserId = userId,
            StartTime = DateTime.UtcNow,
            TargetHours = request.TargetHours,
            Notes = request.Notes
        };

        _db.FastingLogs.Add(log);
        await _db.SaveChangesAsync();
        return new FastingLogDto(log.Id, log.StartTime, log.EndTime,
            log.TargetHours, log.Completed, log.Notes);
    }

    public async Task<FastingLogDto?> EndFast(Guid userId, Guid fastId, EndFastRequest request)
    {
        var log = await _db.FastingLogs
            .FirstOrDefaultAsync(f => f.Id == fastId && f.UserId == userId);
        if (log == null) return null;

        log.EndTime = DateTime.UtcNow;
        log.Completed = true;
        log.Notes = request.Notes ?? log.Notes;
        await _db.SaveChangesAsync();

        return new FastingLogDto(log.Id, log.StartTime, log.EndTime,
            log.TargetHours, log.Completed, log.Notes);
    }

    public async Task<FastingLogDto?> GetActiveFast(Guid userId)
    {
        var log = await _db.FastingLogs
            .Where(f => f.UserId == userId && !f.Completed)
            .OrderByDescending(f => f.StartTime)
            .FirstOrDefaultAsync();
        if (log == null) return null;

        return new FastingLogDto(log.Id, log.StartTime, log.EndTime,
            log.TargetHours, log.Completed, log.Notes);
    }

    // ── Goals ──
    public async Task<GoalDto?> CreateGoal(Guid userId, CreateGoalRequest request)
    {
        var goal = new Goal
        {
            UserId = userId,
            GoalType = request.GoalType,
            TargetValue = request.TargetValue,
            TargetUnit = request.TargetUnit,
            Deadline = request.Deadline
        };

        _db.Goals.Add(goal);
        await _db.SaveChangesAsync();
        return new GoalDto(goal.Id, goal.GoalType, goal.TargetValue,
            goal.TargetUnit, goal.Deadline, goal.Status);
    }

    public async Task<List<GoalDto>> GetGoals(Guid userId)
    {
        return await _db.Goals
            .Where(g => g.UserId == userId && g.Status == "active")
            .Select(g => new GoalDto(g.Id, g.GoalType, g.TargetValue,
                g.TargetUnit, g.Deadline, g.Status))
            .ToListAsync();
    }

    // ── Dashboard ──
    public async Task<DashboardStats> GetDashboard(Guid userId)
    {
        var weights = await _db.WeightEntries
            .Where(w => w.UserId == userId)
            .OrderBy(w => w.Date)
            .Select(w => new WeightEntryDto(w.Id, w.Weight, w.Date, w.Notes))
            .ToListAsync();

        var totalWorkouts = await _db.WorkoutLogs
            .CountAsync(w => w.UserId == userId && w.Completed);

        var currentWeight = weights.LastOrDefault()?.Weight ?? 0;
        var startWeight = weights.FirstOrDefault()?.Weight ?? 0;

        // Streak calculation
        var streak = 0;
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var dates = await _db.WorkoutLogs
            .Where(w => w.UserId == userId && w.Completed)
            .Select(w => w.Date)
            .Distinct()
            .OrderByDescending(d => d)
            .ToListAsync();

        foreach (var date in dates)
        {
            if (date >= today.AddDays(-streak - 1))
                streak++;
            else
                break;
        }

        return new DashboardStats(currentWeight, startWeight - currentWeight,
            totalWorkouts, streak, weights.TakeLast(30).ToList());
    }

    private static FoodDto ToFoodDto(Food f) => new(
        f.Id, f.Name, f.Brand, f.ServingSize, f.ServingUnit,
        f.Calories, f.Protein, f.Carbs, f.Fat, f.Fiber, f.Sugar, f.Sodium);
}