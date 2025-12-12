using API.Entities;
using Microsoft.AspNetCore.Identity;

namespace API.Data;

public static class DbInitializer
{
    public static async Task Initialize(StoreContext context, UserManager<User> userManager)
    {
        if (!userManager.Users.Any())
        {
            var user = new User
            {
                UserName = "wizard",
                Email = "nazim@gmail.com"
            };

            await userManager.CreateAsync(user, "Pa$$w0rd");
            await userManager.AddToRoleAsync(user, "Member");

            var admin = new User
            {
                UserName = "admin",
                Email = "admin@gmail.com"
            };

            await userManager.CreateAsync(admin, "Pa$$w0rd");
            await userManager.AddToRolesAsync(admin, new[] { "Admin", "Member" });
        }

        if (context.Products.Any()) return;

        var products = new List<Product>
        {
            // Furniture
            new Product { Name = "Guitar", Description = "Play some tunes!", Price = 89900, PictureUrl = "/images/products/audio/guitars/1.png", Category = "Audio", Type = "Guitars", QuantityInStock = 15 },
            new Product { Name = "Pedal", Description = "Play some tunes with effects!", Price = 120088, PictureUrl = "/images/products/audio/pedals/1.png", Category = "Audio", Type = "Pedals", QuantityInStock = 15 },
        };

        foreach (var product in products)
        {
            context.Products.Add(product);
        }

        context.SaveChanges();
    }
}
