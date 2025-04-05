import requests
import base64
from datetime import datetime


class UserAuthService:


    def __init__(self):
        pass


    def authenticate_user(cookies, user_id):
        try:
            auth_token_val = cookies.get(f'authToken{user_id}')
            refresh_token_val = cookies.get(f'refreshToken{user_id}')

            auth_token_is_validly_structured = True
            try:
                decoded_token_bytes = base64.b64decode(auth_token_val, validate=True)
                if not decoded_token_bytes or len(decoded_token_bytes) != 100:
                    auth_token_is_validly_structured = False
            except:
                auth_token_is_validly_structured = False

            if not auth_token_is_validly_structured:
                return 'The provided authUser token, if any, in your cookies has an invalid structure.'

            try:
                decoded_token_bytes = base64.b64decode(refresh_token_val, validate=True)
                if not decoded_token_bytes or len(decoded_token_bytes) != 100:
                    refresh_token_val = ''
            except:
                refresh_token_val = ''

            cookies_text = f'authToken{user_id}={auth_token_val};'
            if refresh_token_val:
                cookies_text += f' refreshToken{user_id}={refresh_token_val};'

            response = requests.get(
                f'http://34.111.89.101/api/Home-Page/expressJSBackend1/authenticateUser/{user_id}',
                headers={'Cookie': cookies_text},
            )

            if not response.ok:
                return False

            set_cookies = response.headers.get('Set-Cookie')
            if set_cookies:
                set_cookies_array = set_cookies if isinstance(set_cookies, list) else [set_cookies]

                for cookie in set_cookies_array:
                    cookie_key_and_value = cookie.split(';')[0]
                    cookie_parts = cookie_key_and_value.split('=')

                    if cookie_parts[0].strip() == f'authToken{user_id}':
                        refreshed_auth_token = cookie_parts[1].strip()

                        for attribute in cookie.split(';'):
                            trimmed_attribute = attribute.strip()
                            if trimmed_attribute.lower().startswith('expires='):
                                expires_value = trimmed_attribute[8:]
                                try:
                                    refreshed_auth_token_cookie_expiration = datetime.strptime(
                                        expires_value, '%a, %d-%b-%Y %H:%M:%S GMT'
                                    )
                                    return [
                                        refreshed_auth_token,
                                        refreshed_auth_token_cookie_expiration.strftime('%Y-%m-%d %H:%M:%S'),
                                    ]
                                except:
                                    break
                        break

            return True
        except:
            return 'There was trouble connecting to the ExpressJS backend for user authentication'
