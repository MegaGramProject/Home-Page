using aspNetCoreBackend1.Contexts;
using aspNetCoreBackend1.Attributes;
using aspNetCoreBackend1.Services;
using aspNetCoreBackend1.graphql.Mutations;
using aspNetCoreBackend1.graphql.Queries;

using System.Security.Cryptography.X509Certificates;

using Microsoft.EntityFrameworkCore;
using Azure.Identity;
using Azure.Security.KeyVault.Keys;
using Microsoft.AspNetCore.Server.Kestrel.Https;
using DotNetEnv;


Env.Load();

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddEnvironmentVariables();
builder.Host.UseDefaultServiceProvider(options =>
{
    options.ValidateScopes = false;
    options.ValidateOnBuild = false;
});

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
        options.UseNpgsql(builder.Configuration.GetConnectionString("postgresConnectionString")));
builder.Services.AddScoped<PostgresContext>();

builder.Services.AddDbContext<SqlServerContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("sqlServerConnectionString")));
builder.Services.AddScoped<SqlServerContext>();

builder.Services.AddSingleton<EncryptionAndDecryptionService>();

builder.Services.AddSingleton<UserAuthService>();

builder.Services.AddSingleton<PostOrCommentLikingService>();

builder.Services.AddSingleton<CommentsService>();

builder.Services.AddSingleton<PostInfoFetchingService>();

builder.Services.AddSingleton<KeyClient>(provider =>
{
    var keyVaultUrl = new Uri("https://your-keyvault-name.vault.azure.net/");
    return new KeyClient(keyVaultUrl, new DefaultAzureCredential());
});

builder.Services.AddHttpClient();

builder.Services.AddHttpClient("HttpClientWithMutualTLS")
    .ConfigurePrimaryHttpMessageHandler(() =>
    {
        string certPath = @"../pemFilesForMutualTLS/expressJSBackend1-cert.pem";
        string keyPath = @"../pemFilesForMutualTLS/expressJSBackend1-key.pem";
        string caPath = @"../pemFilesForMutualTLS/Home-Page-ca-cert.pem";

        var clientCertificate = new X509Certificate2(certPath);
        var caCertificate = new X509Certificate2(caPath);
        var privateKey = File.ReadAllText(keyPath);

        var handler = new HttpClientHandler
        {
            ClientCertificates = { clientCertificate },
            SslProtocols = System.Security.Authentication.SslProtocols.Tls12,
        };
        handler.ClientCertificates.Add(caCertificate);

        return handler;
    });

builder.Services.AddHttpContextAccessor();

var serverCert = new X509Certificate2("../pemFilesForMutualTLS/aspNetCoreBackend1-key-and-cert.pfx");

builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenAnyIP(8006, listenOptions =>
    {
        listenOptions.UseHttps(httpsOptions =>
        {
            httpsOptions.ServerCertificate = serverCert;

            httpsOptions.ClientCertificateMode = ClientCertificateMode.AllowCertificate;
        });
    });
});

builder.Services.AddGraphQLServer()
    .AddQueryType<CaptionQueryProvider>()
    .AddQueryType<CommentQueryProvider>()

    .AddMutationType<CaptionMutationProvider>()
    .AddMutationType<CommentMutationProvider>()

    .AddProjections()
    .AddFiltering()
    .AddSorting();

var app = builder.Build();

app.UseCors("AllowSpecificOrigins");

app.MapControllers();

app.UseRouting();

app.Use(async (context, next) =>
{
    var endpoint = context.GetEndpoint();
    var requiresCert = endpoint?.Metadata.GetMetadata<RequireMutualTLSAttribute>() != null;

    if (requiresCert)
    {
        var clientCert = await context.Connection.GetClientCertificateAsync();
        if (clientCert == null)
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            await context.Response.WriteAsync("Client certificate required.");
            return;
        }
        var caCert = new X509Certificate2("../pemFilesForMutualTLS/Home-Page-ca-cert.pem");
        using (var chain = new X509Chain())
        {
            chain.ChainPolicy.ExtraStore.Add(caCert);
            chain.ChainPolicy.VerificationFlags = X509VerificationFlags.AllowUnknownCertificateAuthority;
            chain.ChainPolicy.RevocationMode = X509RevocationMode.NoCheck;

            bool isValid = chain.Build(clientCert);
            if (!isValid)
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                return;
            }
        }
    }

    await next();
});

app.MapGraphQL(path: "/graphql");

app.UseGraphQLGraphiQL("/graphiql");

app.Run();