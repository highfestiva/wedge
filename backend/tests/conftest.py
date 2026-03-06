"""Shared fixtures for Wedge backend tests."""

from __future__ import annotations

import pytest
import mongomock_motor

from wedge.repository.project_repository import ProjectRepository
from wedge.repository.issue_repository import IssueRepository
from wedge.repository.user_repository import UserRepository


@pytest.fixture
async def db():
    """Provide a fresh in-memory MongoDB database for each test."""
    client = mongomock_motor.AsyncMongoMockClient()
    database = client["wedge_test"]
    yield database
    client.close()


@pytest.fixture
async def project_repo(db):
    """Provide a ProjectRepository backed by the test database."""
    return ProjectRepository(db)


@pytest.fixture
async def issue_repo(db):
    """Provide an IssueRepository backed by the test database."""
    return IssueRepository(db)


@pytest.fixture
async def user_repo(db):
    """Provide a UserRepository backed by the test database."""
    return UserRepository(db)


@pytest.fixture
async def sample_project(project_repo: ProjectRepository):
    """Create and return a sample project (Wedge / WDG)."""
    return await project_repo.create(name="Wedge", prefix="WDG", description="Default project")


@pytest.fixture
async def sample_issue(issue_repo: IssueRepository, sample_project):
    """Create and return a sample issue in the sample project."""
    return await issue_repo.create(
        project_id=sample_project.id,
        title="First issue",
        creator="alice@test.com",
    )
