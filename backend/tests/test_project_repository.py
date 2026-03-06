"""Tests for ProjectRepository — TDD Red Phase."""

from __future__ import annotations

import pytest

from wedge.errors import DuplicateError, ValidationError
from wedge.models import Project
from wedge.repository.project_repository import ProjectRepository


# ---------------------------------------------------------------------------
# 1.1 Create a project
# ---------------------------------------------------------------------------

class TestCreateProject:
    async def test_create_project_with_valid_fields(self, project_repo: ProjectRepository):
        """Given valid name, prefix, and description,
        when creating a project,
        then the returned project has all fields populated including auto-generated id and createdAt."""
        # When
        project = await project_repo.create(name="Wedge", prefix="WDG", description="Issue tracker")

        # Then
        assert isinstance(project, Project)
        assert project.id is not None
        assert project.name == "Wedge"
        assert project.prefix == "WDG"
        assert project.description == "Issue tracker"
        assert project.created_at is not None

    async def test_create_project_without_description(self, project_repo: ProjectRepository):
        """Given name and prefix but no description,
        when creating a project,
        then the project is created with description as None."""
        # When
        project = await project_repo.create(name="Other", prefix="OTH")

        # Then
        assert project.description is None


# ---------------------------------------------------------------------------
# 1.2 Create a project — duplicate prefix
# ---------------------------------------------------------------------------

class TestCreateProjectDuplicatePrefix:
    async def test_duplicate_prefix_raises_error(self, project_repo: ProjectRepository):
        """Given a project with prefix 'WDG' already exists,
        when creating another project with the same prefix,
        then a DuplicateError is raised."""
        # Given
        await project_repo.create(name="Wedge", prefix="WDG")

        # When / Then
        with pytest.raises(DuplicateError):
            await project_repo.create(name="Wedge2", prefix="WDG")


# ---------------------------------------------------------------------------
# 1.3 Create a project — missing required fields
# ---------------------------------------------------------------------------

class TestCreateProjectMissingFields:
    async def test_missing_name_raises_validation_error(self, project_repo: ProjectRepository):
        """Given no name is provided,
        when creating a project,
        then a ValidationError is raised."""
        with pytest.raises(ValidationError):
            await project_repo.create(name="", prefix="WDG")

    async def test_missing_prefix_raises_validation_error(self, project_repo: ProjectRepository):
        """Given no prefix is provided,
        when creating a project,
        then a ValidationError is raised."""
        with pytest.raises(ValidationError):
            await project_repo.create(name="Wedge", prefix="")


# ---------------------------------------------------------------------------
# 1.4 List all projects
# ---------------------------------------------------------------------------

class TestListProjects:
    async def test_list_returns_all_projects(self, project_repo: ProjectRepository):
        """Given multiple projects exist,
        when listing all projects,
        then all projects are returned."""
        # Given
        await project_repo.create(name="Alpha", prefix="ALP")
        await project_repo.create(name="Beta", prefix="BET")
        await project_repo.create(name="Gamma", prefix="GAM")

        # When
        projects = await project_repo.list_all()

        # Then
        assert len(projects) == 3
        names = {p.name for p in projects}
        assert names == {"Alpha", "Beta", "Gamma"}


# ---------------------------------------------------------------------------
# 1.5 List projects — empty database
# ---------------------------------------------------------------------------

class TestListProjectsEmpty:
    async def test_list_returns_empty_when_no_projects(self, project_repo: ProjectRepository):
        """Given no projects exist,
        when listing all projects,
        then an empty list is returned."""
        # When
        projects = await project_repo.list_all()

        # Then
        assert projects == []
