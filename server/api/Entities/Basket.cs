namespace API.Entities;

public class Basket
{
    public int Id { get; set; }
    public string BuyerId { get; set; }
    public List<BasketItem> Items { get; set; } = new List<BasketItem>();
    public string PaymentIntentId { get; set; }
    public string ClientSecret { get; set; }

    public void AddItem(Product product, int quantity)
    {
        if (Items.All(item => item.ProductId != product.Id))
        {
            var initialQty = Math.Min(quantity, Math.Max(0, product.QuantityInStock));
            Items.Add(new BasketItem { Product = product, Quantity = initialQty });
            return;
        }

        var existingItem = Items.FirstOrDefault(item => item.ProductId == product.Id);
        if (existingItem != null)
        {
            var maxAllowed = Math.Max(0, product.QuantityInStock);
            existingItem.Quantity = Math.Min(maxAllowed, existingItem.Quantity + quantity);
        }
    }

    public void RemoveItem(int productId, int quantity = 1)
    {
        var item = Items.FirstOrDefault(basketItem => basketItem.ProductId == productId);
        if (item == null) return;
        item.Quantity -= quantity;
        if (item.Quantity == 0) Items.Remove(item);
    }
}
