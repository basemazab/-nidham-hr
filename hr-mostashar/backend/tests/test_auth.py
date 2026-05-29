import pytest
from app.utils.auth_utils import hash_password, verify_password, create_access_token, decode_access_token


class TestPasswordHashing:
    def test_hash_and_verify(self):
        password = "test_password_123"
        hashed = hash_password(password)
        assert hashed != password
        assert verify_password(password, hashed)

    def test_wrong_password(self):
        hashed = hash_password("correct_password")
        assert not verify_password("wrong_password", hashed)

    def test_different_hashes(self):
        password = "same_password"
        hash1 = hash_password(password)
        hash2 = hash_password(password)
        assert hash1 != hash2  # bcrypt uses random salt
        assert verify_password(password, hash1)
        assert verify_password(password, hash2)


class TestJWT:
    def test_create_and_decode(self):
        data = {"sub": "user-123", "email": "test@example.com"}
        token = create_access_token(data)
        decoded = decode_access_token(token)
        assert decoded is not None
        assert decoded["sub"] == "user-123"
        assert decoded["email"] == "test@example.com"

    def test_invalid_token(self):
        result = decode_access_token("invalid.token.here")
        assert result is None

    def test_expired_token(self):
        from datetime import timedelta
        data = {"sub": "user-123"}
        token = create_access_token(data, expires_delta=timedelta(seconds=-1))
        decoded = decode_access_token(token)
        assert decoded is None
