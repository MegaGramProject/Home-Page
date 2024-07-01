using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class MyController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok("Hello, world!");
    }

    [HttpGet("my2")]
    public IActionResult GetMy2()
    {
        return Ok("Hello from my2!");
    }
}
