using Microsoft.EntityFrameworkCore;
using SimpleApp.Backend.Models;

namespace SimpleApp.Backend.Data
{
    namespace SimpleApp.Data
    {
        public class AppDbContext : DbContext
        {
            public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

            public DbSet<User> Users { get; set; }
        }
    }
}
