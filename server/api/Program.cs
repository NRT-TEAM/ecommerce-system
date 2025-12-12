using API.Data;
using API.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.Identity;
using API.Entities;

var builder = WebApplication.CreateBuilder(args);

// -----------------
// Database (SQLite)
// -----------------
builder.Services.AddDbContext<StoreContext>(opt =>
{
    opt.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection"));
});

// -----------------
// Identity Services
// -----------------
builder.Services.AddIdentityCore<API.Entities.User>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequireNonAlphanumeric = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireLowercase = true;
    options.Password.RequiredLength = 6;
})
    .AddRoles<API.Entities.Role>()
    .AddEntityFrameworkStores<StoreContext>();

// -----------------
// Controllers & Swagger
// -----------------
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "API", Version = "v1" });

    // JWT authentication for Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = @"JWT Authorization header using the Bearer scheme. 
                        Enter 'Bearer' [space] and then your token.
                        Example: 'Bearer abc123xyz'",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement()
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                },
                Scheme = "oauth2",
                Name = "Bearer",
                In = ParameterLocation.Header,
            },
            new List<string>()
        }
    });
});

// -----------------
// App Services
// -----------------
builder.Services.AddScoped<LocalImageService>();
builder.Services.AddScoped<PaymentService>();
builder.Services.AddScoped<TokenService>(); // Token service
builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());

// -----------------
// Authentication (JWT)
// -----------------
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var key = builder.Configuration["JWTSettings:TokenKey"];
        var issuer = builder.Configuration["JWTSettings:Issuer"];
        var audience = builder.Configuration["JWTSettings:Audience"];
        if (string.IsNullOrEmpty(key))
            throw new InvalidOperationException("JWT TokenKey is missing in appsettings.json");
        if (string.IsNullOrEmpty(issuer))
            throw new InvalidOperationException("JWT Issuer is missing in appsettings.json");
        if (string.IsNullOrEmpty(audience))
            throw new InvalidOperationException("JWT Audience is missing in appsettings.json");

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            ValidateIssuer = true,
            ValidIssuer = issuer,
            ValidateAudience = true,
            ValidAudience = audience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero,
        };
    });

// -----------------
// CORS
// -----------------
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowClient", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// -----------------
// Build app
// -----------------
var app = builder.Build();

// -----------------
// Middleware
// -----------------
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "API v1");
});

// Serve static files
app.UseStaticFiles();
app.UseDirectoryBrowser(); // optional

// Enable CORS with credentials for client dev server
app.UseCors("AllowClient");

// Authentication & Authorization
app.UseAuthentication();
app.UseAuthorization();

// Map controllers
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<StoreContext>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<Role>>();

    await context.Database.MigrateAsync();


    if (!await roleManager.RoleExistsAsync("Member"))
        await roleManager.CreateAsync(new Role { Name = "Member" });

    if (!await roleManager.RoleExistsAsync("Admin"))
        await roleManager.CreateAsync(new Role { Name = "Admin" });

    await DbInitializer.Initialize(context, userManager);
}



// -----------------
// SEED DATABASE
// -----------------
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<StoreContext>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<API.Entities.User>>();

    await DbInitializer.Initialize(context, userManager);
}

app.Run();
