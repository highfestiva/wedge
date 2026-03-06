"""Tests for UserRepository — TDD Red Phase."""

from __future__ import annotations

import pytest

from wedge.errors import DuplicateError, NotFoundError, ValidationError
from wedge.models import User
from wedge.repository.user_repository import UserRepository


# ---------------------------------------------------------------------------
# 9.1 Create a user
# ---------------------------------------------------------------------------

class TestCreateUser:
    async def test_create_user_with_valid_fields(self, user_repo: UserRepository):
        """Given valid displayname and email,
        when creating a user,
        then the returned user has auto-generated id and createdAt."""
        # When
        user = await user_repo.create(displayname="Alice", email="alice@test.com")

        # Then
        assert isinstance(user, User)
        assert user.id is not None
        assert user.displayname == "Alice"
        assert user.email == "alice@test.com"
        assert user.created_at is not None


# ---------------------------------------------------------------------------
# 9.2 Create a user — duplicate email
# ---------------------------------------------------------------------------

class TestCreateUserDuplicateEmail:
    async def test_duplicate_email_raises_error(self, user_repo: UserRepository):
        """Given a user with email 'alice@test.com' already exists,
        when creating another user with the same email,
        then a DuplicateError is raised."""
        # Given
        await user_repo.create(displayname="Alice", email="alice@test.com")

        # When / Then
        with pytest.raises(DuplicateError):
            await user_repo.create(displayname="Alice2", email="alice@test.com")


# ---------------------------------------------------------------------------
# 9.3 Create a user — missing required fields
# ---------------------------------------------------------------------------

class TestCreateUserMissingFields:
    async def test_missing_displayname_raises_validation_error(self, user_repo: UserRepository):
        """Given no displayname is provided,
        when creating a user,
        then a ValidationError is raised."""
        with pytest.raises(ValidationError):
            await user_repo.create(displayname="", email="a@test.com")

    async def test_missing_email_raises_validation_error(self, user_repo: UserRepository):
        """Given no email is provided,
        when creating a user,
        then a ValidationError is raised."""
        with pytest.raises(ValidationError):
            await user_repo.create(displayname="Alice", email="")


# ---------------------------------------------------------------------------
# 9.4 Fetch user by email
# ---------------------------------------------------------------------------

class TestFetchUserByEmail:
    async def test_fetch_returns_matching_user(self, user_repo: UserRepository):
        """Given a user exists,
        when fetching by email,
        then the matching user is returned."""
        # Given
        created = await user_repo.create(displayname="Bob", email="bob@test.com")

        # When
        fetched = await user_repo.get_by_email("bob@test.com")

        # Then
        assert fetched.id == created.id
        assert fetched.email == "bob@test.com"
        assert fetched.displayname == "Bob"


# ---------------------------------------------------------------------------
# 9.5 Fetch user — not found
# ---------------------------------------------------------------------------

class TestFetchUserNotFound:
    async def test_nonexistent_email_raises_not_found(self, user_repo: UserRepository):
        """Given no user with the given email exists,
        when fetching,
        then a NotFoundError is raised."""
        with pytest.raises(NotFoundError):
            await user_repo.get_by_email("nonexistent@test.com")
