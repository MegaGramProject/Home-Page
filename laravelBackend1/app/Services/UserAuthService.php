<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;


class UserAuthService {


    public function authenticateUser($userId, Request $request) {
        try {
            $authTokenVal = $request->cookie("authToken$userId");
            $refreshTokenVal = $request->cookie("refreshToken$userId");

            $authTokenIsValidlyStructured = true;
            try {
                $decodedTokenBytes = base64_decode($authTokenVal, true);
                if ($decodedTokenBytes === false || strlen($decodedTokenBytes) != 100) {
                    $authTokenIsValidlyStructured = false;
                }
            } catch (\Exception $e) {
                $authTokenIsValidlyStructured = false;
            }

            if (!$authTokenIsValidlyStructured) {
                return 'The provided authUser token, if any, in your cookies has an invalid structure.';
            }

            try {
                $decodedTokenBytes = base64_decode($refreshTokenVal, true);
                if ($decodedTokenBytes === false || strlen($decodedTokenBytes) != 100) {
                    $refreshTokenVal = "";
                }
            } catch (\Exception $e) {
                $refreshTokenVal = "";
            }

            $cookiesText = "authToken$userId=$authTokenVal;";
            if (strlen($refreshTokenVal) > 0) {
                $cookiesText .= " refreshToken$userId=$refreshTokenVal;";
            }

            $response = Http::withHeaders([
                'Cookie' => $cookiesText
            ])->get("http://34.111.89.101/api/Home-Page/expressJSBackend1/authenticateUser/$userId");

            if ($response->failed()) {
                return false;
            }

            $setCookies = $response->header('Set-Cookie');
            if ($setCookies) {
                $setCookiesArray = is_array($setCookies) ? $setCookies : [$setCookies];

                foreach ($setCookiesArray as $cookie) {
                    $cookieKeyAndValue = explode(';', $cookie)[0];
                    $cookieParts = explode('=', $cookieKeyAndValue);

                    if (trim($cookieParts[0]) === "authToken{$userId}") {
                        $refreshedAuthToken = trim($cookieParts[1]);

                        foreach (explode(';', $cookie) as $attribute) {
                            $trimmedAttribute = trim($attribute);
                            if (str_starts_with(strtolower($trimmedAttribute), 'expires=')) {
                                $expiresValue = substr($trimmedAttribute, 8);
                                try {
                                    $refreshedAuthTokenCookieExpiration = new \DateTime($expiresValue);
                                    return [
                                        $refreshedAuthToken,
                                        $refreshedAuthTokenCookieExpiration->format('Y-m-d H:i:s')
                                    ];
                                }
                                catch (\Exception $e) {
                                    break;
                                }
                            }
                        }
                        break;
                    }
                }
            }

            return true;
        }
        catch (\Exception $e) {
            return 'There was trouble connecting to the ExpressJS backend for user-authentication';
        }
    }
}