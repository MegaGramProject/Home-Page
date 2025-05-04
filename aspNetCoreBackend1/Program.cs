using aspNetCoreBackend1.Contexts;
using aspNetCoreBackend1.Attributes;
using aspNetCoreBackend1.Services;
using aspNetCoreBackend1.graphql.Mutations;
using aspNetCoreBackend1.graphql.Queries;

using System.Threading.RateLimiting;

using Microsoft.EntityFrameworkCore;
using Azure.Identity;
using Azure.Security.KeyVault.Keys;
using StackExchange.Redis;
using DotNetEnv;


Env.Load();

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddEnvironmentVariables();

builder.Services.AddCors(options =>
{
        options.AddPolicy("AllowSpecificOrigins", policy =>
        {
                policy.WithOrigins("http://localhost:8004", "http://34.111.89.101")
                .AllowCredentials()
                .AllowAnyHeader()
                .AllowAnyMethod();
        });
});
builder.Services.AddControllers();

builder.Services.AddDbContext<PostgresContext>(options =>
        options.UseNpgsql(builder.Configuration.GetConnectionString("postgresConnectionString"))
);
builder.Services.AddScoped<PostgresContext>();

builder.Services.AddDbContext<SqlServerContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("sqlServerConnectionString"))
);
builder.Services.AddScoped<SqlServerContext>();

builder.Services.AddSingleton<IConnectionMultiplexer>(provider =>
    ConnectionMultiplexer.Connect(builder.Configuration.GetConnectionString("redisConnectionString")!)
);

builder.Services.AddSingleton<KeyClient>(provider =>
{
    var keyVaultUrl = new Uri("https://your-keyvault-name.vault.azure.net/");
    return new KeyClient(keyVaultUrl, new DefaultAzureCredential());
});

builder.Services.AddSingleton<EncryptionAndDecryptionService>();

builder.Services.AddSingleton<UserAuthService>();

builder.Services.AddSingleton<PostOrCommentLikingService>();

builder.Services.AddSingleton<CommentsService>();

builder.Services.AddSingleton<PostInfoFetchingService>();

builder.Services.AddSingleton<CaptionService>();

builder.Services.AddSingleton<UserInfoFetchingService>();

builder.Services.AddHttpClient();

builder.Services.AddGraphQLServer()
    .AddQueryType<CaptionQueryProvider>()
    .AddQueryType<CommentQueryProvider>()

    .AddMutationType<CaptionMutationProvider>()
    .AddMutationType<CommentMutationProvider>()

    .AddProjections()
    .AddFiltering()
    .AddSorting();

builder.Services.AddRateLimiter(options =>
{
    options.AddPolicy("5PerMinute", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString(),
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromSeconds(60)
            }
        )
    );

    options.AddPolicy("6PerMinute", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString(),
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 6,
                Window = TimeSpan.FromSeconds(60)
            }
        )
    );

    options.AddPolicy("8PerMinute", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString(),
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 8,
                Window = TimeSpan.FromSeconds(60)
            }
        )
    );
        
    options.AddPolicy("12PerMinute", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString(),
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 12,
                Window = TimeSpan.FromSeconds(60)
            }
        )
    );
});

var app = builder.Build();

app.UseCors("AllowSpecificOrigins");

app.MapControllers();

app.UseRouting();

app.MapGraphQL(path: "/graphql");

app.UseGraphQLGraphiQL("/graphiql");

app.UseRateLimiter();

app.Run();