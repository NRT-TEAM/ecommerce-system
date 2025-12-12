using API.DTOs;
using Microsoft.AspNetCore.Mvc;
using System.Net.Mail;

namespace API.Controllers;

public class ContactController : BaseApiController
{
    [HttpPost]
    public async Task<ActionResult> Send(ContactRequestDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Message))
            return BadRequest(new ProblemDetails { Title = "Invalid contact request" });

        try
        {
            using var client = new SmtpClient("localhost");
            var toAdmin = new MailAddress("admin@lewisgroup.local");
            var fromUser = new MailAddress(dto.Email, dto.Name ?? "Website User");
            using var msg = new MailMessage(fromUser, toAdmin)
            {
                Subject = "New Contact Message",
                Body = $"From: {dto.Name} <{dto.Email}>\n\n{dto.Message}",
                IsBodyHtml = false
            };
            await client.SendMailAsync(msg);
        }
        catch
        {
            // Ignore email failures but return success to user
        }

        return Ok(new { success = true });
    }
}