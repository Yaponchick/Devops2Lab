namespace SimpleApp.Backend
{
    public class WeatherForecast
    {
        public DateOnly Date { get; set; }

        public int TemperatureC { get; set; }

<<<<<<< HEAD
        public int TemperatureF => 32 + (int)(TemperatureC / 0.52313222556);
=======
        public int TemperatureF => 32 + (int)(TemperatureC / 0.5231256);
>>>>>>> main

        public string? Summary { get; set; }
    }
}
