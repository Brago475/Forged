using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ForgedApi.DTOs;
using ForgedApi.Services;

namespace ForgedApi.Controllers;

// Helper to get user ID from JWT token
public class BaseController : ControllerBase
{
    protected Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}

// ══════════════════════════════════
// AUTH — /api/auth
// ══════════════════════════════════
[ApiController]
[Route("api/auth")]
public class AuthController : BaseController
{
    private readonly AuthService _auth;
    public AuthController(AuthService auth) => _auth = auth;

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var result = await _auth.Register(request);
        if (result == null) return BadRequest(new { error = "Email or username already exists" });
        return Ok(result);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await _auth.Login(request);
        if (result == null) return Unauthorized(new { error = "Invalid email or password" });
        return Ok(result);
    }

    [Authorize] [HttpGet("me")]
    public async Task<IActionResult> GetProfile()
    {
        var user = await _auth.GetUser(GetUserId());
        if (user == null) return NotFound();
        return Ok(user);
    }

    [Authorize] [HttpPut("me")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var user = await _auth.UpdateProfile(GetUserId(), request);
        if (user == null) return NotFound();
        return Ok(user);
    }
}

// ══════════════════════════════════
// WEIGHT — /api/weight
// ══════════════════════════════════
[ApiController]
[Route("api/weight")]
[Authorize]
public class WeightController : BaseController
{
    private readonly WeightService _weight;
    public WeightController(WeightService weight) => _weight = weight;

    [HttpGet]
    public async Task<IActionResult> GetEntries([FromQuery] int limit = 90)
        => Ok(await _weight.GetEntries(GetUserId(), limit));

    [HttpPost]
    public async Task<IActionResult> AddEntry([FromBody] CreateWeightRequest request)
        => Ok(await _weight.AddEntry(GetUserId(), request));

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteEntry(Guid id)
    {
        var success = await _weight.DeleteEntry(GetUserId(), id);
        if (!success) return NotFound();
        return NoContent();
    }
}

// ══════════════════════════════════
// WORKOUTS — /api/workout
// ══════════════════════════════════
[ApiController]
[Route("api/workout")]
[Authorize]
public class WorkoutController : BaseController
{
    private readonly WorkoutService _workout;
    public WorkoutController(WorkoutService workout) => _workout = workout;

    [HttpGet]
    public async Task<IActionResult> GetLogs([FromQuery] int limit = 30)
        => Ok(await _workout.GetLogs(GetUserId(), limit));

    [HttpPost]
    public async Task<IActionResult> CreateLog([FromBody] CreateWorkoutRequest request)
        => Ok(await _workout.CreateLog(GetUserId(), request));

    [HttpPut("{id}/complete")]
    public async Task<IActionResult> CompleteWorkout(Guid id)
    {
        var result = await _workout.CompleteWorkout(GetUserId(), id);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost("{workoutId}/exercises")]
    public async Task<IActionResult> LogExercise(Guid workoutId, [FromBody] LogExerciseRequest request)
    {
        var result = await _workout.LogExercise(GetUserId(), workoutId, request);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost("home")]
    public async Task<IActionResult> LogHomeWorkout([FromBody] CreateHomeWorkoutRequest request)
        => Ok(await _workout.LogHomeWorkout(GetUserId(), request));

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
        => Ok(await _workout.GetDashboard(GetUserId()));
}

// ══════════════════════════════════
// JOURNAL — /api/journal
// ══════════════════════════════════
[ApiController]
[Route("api/journal")]
[Authorize]
public class JournalController : BaseController
{
    private readonly WorkoutService _workout;
    public JournalController(WorkoutService workout) => _workout = workout;

    [HttpGet]
    public async Task<IActionResult> GetEntries([FromQuery] int limit = 30)
        => Ok(await _workout.GetJournal(GetUserId(), limit));

    [HttpPost]
    public async Task<IActionResult> AddEntry([FromBody] CreateJournalRequest request)
        => Ok(await _workout.AddJournal(GetUserId(), request));
}

// ══════════════════════════════════
// FOOD — /api/food
// ══════════════════════════════════
[ApiController]
[Route("api/food")]
[Authorize]
public class FoodController : BaseController
{
    private readonly WorkoutService _svc;
    public FoodController(WorkoutService svc) => _svc = svc;

    [HttpPost]
    public async Task<IActionResult> CreateFood([FromBody] CreateFoodRequest request)
        => Ok(await _svc.CreateFood(GetUserId(), request));

    [HttpGet("search")]
    public async Task<IActionResult> SearchFoods([FromQuery] string q = "")
        => Ok(await _svc.SearchFoods(GetUserId(), q));

    [HttpPost("log")]
    public async Task<IActionResult> LogFood([FromBody] CreateFoodLogRequest request)
    {
        var result = await _svc.LogFood(GetUserId(), request);
        if (result == null) return NotFound(new { error = "Food not found" });
        return Ok(result);
    }

    [HttpGet("log/{date}")]
    public async Task<IActionResult> GetFoodLogs(DateOnly date)
        => Ok(await _svc.GetFoodLogs(GetUserId(), date));

    [HttpGet("summary")]
    public async Task<IActionResult> GetFoodSummary([FromQuery] int year, [FromQuery] int month)
        => Ok(await _svc.GetFoodSummary(GetUserId(), year, month));
}

[HttpDelete("log/{id}")]
    public async Task<IActionResult> DeleteFoodLog(Guid id)
    {
        var success = await _svc.DeleteFoodLog(GetUserId(), id);
        if (!success) return NotFound();
        return NoContent();
    }
// ══════════════════════════════════
// FASTING — /api/fasting
// ══════════════════════════════════
[ApiController]
[Route("api/fasting")]
[Authorize]
public class FastingController : BaseController
{
    private readonly WorkoutService _svc;
    public FastingController(WorkoutService svc) => _svc = svc;

    [HttpPost("start")]
    public async Task<IActionResult> StartFast([FromBody] StartFastRequest request)
        => Ok(await _svc.StartFast(GetUserId(), request));

    [HttpPut("{id}/end")]
    public async Task<IActionResult> EndFast(Guid id, [FromBody] EndFastRequest request)
    {
        var result = await _svc.EndFast(GetUserId(), id, request);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpGet("active")]
    public async Task<IActionResult> GetActiveFast()
    {
        var result = await _svc.GetActiveFast(GetUserId());
        if (result == null) return Ok(new { active = false });
        return Ok(new { active = true, fast = result });
    }
}

// ══════════════════════════════════
// GOALS — /api/goals
// ══════════════════════════════════
[ApiController]
[Route("api/goals")]
[Authorize]
public class GoalsController : BaseController
{
    private readonly WorkoutService _svc;
    public GoalsController(WorkoutService svc) => _svc = svc;

    [HttpPost]
    public async Task<IActionResult> CreateGoal([FromBody] CreateGoalRequest request)
        => Ok(await _svc.CreateGoal(GetUserId(), request));

    [HttpGet]
    public async Task<IActionResult> GetGoals()
        => Ok(await _svc.GetGoals(GetUserId()));
}