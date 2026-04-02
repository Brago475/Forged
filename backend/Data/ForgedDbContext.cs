using Microsoft.EntityFrameworkCore;
using ForgedApi.Models;

namespace ForgedApi.Data;

public class ForgedDbContext : DbContext
{
    public ForgedDbContext(DbContextOptions<ForgedDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<WeightEntry> WeightEntries => Set<WeightEntry>();
    public DbSet<WorkoutLog> WorkoutLogs => Set<WorkoutLog>();
    public DbSet<ExerciseLog> ExerciseLogs => Set<ExerciseLog>();
    public DbSet<HomeWorkoutLog> HomeWorkoutLogs => Set<HomeWorkoutLog>();
    public DbSet<JournalEntry> JournalEntries => Set<JournalEntry>();
    public DbSet<Food> Foods => Set<Food>();
    public DbSet<FoodLog> FoodLogs => Set<FoodLog>();
    public DbSet<FastingLog> FastingLogs => Set<FastingLog>();
    public DbSet<Goal> Goals => Set<Goal>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();
        modelBuilder.Entity<User>().HasIndex(u => u.Username).IsUnique();
        modelBuilder.Entity<WeightEntry>().HasIndex(w => new { w.UserId, w.Date }).IsUnique();
        modelBuilder.Entity<HomeWorkoutLog>().HasIndex(h => new { h.UserId, h.Date }).IsUnique();
    }
}