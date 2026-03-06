"""Project repository — data-access layer for Project entities."""

from __future__ import annotations

from datetime import datetime, timezone

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from wedge.errors import DuplicateError, NotFoundError, ValidationError
from wedge.models import Project


class ProjectRepository:
    """Manages CRUD operations for Project documents in MongoDB."""

    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._db = db
        self._collection = db["projects"]

    def _to_model(self, doc: dict) -> Project:
        """Convert a MongoDB document to a Project model."""
        return Project(
            id=str(doc["_id"]),
            name=doc["name"],
            prefix=doc["prefix"],
            created_at=doc["created_at"],
            description=doc.get("description"),
            issue_counter=doc.get("issue_counter", 0),
        )

    async def create(self, name: str, prefix: str, description: str | None = None) -> Project:
        """Create a new project.  Raises DuplicateError if prefix already exists."""
        if not name:
            raise ValidationError("Project name is required.")
        if not prefix:
            raise ValidationError("Project prefix is required.")

        existing = await self._collection.find_one({"prefix": prefix})
        if existing:
            raise DuplicateError(f"Project with prefix '{prefix}' already exists.")

        doc = {
            "name": name,
            "prefix": prefix,
            "description": description,
            "created_at": datetime.now(timezone.utc),
            "issue_counter": 0,
        }
        result = await self._collection.insert_one(doc)
        doc["_id"] = result.inserted_id
        return self._to_model(doc)

    async def list_all(self) -> list[Project]:
        """Return all projects."""
        cursor = self._collection.find()
        return [self._to_model(doc) async for doc in cursor]

    async def get_by_id(self, project_id: str) -> Project:
        """Get a project by its id.  Raises NotFoundError if not found."""
        try:
            oid = ObjectId(project_id)
        except Exception:
            raise NotFoundError(f"Project '{project_id}' not found.")
        doc = await self._collection.find_one({"_id": oid})
        if doc is None:
            raise NotFoundError(f"Project '{project_id}' not found.")
        return self._to_model(doc)

    async def increment_counter(self, project_id: str) -> int:
        """Atomically increment and return the new issue counter for a project."""
        try:
            oid = ObjectId(project_id)
        except Exception:
            raise NotFoundError(f"Project '{project_id}' not found.")
        result = await self._collection.find_one_and_update(
            {"_id": oid},
            {"$inc": {"issue_counter": 1}},
            return_document=True,
        )
        if result is None:
            raise NotFoundError(f"Project '{project_id}' not found.")
        return result["issue_counter"]
