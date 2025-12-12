using API.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

[Authorize(Roles = "Admin")]
public class AdminReportsController : BaseApiController
{
    private readonly StoreContext _context;
    public AdminReportsController(StoreContext context)
    {
        _context = context;
    }

[HttpGet("sales")]
    public async Task<ActionResult<object>> GetSalesReport()
    {
        var last30Days = DateTime.UtcNow.AddDays(-30);

        var recentSales = await _context.Orders
            .Where(o => o.OrderDate >= last30Days)
            .Select(o => new
            {
                o.Id,
                o.BuyerId,
                o.OrderDate,
                Status = o.OrderStatus.ToString(),
                Total = o.Subtotal + o.DeliveryFee
            })
            .OrderByDescending(x => x.OrderDate)
            .ToListAsync();

        var totalSales = recentSales.Sum(x => x.Total);

        var inventoryLevels = await _context.Products
            .Select(p => new { p.Id, p.Name, Category = p.Category, p.Type, p.QuantityInStock })
            .OrderBy(p => p.Name)
            .ToListAsync();

        return Ok(new
        {
            rangeDays = 30,
            totalSales,
            recentSales,
            inventoryLevels
        });
    }
}
