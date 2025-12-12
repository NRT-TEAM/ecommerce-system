namespace API.DTOs;

using API.Entities;

public class RegisterDto : LoginDto
{
    public string Email { get; set; }
    public string Phone { get; set; }
    public Address Address { get; set; }
}
