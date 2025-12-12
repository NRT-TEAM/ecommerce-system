using System.Net.Mail;
using API.Data;
using API.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

public class NewsletterController : BaseApiController
{
    private readonly StoreContext _context;

    public NewsletterController(StoreContext context)
    {
        _context = context;
    }

    [HttpPost("subscribe")]
    public async Task<ActionResult> Subscribe([FromBody] SubscribeDto dto)
    {
        var email = (dto?.Email ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(email)) return BadRequest(new { message = "Email is required" });
        try
        {
            _ = new MailAddress(email);
        }
        catch
        {
            return BadRequest(new { message = "Please enter a valid email address" });
        }

        var exists = await _context.NewsletterSubscribers.AnyAsync(n => n.Email.ToLower() == email.ToLower());
        if (exists) return Conflict(new { message = "This email is already subscribed" });

        _context.NewsletterSubscribers.Add(new NewsletterSubscriber { Email = email });
        await _context.SaveChangesAsync();
        return Ok(new { message = "Subscribed" });
    }

    public class SubscribeDto
    {
        public string Email { get; set; }
    }
}

