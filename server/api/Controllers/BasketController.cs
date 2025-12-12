using API.Data;
using API.DTOs;
using API.Entities;
using API.Extensions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

public class BasketController : BaseApiController
{
    private readonly StoreContext _context;
    private readonly ILogger<BasketController> _logger;
    public BasketController(StoreContext context, ILogger<BasketController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet(Name = "GetBasket")]
    public async Task<ActionResult<BasketDto>> GetBasket()
    {
        var basket = await RetrieveBasket(GetBuyerId());

        if (basket == null) return NotFound();

        return basket.MapBasketToDto();
    }

    [HttpPost]
    public async Task<ActionResult> AddItemToBasket(int productId, int quantity = 1)
    {
        var basket = await RetrieveBasket(GetBuyerId());

        if (basket == null) basket = CreateBasket();

        var product = await _context.Products.FindAsync(productId);

        if (product == null) return BadRequest(new ProblemDetails { Title = "Product not found" });

        var existingQty = basket.Items.FirstOrDefault(i => i.ProductId == productId)?.Quantity ?? 0;
        var available = Math.Max(0, product.QuantityInStock - existingQty);
        if (available <= 0 || quantity > available)
        {
            var buyerId = GetBuyerId();
            _logger.LogWarning(
                "Stock validation failed: buyerId={BuyerId}, productId={ProductId}, attempted={Attempted}, inBasket={InBasket}, inStock={InStock}, available={Available}",
                buyerId,
                productId,
                quantity,
                existingQty,
                product.QuantityInStock,
                available
            );
            var msg = $"Cannot add more than {product.QuantityInStock} units of this item - only {available} available";
            return BadRequest(new ProblemDetails { Title = msg });
        }

        basket.AddItem(product, quantity);

        var result = await _context.SaveChangesAsync() > 0;

        if (result) return CreatedAtRoute("GetBasket", basket.MapBasketToDto());

        return BadRequest(new ProblemDetails { Title = "Problem saving item to basket" });
    }

    [HttpDelete]
    public async Task<ActionResult> RemoveBasketItem(int productId, int quantity = 1)
    {
        var basket = await RetrieveBasket(GetBuyerId());

        if (basket == null) return NotFound();

        basket.RemoveItem(productId, quantity);

        var result = await _context.SaveChangesAsync() > 0;

        if (result) return Ok();

        return BadRequest(new ProblemDetails { Title = "Problem removing item from the basket" });
    }

    private async Task<Basket> RetrieveBasket(string buyerId)
    {
        if (string.IsNullOrEmpty(buyerId))
        {
            Response.Cookies.Delete("buyerId");
            return null;
        }

        return await _context.Baskets
            .Include(i => i.Items)
            .ThenInclude(p => p.Product)
            .FirstOrDefaultAsync(basket => basket.BuyerId == buyerId);
    }

    private string GetBuyerId()
    {
        return User.Identity?.Name ?? Request.Cookies["buyerId"];
    }

    private Basket CreateBasket()
    {
        var buyerId = User.Identity?.Name;
        if (string.IsNullOrEmpty(buyerId))
        {
            buyerId = Guid.NewGuid().ToString();
            var cookieOptions = new CookieOptions { IsEssential = true, Expires = DateTime.Now.AddDays(30) };
            Response.Cookies.Append("buyerId", buyerId, cookieOptions);
        }

        var basket = new Basket { BuyerId = buyerId };
        _context.Baskets.Add(basket);
        return basket;
    }
}
