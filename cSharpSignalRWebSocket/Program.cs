using cSharpSignalRWebSocket.Hubs;
using cSharpSignalRWebSocket.Services;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;


var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<UserAuthService>();

builder.Services.AddSingleton<UserInfoFetchingService>();

builder.Services.AddSingleton<CommentInfoFetchingService>();

builder.Services.AddSignalR();

builder.Services.AddHttpClient();

builder.Services.AddSingleton(new ConcurrentDictionary<string, CancellationTokenSource>());

builder.Services.AddSingleton(new ConcurrentDictionary<string, int>());

builder.Services.AddSingleton(new ConcurrentDictionary<string, List<string>>());

builder.Services.AddSingleton(new ConcurrentDictionary<int, string>());

builder.Services.AddSingleton(new ConcurrentDictionary<int, List<int>>());

builder.Services.AddSingleton(new ConcurrentDictionary<string, HashSet<string>>());


var app = builder.Build();

app.UseRouting();

app.UseEndpoints(endpoints =>
{
    endpoints.MapHub<CommentLikesHub>("/wsForCommentLikes");
});

app.Run();
