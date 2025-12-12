namespace API.Entities;

public class NewsletterSubscriber
{
    public int Id { get; set; }
    public string Email { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

