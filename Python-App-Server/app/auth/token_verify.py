from jose import jwt
import requests
from flask import current_app

_JWKS = None

def get_jwks():
    global _JWKS
    if _JWKS is None:
        jwks_url = current_app.config["JWKS_URL"]
        _JWKS = requests.get(jwks_url).json()
    return _JWKS

def verify_token(token):
    jwks = get_jwks()
    headers = jwt.get_unverified_header(token)
    key = next((k for k in jwks['keys'] if k['kid'] == headers['kid']), None)
    if key is None:
        raise Exception("Public key not found")

    public_key = {
        "kty": key["kty"],
        "kid": key["kid"],
        "use": key["use"],
        "n": key["n"],
        "e": key["e"]
    }

    return jwt.decode(
        token,
        public_key,
        algorithms=["RS256"],
        audience=current_app.config["CLIENT_ID"],
        issuer=f"https://cognito-idp.{current_app.config['COGNITO_REGION']}.amazonaws.com/{current_app.config['USERPOOL_ID']}",
        options={"verify_at_hash": False}
    )
