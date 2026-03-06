"""User repository — data-access layer for User entities."""

from __future__ import annotations

from datetime import datetime, timezone

from motor.motor_asyncio import AsyncIOMotorDatabase

from wedge.errors import DuplicateError, NotFoundError, ValidationError
from wedge.models import User


class UserRepository:
    """Manages CRUD operations for User documents in MongoDB."""

    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._db = db
        self._collection = db["users"]

    def _to_model(self, doc: dict) -> User:
        """Convert a MongoDB document to a User model."""
        return User(
            id=str(doc["_id"]),
            displayname=doc["displayname"],
            email=doc["email"],
            created_at=doc["created_at"],
        )

    async def create(self, displayname: str, email: str) -> User:
        """Create a new user.  Raises DuplicateError if email already exists."""
        if not displayname:
            raise ValidationError("User displayname is required.")
        if not email:
            raise ValidationError("User email is required.")

        existing = await self._collection.find_one({"email": email})
        if existing:
            raise DuplicateError(f"User with email '{email}' already exists.")

        doc = {
            "displayname": displayname,
            "email": email,
            "created_at": datetime.now(timezone.utc),
        }
        result = await self._collection.insert_one(doc)
        doc["_id"] = result.inserted_id
        return self._to_model(doc)

    async def get_by_email(self, email: str) -> User:
        """Fetch a user by email.  Raises NotFoundError if not found."""
        doc = await self._collection.find_one({"email": email})
        if doc is None:
            raise NotFoundError(f"User with email '{email}' not found.")
        return self._to_model(doc)

    async def list_all(self) -> list[User]:
        """Return all users."""
        cursor = self._collection.find()
        return [self._to_model(doc) async for doc in cursor]
