"""Database connection management."""

from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


async def connect(mongo_uri: str = "mongodb://localhost:27017", db_name: str = "wedge") -> AsyncIOMotorDatabase:
    """Connect to MongoDB and return the database handle."""
    global _client, _db
    _client = AsyncIOMotorClient(mongo_uri)
    _db = _client[db_name]
    return _db


async def disconnect() -> None:
    """Close the MongoDB connection."""
    global _client, _db
    if _client is not None:
        _client.close()
        _client = None
        _db = None


def get_db() -> AsyncIOMotorDatabase:
    """Return the current database handle.  Raises if not connected."""
    if _db is None:
        raise RuntimeError("Database not connected. Call connect() first.")
    return _db


async def init_collections(db: AsyncIOMotorDatabase) -> None:
    """Create collections and indices.  Idempotent."""
    # Create collections if they don't exist
    existing = await db.list_collection_names()
    if "projects" not in existing:
        await db.create_collection("projects")
    if "issues" not in existing:
        await db.create_collection("issues")

    issues = db["issues"]
    await issues.create_index("identifier", unique=True)
    await issues.create_index("state")
    await issues.create_index("project")
    await issues.create_index("assignee")


async def seed_default_project(db: AsyncIOMotorDatabase) -> None:
    """Insert the default 'Wedge' project if it doesn't already exist."""
    from wedge.repository.project_repository import ProjectRepository

    repo = ProjectRepository(db)
    projects = await repo.list_all()
    if not any(p.prefix == "WDG" for p in projects):
        await repo.create(name="Wedge", prefix="WDG", description="Default project")
