namespace aspNetCoreBackend1.Services;


public class UserAuthService
{
    public async Task<object> AuthenticateUser(
        int userId, IRequestCookieCollection requestCookies, HttpClient httpClient
    )
    {
        try
            {
                requestCookies.TryGetValue($"authToken{userId}", out string? authTokenVal);
                requestCookies.TryGetValue($"refreshToken{userId}", out string? refreshTokenVal);
                byte[] decodedTokenBytes;
                bool authTokenIsValidlyStructured = true;
                try
                {
                    decodedTokenBytes = Convert.FromBase64String(authTokenVal!);
                    if (decodedTokenBytes.Length != 100) {
                        authTokenIsValidlyStructured = false;
                    }
                }
                catch (FormatException)
                {
                    authTokenIsValidlyStructured = false;
                }

                if (!authTokenIsValidlyStructured)
                {
                    return @"The provided authUser token, if any, in your cookies has an invalid
                    structure.";
                }

                try
                {
                    decodedTokenBytes = Convert.FromBase64String(refreshTokenVal!);
                    if (decodedTokenBytes.Length != 100) {
                        refreshTokenVal = "";
                    }
                }
                catch (FormatException)
                {
                    refreshTokenVal = "";
                }

                HttpRequestMessage request = new HttpRequestMessage(
                    HttpMethod.Get,
                    $"http://34.111.89.101/api/Home-Page/expressJSBackend1/authenticateUser/{userId}"
                );

                string cookiesText = $"authToken{userId}={authTokenVal};";
                if (refreshTokenVal!.Length > 0)
                {
                    cookiesText += $" refreshToken{userId}={refreshTokenVal};";
                }
                
                request.Headers.Add(
                    "Cookie",
                    cookiesText
                );

                HttpResponseMessage response = await httpClient.SendAsync(request);
                
                if (!response.IsSuccessStatusCode)
                {
                    return false;
                }

                if (response.Headers.TryGetValues("Set-Cookie", out var setCookieValues))
                {
                    foreach (var cookie in setCookieValues)
                    {
                        string cookieKeyAndValue = cookie.Split(';')[0];
                        string cookieKey = cookieKeyAndValue.Split('=')[0].Trim();
                        
                        if (cookieKey == $"authToken{userId}")
                        {
                            string refreshedAuthToken = cookieKeyAndValue.Split('=')[1].Trim();

                            foreach (var attribute in cookie.Split(';'))
                            {
                                string trimmedAttribute = attribute.Trim();
                                if (trimmedAttribute.StartsWith("Expires=", StringComparison.OrdinalIgnoreCase))
                                {
                                    string expiresValue = trimmedAttribute.Substring(8).Trim();
                                    if (DateTime.TryParse(expiresValue, out DateTime refreshedAuthTokenCookieExpiration))
                                    {
                                        return new List<object>
                                            {
                                                refreshedAuthToken, refreshedAuthTokenCookieExpiration
                                            };
                                    }
                                }
                            }
                            break;
                        }
                    }

                }
                return true;
            }
            catch
            {
                return @$"There was trouble connecting to the expressJSBackend1 server to authenticate
                you as having the credentials to the user with the id {userId}.";
            }
    } 
}