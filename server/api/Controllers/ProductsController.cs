using API.Data;
using API.DTOs;
using API.Entities;
using API.Entities.OrderAggregate;
using API.Extensions;
using API.RequestHelpers;
using API.Services;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

public class ProductsController : BaseApiController
{
    private readonly StoreContext _context;
    private readonly IMapper _mapper;
    private readonly LocalImageService _imageService;
    private static readonly string[] AllowedCategories = new[] { "Furniture", "Bedroom", "Audio", "Appliances" };
    private static readonly string[] AllowedTypes = new[] {
        // Furniture
        "Sofas", "Tables", "Chairs", "Shelves",
        
        // Bedroom
        "Beds", "Mattresses", "Nightstands", "Dressers",
        // Audio
        "Synthesizers", "Keyboards", "Pedals", "Guitars",

        // Appliances
        "Microwaves", "Toasters", "Fridges","Ovens",
    };
    private static readonly Dictionary<string, string[]> TypeToCategory = new()
    {
        // Furniture
        ["Sofas"] = new[] { "Furniture" },
        ["Tables"] = new[] { "Furniture" },
        ["Chairs"] = new[] { "Furniture" },
        ["Shelves"] = new[] { "Furniture" },
        
        // Bedroom
        ["Beds"] = new[] { "Bedroom" },
        ["Mattresses"] = new[] { "Bedroom" },
        ["Nightstands"] = new[] { "Bedroom" },
        ["Dressers"] = new[] { "Bedroom" },
        // Audio
        ["Synthesizers"] = new[] { "Audio" },
        ["Keyboards"] = new[] { "Audio" },
        ["Pedals"] = new[] { "Audio" },
        ["Guitars"] = new[] { "Audio" },

        // Appliances
        ["Microwaves"] = new[] { "Appliances" },
        ["Toasters"] = new[] { "Appliances" },
        ["Fridges"] = new[] { "Appliances" },
        ["Ovens"] = new[] { "Appliances" },
    };

    public ProductsController(StoreContext context, IMapper mapper, LocalImageService imageService)
    {
        _context = context;
        _mapper = mapper;
        _imageService = imageService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedList<Product>>> GetProducts([FromQuery] ProductParams productParams)
    {
        var query = _context.Products
            .Sort(productParams.OrderBy)
            .Search(productParams.SearchTerm)
            .Filter(productParams.Categories, productParams.Types)
            .AsQueryable();

        var products = await PagedList<Product>.ToPagedList(
            query,
            productParams.PageNumber,
            productParams.PageSize
        );

        Response.AddPaginationHeader(products.MetaData);

        return products;
    }

    [HttpGet("bestSellers")]
    public async Task<ActionResult<IEnumerable<Product>>> GetBestSellers([FromQuery] int limit = 5)
    {
        if (limit <= 0) limit = 5;

        var sales = await _context.Orders
            .Where(o => o.OrderStatus == OrderStatus.PaymentReceived || o.OrderStatus == OrderStatus.Delivered)
            .SelectMany(o => o.OrderItems)
            .GroupBy(oi => oi.ItemOrdered.ProductId)
            .Select(g => new { ProductId = g.Key, TotalSold = g.Sum(x => x.Quantity) })
            .OrderByDescending(x => x.TotalSold)
            .Take(limit * 3)
            .ToListAsync();

        var productIds = sales.Select(x => x.ProductId).ToList();

        var products = await _context.Products
            .Where(p => productIds.Contains(p.Id))
            .ToListAsync();

        var ordered = sales
            .Join(products, s => s.ProductId, p => p.Id, (s, p) => new { p, s.TotalSold })
            .OrderByDescending(x => x.TotalSold)
            .Take(limit)
            .Select(x => x.p)
            .ToList();

        return Ok(ordered);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Product>> GetProduct(int id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null) return NotFound();
        return product;
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("purgeAppliances")]
    public async Task<ActionResult<object>> PurgeAppliances()
    {
        var types = new[] { "Microwaves", "Toasters", "Fridges", "Ovens" };
        var toDelete = await _context.Products
            .Where(p => p.Category == "Appliances" || types.Contains(p.Type))
            .Select(p => p.Id)
            .ToListAsync();

        if (toDelete.Count == 0)
            return Ok(new { deleted = 0, message = "No appliances found" });

        var basketsWithItems = await _context.Baskets
            .Include(b => b.Items)
            .Where(b => b.Items.Any(i => toDelete.Contains(i.ProductId)))
            .CountAsync();

        var activeOrdersWithItems = await _context.Orders
            .Include(o => o.OrderItems)
            .Where(o => o.OrderStatus != Entities.OrderAggregate.OrderStatus.Cancelled && o.OrderStatus != Entities.OrderAggregate.OrderStatus.Returned)
            .Where(o => o.OrderItems.Any(oi => toDelete.Contains(oi.ItemOrdered.ProductId)))
            .CountAsync();

        if (basketsWithItems > 0 || activeOrdersWithItems > 0)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Cannot purge appliances while referenced in carts or active orders",
                Detail = $"Carts: {basketsWithItems}, ActiveOrders: {activeOrdersWithItems}"
            });
        }

        var products = await _context.Products
            .Where(p => toDelete.Contains(p.Id))
            .ToListAsync();

        foreach (var p in products)
        {
            if (!string.IsNullOrEmpty(p.PublicId))
                await _imageService.DeleteImageAsync(p.PublicId);
        }

        _context.Products.RemoveRange(products);
        var saved = await _context.SaveChangesAsync() > 0;
        if (!saved) return BadRequest(new ProblemDetails { Title = "Failed to purge appliances" });

        return Ok(new { deleted = products.Count });
    }
    [Authorize(Roles = "Admin")]
    [HttpGet("export")]
    public async Task<IActionResult> ExportCsv()
    {
        var products = await _context.Products
            .OrderBy(p => p.Id)
            .ToListAsync();

        var sb = new System.Text.StringBuilder();
        sb.Append("sep=,");
        sb.Append("\r\n");
        sb.AppendLine("SKU,Name,Description,Category,Type,Price,QuantityInStock,PictureUrl");
        foreach (var p in products)
        {
            var line = string.Join(",",
                new string[] {
                    p.Id.ToString(),
                    Escape(p.Name),
                    Escape(p.Description),
                    Escape(p.Category),
                    Escape(p.Type),
                    p.Price.ToString(),
                    p.QuantityInStock.ToString(),
                    Escape(p.PictureUrl)
                }
            );
            sb.Append(line);
            sb.Append("\r\n");
        }
        var csv = sb.ToString();
        byte[] bytes = System.Text.Encoding.UTF8.GetBytes("\uFEFF" + csv);
        return File(bytes, "text/csv; charset=utf-8", $"products_{DateTime.UtcNow:yyyyMMdd}.csv");
    }

    private static string Escape(string s)
    {
        if (string.IsNullOrEmpty(s)) return "";
        var needsQuotes = s.Contains(',') || s.Contains('"') || s.Contains('\n');
        var escaped = s.Replace("\"", "\"\"");
        return needsQuotes ? $"\"{escaped}\"" : escaped;
    }
    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<Product>> CreateProduct([FromForm] CreateProductDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Description))
            return BadRequest(new ProblemDetails { Title = "Name and Description are required" });
        if (dto.QuantityInStock < 0)
            return BadRequest(new ProblemDetails { Title = "Stock cannot be negative" });
        var type = dto.Type?.Trim();
        var category = dto.Category?.Trim();
        if (!AllowedTypes.Contains(type))
            return BadRequest(new ProblemDetails { Title = $"Type must be one of: {string.Join(", ", AllowedTypes)}" });
        if (!AllowedCategories.Contains(category))
            return BadRequest(new ProblemDetails { Title = $"Category must be one of: {string.Join(", ", AllowedCategories)}" });
        if (TypeToCategory.TryGetValue(type, out var categoriesForType) && !categoriesForType.Contains(category))
            return BadRequest(new ProblemDetails { Title = $"Category '{category}' is not valid for Type '{type}'. Allowed: {string.Join(", ", categoriesForType)}" });

        var product = _mapper.Map<Product>(dto);

        if (dto.File != null)
        {
            var result = await _imageService.AddImageAsync(dto.File);

            if (result.Error != null)
                return BadRequest(new ProblemDetails { Title = result.Error });

            product.PictureUrl = result.Url;
            product.PublicId = result.PublicId;
        }

        _context.Products.Add(product);
        var saved = await _context.SaveChangesAsync() > 0;

        if (!saved)
            return BadRequest("Error saving product");

        return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, product);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut]
    public async Task<ActionResult<Product>> UpdateProduct([FromForm] UpdateProductDto dto)
    {
        var product = await _context.Products.FindAsync(dto.Id);
        if (product == null) return NotFound();

        var type = dto.Type?.Trim();
        var category = dto.Category?.Trim();
        if (dto.QuantityInStock < 0)
            return BadRequest(new ProblemDetails { Title = "Stock cannot be negative" });
        if (!string.IsNullOrWhiteSpace(type) && !AllowedTypes.Contains(type))
            return BadRequest(new ProblemDetails { Title = $"Type must be one of: {string.Join(", ", AllowedTypes)}" });
        if (!string.IsNullOrWhiteSpace(category) && !AllowedCategories.Contains(category))
            return BadRequest(new ProblemDetails { Title = $"Category must be one of: {string.Join(", ", AllowedCategories)}" });
        if (!string.IsNullOrWhiteSpace(type) && !string.IsNullOrWhiteSpace(category) && TypeToCategory.TryGetValue(type, out var categoriesForType) && !categoriesForType.Contains(category))
            return BadRequest(new ProblemDetails { Title = $"Category '{category}' is not valid for Type '{type}'. Allowed: {string.Join(", ", categoriesForType)}" });

        _mapper.Map(dto, product);

        if (dto.File != null)
        {
            var upload = await _imageService.AddImageAsync(dto.File);
            if (upload.Error != null)
                return BadRequest(upload.Error);

            if (!string.IsNullOrEmpty(product.PublicId))
                await _imageService.DeleteImageAsync(product.PublicId);

            product.PictureUrl = upload.Url;
            product.PublicId = upload.PublicId;
        }

        var saved = await _context.SaveChangesAsync() > 0;
        if (!saved)
            return BadRequest("Failed to update product");

        return product;
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteProduct(int id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null) return NotFound();

        if (!string.IsNullOrEmpty(product.PublicId))
            await _imageService.DeleteImageAsync(product.PublicId);

        _context.Products.Remove(product);

        var saved = await _context.SaveChangesAsync() > 0;
        if (!saved)
            return BadRequest("Error deleting product");

        return Ok();
    }
}
