namespace API.Entities.OrderAggregate;

public enum OrderStatus
{
    Pending,
    Confirmed,
    Packed,
    Dispatched,
    Delivered,
    Cancelled,
    Returned,
    PaymentReceived,
    PaymentFailed,
    Deleted
}
