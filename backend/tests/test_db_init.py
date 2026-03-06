"""Tests for Database Initialization — TDD Red Phase."""

from __future__ import annotations

import pytest
import mongomock_motor

from wedge.db import init_collections, seed_default_project
from wedge.repository.project_repository import ProjectRepository


@pytest.fixture
async def raw_db():
    """Provide a fresh database without any initialization."""
    client = mongomock_motor.AsyncMongoMockClient()
    database = client["wedge_init_test"]
    yield database
    client.close()


# ---------------------------------------------------------------------------
# 8.1 Collections exist after init
# ---------------------------------------------------------------------------

class TestCollectionsExist:
    async def test_init_creates_collections(self, raw_db):
        """Given a fresh database,
        when running init_collections,
        then 'projects' and 'issues' collections exist."""
        # When
        await init_collections(raw_db)

        # Then
        collection_names = await raw_db.list_collection_names()
        assert "projects" in collection_names
        assert "issues" in collection_names


# ---------------------------------------------------------------------------
# 8.2 Indices created
# ---------------------------------------------------------------------------

class TestIndicesCreated:
    async def test_init_creates_expected_indices(self, raw_db):
        """Given a fresh database,
        when running init_collections,
        then the issues collection has a unique index on 'identifier'
        and regular indices on 'state', 'project', 'assignee'."""
        # When
        await init_collections(raw_db)

        # Then
        index_info = await raw_db["issues"].index_information()
        index_keys = {
            name: [k for k, _ in info["key"]]
            for name, info in index_info.items()
        }

        # Check unique index on identifier
        identifier_index = next(
            (name for name, keys in index_keys.items() if "identifier" in keys), None
        )
        assert identifier_index is not None
        assert index_info[identifier_index].get("unique", False) is True

        # Check regular indices exist
        all_indexed_fields = set()
        for keys in index_keys.values():
            all_indexed_fields.update(keys)
        assert "state" in all_indexed_fields
        assert "project" in all_indexed_fields
        assert "assignee" in all_indexed_fields


# ---------------------------------------------------------------------------
# 8.3 Default project seeded
# ---------------------------------------------------------------------------

class TestDefaultProjectSeeded:
    async def test_seed_creates_default_project(self, raw_db):
        """Given a freshly initialized database,
        when running seed_default_project,
        then a project with name 'Wedge' and prefix 'WDG' exists."""
        # Given
        await init_collections(raw_db)

        # When
        await seed_default_project(raw_db)

        # Then
        repo = ProjectRepository(raw_db)
        projects = await repo.list_all()
        assert any(p.name == "Wedge" and p.prefix == "WDG" for p in projects)
