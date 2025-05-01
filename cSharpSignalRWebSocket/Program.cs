using cSharpSignalRWebSocket.Hubs;
using cSharpSignalRWebSocket.Services;

using System.Collections.Concurrent;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;


var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<UserAuthService>();

builder.Services.AddSingleton<UserInfoFetchingService>();

builder.Services.AddSignalR();

builder.Services.AddHttpClient();

builder.Services.AddSingleton(new ConcurrentDictionary<int, string>());

builder.Services.AddSingleton(new ConcurrentDictionary<string, string>());


var app = builder.Build();

app.UseRouting();

app.UseEndpoints(endpoints =>
{
    endpoints.MapHub<CommentLikesHub>("/websocketForCommentLikes");
    endpoints.MapHub<CommentRepliesHub>("/websocketForCommentReplies");
});

app.Run();
