using API.Data;
using API.DTOs;
using API.Entities;
using API.Extensions;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Net.Mail;

namespace API.Controllers;

public class AccountController : BaseApiController
{
    private readonly UserManager<User> _userManager;
    private readonly TokenService _tokenService;
    private readonly StoreContext _context;

    public AccountController(UserManager<User> userManager, TokenService tokenService, StoreContext context)
    {
        _context = context;
        _tokenService = tokenService;
        _userManager = userManager;
    }

    [HttpPost("login")]
    public async Task<ActionResult<UserDto>> Login(LoginDto loginDto)
    {
        var user = await _userManager.FindByNameAsync(loginDto.Username);
        if (user == null || !await _userManager.CheckPasswordAsync(user, loginDto.Password))
            return Unauthorized();

        var userBasket = await RetrieveBasket(loginDto.Username);
        var anonBasket = await RetrieveBasket(Request.Cookies["buyerId"]);

        if (anonBasket != null)
        {
            if (userBasket != null) _context.Baskets.Remove(userBasket);
            anonBasket.BuyerId = user.UserName;
            Response.Cookies.Delete("buyerId");
            await _context.SaveChangesAsync();
        }

        return new UserDto
        {
            Email = user.Email,
            Token = await _tokenService.GenerateToken(user),
            Basket = anonBasket != null ? anonBasket.MapBasketToDto() : userBasket?.MapBasketToDto()
        };
    }

    [HttpPost("register")]
    public async Task<ActionResult> RegisterUser(RegisterDto registerDto)
    {
        if (registerDto == null || string.IsNullOrWhiteSpace(registerDto.Username) || string.IsNullOrWhiteSpace(registerDto.Password) || string.IsNullOrWhiteSpace(registerDto.Email))
            return BadRequest(new ProblemDetails { Title = "Username, Email and Password are required" });

        try { _ = new MailAddress(registerDto.Email); }
        catch { return BadRequest(new ProblemDetails { Title = "Please enter a valid email address" }); }

        var existingByName = await _userManager.FindByNameAsync(registerDto.Username);
        if (existingByName != null)
            return Conflict(new ProblemDetails { Title = "Username already in use" });

        var existingByEmail = await _userManager.FindByEmailAsync(registerDto.Email);
        if (existingByEmail != null)
            return Conflict(new ProblemDetails { Title = "Email already in use" });

        var user = new User { UserName = registerDto.Username, Email = registerDto.Email, PhoneNumber = registerDto.Phone };

        var result = await _userManager.CreateAsync(user, registerDto.Password);

        if (!result.Succeeded)
        {
            foreach (var error in result.Errors)
            {
                ModelState.AddModelError(error.Code, error.Description);
            }

            return ValidationProblem();
        }

        await _userManager.AddToRoleAsync(user, "Member");

        if (registerDto.Address != null)
        {
            user.Address = new UserAddress
            {
                FullName = registerDto.Address.FullName,
                Address1 = registerDto.Address.Address1,
                Address2 = registerDto.Address.Address2,
                City = registerDto.Address.City,
                State = registerDto.Address.State,
                Zip = registerDto.Address.Zip,
                Country = registerDto.Address.Country
            };
            await _context.SaveChangesAsync();
        }

        return StatusCode(201);
    }

    [AllowAnonymous]
    [HttpPost("forgotPassword")]
    public async Task<ActionResult> ForgotPassword(ForgotPasswordDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto?.Email))
            return BadRequest(new ProblemDetails { Title = "Email is required" });
        try
        {
            _ = new MailAddress(dto.Email);
        }
        catch
        {
            return BadRequest(new ProblemDetails { Title = "Please enter a valid email address" });
        }

        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user == null)
            return Ok(new { success = true });

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        try
        {
            using var client = new SmtpClient("localhost");
            var from = new MailAddress("no-reply@lewisgroup.local", "Lewis Group");
            var to = new MailAddress(dto.Email);
            using var message = new MailMessage(from, to)
            {
                Subject = "Password reset",
                Body = $"Use this token to reset your password: {token}",
                IsBodyHtml = false
            };
            await client.SendMailAsync(message);
        }
        catch { }

        return Ok(new { success = true });
    }

    [AllowAnonymous]
    [HttpPost("resetPassword")]
    public async Task<ActionResult> ResetPassword(ResetPasswordDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto?.Email) || string.IsNullOrWhiteSpace(dto?.Token) || string.IsNullOrWhiteSpace(dto?.NewPassword))
            return BadRequest(new ProblemDetails { Title = "Invalid reset request" });

        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user == null) return BadRequest(new ProblemDetails { Title = "User not found" });

        var result = await _userManager.ResetPasswordAsync(user, dto.Token, dto.NewPassword);
        if (!result.Succeeded)
        {
            foreach (var error in result.Errors)
                ModelState.AddModelError(error.Code, error.Description);
            return ValidationProblem();
        }

        return Ok(new { success = true });
    }

    [Authorize]
    [HttpGet("currentUser")]
    public async Task<ActionResult<UserDto>> GetCurrentUser()
    {
        var user = await _userManager.FindByNameAsync(User.Identity.Name);

        var userBasket = await RetrieveBasket(User.Identity.Name);

        return new UserDto
        {
            Email = user.Email,
            Token = await _tokenService.GenerateToken(user),
            Basket = userBasket?.MapBasketToDto()
        };
    }

    [Authorize]
    [HttpGet("savedAddress")]
    public async Task<ActionResult<UserAddress>> GetSavedAddress()
    {
        return await _userManager.Users
            .Where(x => x.UserName == User.Identity.Name)
            .Select(user => user.Address)
            .FirstOrDefaultAsync();
    }

    [Authorize]
    [HttpPut("savedAddress")]
    public async Task<ActionResult> UpdateSavedAddress(UserAddress dto)
    {
        var user = await _userManager.Users.Include(u => u.Address).FirstOrDefaultAsync(x => x.UserName == User.Identity.Name);
        if (user == null) return NotFound();

        if (user.Address == null)
        {
            user.Address = new UserAddress
            {
                FullName = dto.FullName,
                Address1 = dto.Address1,
                Address2 = dto.Address2,
                City = dto.City,
                State = dto.State,
                Zip = dto.Zip,
                Country = dto.Country
            };
        }
        else
        {
            user.Address.FullName = dto.FullName;
            user.Address.Address1 = dto.Address1;
            user.Address.Address2 = dto.Address2;
            user.Address.City = dto.City;
            user.Address.State = dto.State;
            user.Address.Zip = dto.Zip;
            user.Address.Country = dto.Country;
        }

        await _context.SaveChangesAsync();
        return Ok();
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<ActionResult<UserDto>> UpdateProfile(UpdateProfileDto dto)
    {
        var user = await _userManager.FindByNameAsync(User.Identity.Name);
        if (user == null) return NotFound();

        if (!string.IsNullOrWhiteSpace(dto.Email))
        {
            try { _ = new MailAddress(dto.Email); }
            catch { return BadRequest(new ProblemDetails { Title = "Please enter a valid email address" }); }

            var existingByEmail = await _userManager.FindByEmailAsync(dto.Email);
            if (existingByEmail != null && existingByEmail.Id != user.Id)
                return Conflict(new ProblemDetails { Title = "Email already in use" });

            user.Email = dto.Email;
        }

        if (!string.IsNullOrWhiteSpace(dto.UserName))
        {
            var existingByName = await _userManager.FindByNameAsync(dto.UserName);
            if (existingByName != null && existingByName.Id != user.Id)
                return Conflict(new ProblemDetails { Title = "Username already in use" });

            user.UserName = dto.UserName;
        }

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            foreach (var error in result.Errors)
                ModelState.AddModelError(error.Code, error.Description);
            return ValidationProblem();
        }

        return new UserDto
        {
            Email = user.Email,
            Token = await _tokenService.GenerateToken(user)
        };
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
}
