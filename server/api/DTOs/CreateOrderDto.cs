using API.Entities.OrderAggregate;

namespace API.DTOs;

public class CreateOrderDto
{
    public bool SaveAddress { get; set; }
    public ShippingAddress ShippingAddress { get; set; }
    public string Email { get; set; }
    public string DeliveryOption { get; set; } // standard, express, custom
    public string PaymentType { get; set; } // cash or credit
    public int? CreditTermMonths { get; set; } // 1-36
}
