using Microsoft.EntityFrameworkCore;
using SimpleApp.Backend.Data;
using SimpleApp.Backend.Data.SimpleApp.Data;
using System.Text.Json.Serialization;

namespace SimpleApp.Backend;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        builder.Services.AddControllers()
            .AddJsonOptions(options =>
            {
                options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
                options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
            });

        // NOTE: Используем AppDbContext, как в вашей конфигурации
        builder.Services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

        builder.Services.AddCors(options =>
        {
            options.AddPolicy("AllowReact", policy =>
            {
                policy.WithOrigins("http://localhost:3000", "https://localhost:3000")
                      .AllowAnyHeader()
                      .AllowAnyMethod();
            });
        });

        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen();

        var app = builder.Build();

        // Автоматическая миграция
        try
        {
            using (var scope = app.Services.CreateScope())
            {
                // Получаем контекст базы данных
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                
                // Применяем все ожидающие миграции
                db.Database.Migrate(); 
            }
        }
        catch (Exception ex)
        {
            var logger = app.Services.GetRequiredService<ILogger<Program>>();
            logger.LogError(ex, "Произошла ошибка при применении миграций к БД.");
        }

        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        app.UseCors("AllowReact");
        app.UseAuthorization();
        app.MapControllers();
        app.MapGet("/", () => Results.Redirect("/swagger"));

        app.Run();
    }
}