using Microsoft.EntityFrameworkCore;
using ForgedApi.Data;
using ForgedApi.DTOs;
using ForgedApi.Models;

namespace ForgedApi.Services;

public class WeightService
{
    private readonly ForgedDbContext _db;

    public WeightService(ForgedDbContext db) => _db = db;

    public async Task<List<WeightEntryDto>> GetEntries(Guid userId, int limit = 90)
    {
        return await _db.WeightEntries
            .Where(w => w.UserId == userId)
            .OrderByDescending(w => w.Date)
            .Take(limit)
            .Select(w => new WeightEntryDto(w.Id, w.Weight, w.Date, w.Notes))
            .ToListAsync();
    }

    public async Task<WeightEntryDto?> AddEntry(Guid userId, CreateWeightRequest request)
    {
        var existing = await _db.WeightEntries
            .FirstOrDefaultAsync(w => w.UserId == userId && w.Date == request.Date);

        if (existing != null)
        {
            existing.Weight = request.Weight;
            existing.Notes = request.Notes;
        }
        else
        {
            existing = new WeightEntry
            {
                UserId = userId,
                Weight = request.Weight,
                Date = request.Date,
                Notes = request.Notes
            };
            _db.WeightEntries.Add(existing);
        }

        await _db.SaveChangesAsync();
        return new WeightEntryDto(existing.Id, existing.Weight, existing.Date, existing.Notes);
    }

    public async Task<bool> DeleteEntry(Guid userId, Guid entryId)
    {
        var entry = await _db.WeightEntries
            .FirstOrDefaultAsync(w => w.Id == entryId && w.UserId == userId);
        if (entry == null) return false;

        _db.WeightEntries.Remove(entry);
        await _db.SaveChangesAsync();
        return true;
    }
}