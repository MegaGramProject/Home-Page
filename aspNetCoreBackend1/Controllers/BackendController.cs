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
    public IActionResult Get(string username)
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

}
