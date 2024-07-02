using Megagram.Data;
using Microsoft.EntityFrameworkCore;


var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
        {
        options.AddPolicy("AllowSpecificOrigin",
                builder =>
                {
                    builder.WithOrigins("http://localhost:3100")
                        .AllowAnyHeader()
                        .AllowAnyMethod();
                });
        });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddControllers();
builder.Services.AddDbContext<MegaDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddScoped<MegaDbContext>();

builder.Services.AddGraphQLServer()
    .AddQueryType<QueryProvider>()
    .AddMutationType<MutationProvider>()
    .AddProjections()
    .AddFiltering()
    .AddSorting();


var app = builder.Build();

app.Use(async (context, next) =>
{
    context.Response.Headers["Cache-Control"] = "no-store";
    await next();
});
app.UseCors("AllowSpecificOrigin");


if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthorization();
//app.MapControllers();



app.MapGraphQL(path: "/graphql");

app.Run();

