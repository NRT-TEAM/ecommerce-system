using API.Data;
using API.DTOs;
using API.Entities;
using API.Entities.OrderAggregate;
using API.Extensions;
using System.Net.Mail;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

public class OrdersController : BaseApiController
{
    private readonly StoreContext _context;

    public OrdersController(StoreContext context)
    {
        _context = context;
    }

    [Authorize]
    [HttpGet]
    public async Task<ActionResult<List<OrderDto>>> GetOrders()
    {
        var orders = await _context.Orders
            .Where(o => o.BuyerId == User.Identity.Name && o.OrderStatus != OrderStatus.Deleted)
            .ProjectOrderToOrderDto()
            .ToListAsync();

        return orders;
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("all")]
    public async Task<ActionResult<List<OrderDto>>> GetAllOrders()
    {
        var orders = await _context.Orders
            .Where(o => o.OrderStatus != OrderStatus.Deleted)
            .OrderByDescending(o => o.OrderDate)
            .ProjectOrderToOrderDto()
            .ToListAsync();

        return orders;
    }

    [Authorize]
    [HttpGet("{id}", Name = "GetOrder")]
    public async Task<ActionResult<OrderDto>> GetOrder(int id)
    {
        return await _context.Orders
            .ProjectOrderToOrderDto()
            .Where(x => x.BuyerId == User.Identity.Name && x.Id == id)
            .FirstOrDefaultAsync();
    }

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<Order>> CreateOrder(CreateOrderDto orderDto)
    {
        var buyerId = User?.Identity?.Name ?? Request.Cookies["buyerId"];
        var basket = await _context.Baskets
            .RetrieveBasketWithItems(buyerId)
            .FirstOrDefaultAsync();

        if (basket == null) return BadRequest(new ProblemDetails { Title = "Could not locate basket" });

        var items = new List<OrderItem>();

        foreach (var item in basket.Items)
        {
            var productItem = await _context.Products.FindAsync(item.ProductId);
            var itemOrdered = new ProductItemOrdered
            {
                ProductId = productItem.Id,
                Name = productItem.Name,
                PictureUrl = productItem.PictureUrl
            };
            var orderItem = new OrderItem
            {
                ItemOrdered = itemOrdered,
                Price = productItem.Price,
                Quantity = item.Quantity
            };
            items.Add(orderItem);
            productItem.QuantityInStock = Math.Max(0, productItem.QuantityInStock - item.Quantity);
        }

        var subtotal = items.Sum(item => item.Price * item.Quantity);
        long deliveryFee = subtotal > 10000 ? 0 : 500;
        if (!string.IsNullOrEmpty(orderDto.DeliveryOption))
        {
            deliveryFee = orderDto.DeliveryOption.ToLower() switch
            {
                "standard" => 500,
                "express" => 1200,
                "pickup" => 0,
                _ => deliveryFee
            };
        }

        var order = new Order
        {
            OrderItems = items,
            BuyerId = buyerId,
            ShippingAddress = orderDto.ShippingAddress,
            Subtotal = subtotal,
            DeliveryFee = deliveryFee,
            PaymentIntentId = basket.PaymentIntentId
        };

        _context.Orders.Add(order);
        _context.Baskets.Remove(basket);

        if (orderDto.SaveAddress)
        {
            var user = await _context.Users.
                Include(a => a.Address)
                .FirstOrDefaultAsync(x => x.UserName == User.Identity.Name);

            var address = new UserAddress
            {
                FullName = orderDto.ShippingAddress.FullName,
                Address1 = orderDto.ShippingAddress.Address1,
                Address2 = orderDto.ShippingAddress.Address2,
                City = orderDto.ShippingAddress.City,
                State = orderDto.ShippingAddress.State,
                Zip = orderDto.ShippingAddress.Zip,
                Country = orderDto.ShippingAddress.Country
            };
            user.Address = address;
        }

        var result = await _context.SaveChangesAsync() > 0;

        if (result)
        {
            try
            {
                if (!string.IsNullOrEmpty(orderDto.Email))
                {
                    using var client = new SmtpClient("localhost");
                    var from = new MailAddress("no-reply@lewisgroup.local", "Lewis Group");
                    var to = new MailAddress(orderDto.Email);
                    using var message = new MailMessage(from, to)
                    {
                        Subject = "Thank you for your purchase",
                        Body = $"Thank you for shopping with Lewis Group! Your order #{order.Id} totals R{order.GetTotal()}.",
                        IsBodyHtml = false
                    };
                    await client.SendMailAsync(message);
                }
            }
            catch { }

            return CreatedAtRoute("GetOrder", new { id = order.Id }, order.Id);
        }

        return BadRequest("Problem creating order");
    }

    [Authorize]
    [HttpPost("{id}/cancel")]
    public async Task<ActionResult> CancelOrder(int id)
    {
        var order = await _context.Orders.Include(o => o.OrderItems).FirstOrDefaultAsync(o => o.Id == id && o.BuyerId == User.Identity.Name);
        if (order == null) return NotFound();

        if (order.OrderStatus is OrderStatus.Dispatched or OrderStatus.Delivered or OrderStatus.Returned)
            return BadRequest(new ProblemDetails { Title = "Order cannot be cancelled at this stage" });

        order.OrderStatus = OrderStatus.Cancelled;

        foreach (var item in order.OrderItems)
        {
            var product = await _context.Products.FindAsync(item.ItemOrdered.ProductId);
            if (product != null) product.QuantityInStock += item.Quantity;
        }

        await _context.SaveChangesAsync();
        return Ok();
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("{id}/refund")]
    public async Task<ActionResult> RefundOrder(int id)
    {
        var order = await _context.Orders.Include(o => o.OrderItems).FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound();

        order.OrderStatus = OrderStatus.Returned;
        foreach (var item in order.OrderItems)
        {
            var product = await _context.Products.FindAsync(item.ItemOrdered.ProductId);
            if (product != null) product.QuantityInStock += item.Quantity;
        }
        await _context.SaveChangesAsync();
        return Ok();
    }

    [Authorize]
    [HttpGet("{id}/installments")]
    public async Task<ActionResult<object>> GetInstallmentSchedule(int id, [FromQuery] int months = 12, [FromQuery] double rate = 0.12, [FromQuery] long setupFee = 0)
    {
        var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == id && o.BuyerId == User.Identity.Name);
        if (order == null) return NotFound();

        months = Math.Max(1, Math.Min(12, months));
        var principal = order.Subtotal + order.DeliveryFee + setupFee;
        var monthlyRate = rate / 12.0;

        double payment;
        if (monthlyRate == 0)
            payment = principal / months;
        else
            payment = principal * monthlyRate / (1 - Math.Pow(1 + monthlyRate, -months));

        var schedule = new List<object>();
        double balance = principal;
        var startDate = DateTime.UtcNow;
        for (int i = 1; i <= months; i++)
        {
            var interest = balance * monthlyRate;
            var principalPay = payment - interest;
            balance -= principalPay;
            schedule.Add(new
            {
                installmentNumber = i,
                dueDate = startDate.AddMonths(i),
                amount = Math.Round(payment, 2),
                principal = Math.Round(principalPay, 2),
                interest = Math.Round(interest, 2),
                remainingBalance = Math.Round(Math.Max(0, balance), 2)
            });
        }

        return Ok(new { principal, months, annualRate = rate, setupFee, schedule });
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}/status")]
    public async Task<ActionResult> UpdateOrderStatus(int id, [FromBody] UpdateStatusDto dto)
    {
        var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound();

        if (!Enum.TryParse<OrderStatus>(dto?.Status ?? "", out var newStatus))
            return BadRequest(new ProblemDetails { Title = "Invalid status" });

        order.OrderStatus = newStatus;
        await _context.SaveChangesAsync();
        return Ok();
    }

    [Authorize]
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteOwnOrder(int id)
    {
        var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == id && o.BuyerId == User.Identity.Name);
        if (order == null) return NotFound();

        order.OrderStatus = OrderStatus.Deleted;
        await _context.SaveChangesAsync();
        return Ok();
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}/admin")]
    public async Task<ActionResult> DeleteAnyOrder(int id)
    {
        var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound();

        order.OrderStatus = OrderStatus.Deleted;
        await _context.SaveChangesAsync();
        return Ok();
    }
}
