using Microsoft.AspNetCore.Mvc;
using Megagram.Data;
using System.Data;
using MySql.Data.MySqlClient;


[ApiController]
[Route("/")]
public class BackendController : ControllerBase
{
    private readonly MySqlDatabaseService _databaseService;

    public BackendController(IConfiguration configuration)
    {
        _databaseService = new MySqlDatabaseService(configuration);
    }

    [HttpGet("isUserVerified/{username}")]
    public IActionResult IsUserVerified(string username)
    {
        string query = "SELECT isVerified FROM myapp_user WHERE username = @username";
        MySqlCommand cmd = new MySqlCommand(query);
        cmd.Parameters.AddWithValue("@username", username);

        DataTable dt = _databaseService.ExecuteQueryWithResults(cmd);
        if (dt.Rows.Count == 0)
        {
            return NotFound($"User with username '{username}' not found.");
        }

        bool isVerified = Convert.ToBoolean(dt.Rows[0]["isVerified"]);

        var result = new { Username = username, IsVerified = isVerified };
        return Ok(result);
    }

    [HttpGet("fetchUserInfo/{username}")]
    public IActionResult FetchUserInfo(string username)
    {
        string query = "SELECT created, accountBasedIn FROM myapp_user WHERE username = @username";
        MySqlCommand cmd = new MySqlCommand(query);
        cmd.Parameters.AddWithValue("@username", username);

        DataTable dt = _databaseService.ExecuteQueryWithResults(cmd);
        if (dt.Rows.Count == 0)
        {
            return NotFound($"User with username '{username}' not found.");
        }

        DateTime created = Convert.ToDateTime(dt.Rows[0]["created"]);
        String accountBasedIn = Convert.ToString(dt.Rows[0]["accountBasedIn"]);

        var result = new {Username = username, accountBasedIn=accountBasedIn, created = created};
        return Ok(result);
    }

}
