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

builder.Services.AddSingleton(new ConcurrentDictionary<int, string>());

builder.Services.AddSingleton(new ConcurrentDictionary<int, HashSet<int>>());

builder.Services.AddSingleton(new ConcurrentDictionary<string, HashSet<string>>());


var app = builder.Build();

app.UseRouting();

app.UseEndpoints(endpoints =>
{
    endpoints.MapHub<CommentLikesHub>("/wsForCommentLikes");
    endpoints.MapHub<CommentRepliesHub>("/wsForCommentReplies");
});

app.Run();
