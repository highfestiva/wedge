"""Tests for GraphQL Mutation Resolvers — TDD Red Phase."""

from __future__ import annotations

import pytest
from httpx import ASGITransport, AsyncClient

from wedge.app import app
from wedge.repository.project_repository import ProjectRepository
from wedge.repository.issue_repository import IssueRepository


@pytest.fixture
async def gql_client(db):
    """Provide an HTTP test client wired to the app with a test database."""
    app.state.db = db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


# ---------------------------------------------------------------------------
# 6.1 Mutation `createProject`
# ---------------------------------------------------------------------------

class TestMutationCreateProject:
    async def test_create_project_mutation(self, gql_client: AsyncClient):
        """Given valid input,
        when sending a createProject mutation,
        then the created project with all fields is returned."""
        # When
        response = await gql_client.post(
            "/graphql",
            json={
                "query": """
                    mutation {
                        createProject(name: "Wedge", prefix: "WDG", description: "Tracker") {
                            id
                            name
                            prefix
                            description
                            createdAt
                        }
                    }
                """
            },
            headers={"X-User": "admin@test.com"},
        )

        # Then
        assert response.status_code == 200
        data = response.json()
        assert "errors" not in data
        project = data["data"]["createProject"]
        assert project["name"] == "Wedge"
        assert project["prefix"] == "WDG"
        assert project["id"] is not None


# ---------------------------------------------------------------------------
# 6.2 Mutation `createProject` — duplicate prefix error
# ---------------------------------------------------------------------------

class TestMutationCreateProjectDuplicate:
    async def test_duplicate_prefix_returns_error(self, gql_client: AsyncClient, db):
        """Given a project with prefix WDG already exists,
        when sending a createProject mutation with the same prefix,
        then a GraphQL error is returned."""
        # Given
        repo = ProjectRepository(db)
        await repo.create(name="Wedge", prefix="WDG")

        # When
        response = await gql_client.post(
            "/graphql",
            json={
                "query": """
                    mutation {
                        createProject(name: "Wedge2", prefix: "WDG") {
                            id name prefix
                        }
                    }
                """
            },
            headers={"X-User": "admin@test.com"},
        )

        # Then
        data = response.json()
        assert "errors" in data


# ---------------------------------------------------------------------------
# 6.3 Mutation `createIssue`
# ---------------------------------------------------------------------------

class TestMutationCreateIssue:
    async def test_create_issue_mutation(self, gql_client: AsyncClient, db):
        """Given a project exists,
        when sending a createIssue mutation,
        then the created issue with auto-generated identifier is returned."""
        # Given
        repo = ProjectRepository(db)
        project = await repo.create(name="Wedge", prefix="WDG")

        # When
        response = await gql_client.post(
            "/graphql",
            json={
                "query": """
                    mutation($pid: String!, $title: String!) {
                        createIssue(projectId: $pid, title: $title) {
                            id identifier title state priority creator
                        }
                    }
                """,
                "variables": {"pid": project.id, "title": "New Issue"},
            },
            headers={"X-User": "alice@test.com"},
        )

        # Then
        assert response.status_code == 200
        data = response.json()
        assert "errors" not in data
        issue = data["data"]["createIssue"]
        assert issue["identifier"].startswith("WDG-")
        assert issue["title"] == "New Issue"
        assert issue["creator"] == "alice@test.com"


# ---------------------------------------------------------------------------
# 6.4 Mutation `createIssue` — missing required fields
# ---------------------------------------------------------------------------

class TestMutationCreateIssueMissingFields:
    async def test_missing_title_returns_error(self, gql_client: AsyncClient, db):
        """Given a project exists,
        when sending createIssue without title,
        then a GraphQL validation error is returned."""
        repo = ProjectRepository(db)
        project = await repo.create(name="Wedge", prefix="WDG")

        # When — title is required by schema, so omitting it should error
        response = await gql_client.post(
            "/graphql",
            json={
                "query": """
                    mutation($pid: String!) {
                        createIssue(projectId: $pid) {
                            id identifier
                        }
                    }
                """,
                "variables": {"pid": project.id},
            },
            headers={"X-User": "alice@test.com"},
        )

        # Then
        data = response.json()
        assert "errors" in data


# ---------------------------------------------------------------------------
# 6.5 Mutation `updateIssue`
# ---------------------------------------------------------------------------

class TestMutationUpdateIssue:
    async def test_update_issue_mutation(self, gql_client: AsyncClient, db):
        """Given an issue exists,
        when sending an updateIssue mutation with a new state,
        then the updated issue with history entry is returned."""
        # Given
        proj_repo = ProjectRepository(db)
        project = await proj_repo.create(name="Wedge", prefix="WDG")
        issue_repo = IssueRepository(db)
        issue = await issue_repo.create(
            project_id=project.id, title="To update", creator="alice@test.com"
        )

        # When
        response = await gql_client.post(
            "/graphql",
            json={
                "query": """
                    mutation($id: String!, $state: String) {
                        updateIssue(identifier: $id, state: $state) {
                            identifier state
                            history { field fromValue toValue actor }
                        }
                    }
                """,
                "variables": {"id": issue.identifier, "state": "In Progress"},
            },
            headers={"X-User": "editor@test.com"},
        )

        # Then
        assert response.status_code == 200
        data = response.json()
        assert "errors" not in data
        updated = data["data"]["updateIssue"]
        assert updated["state"] == "In Progress"
        assert any(h["field"] == "state" for h in updated["history"])


# ---------------------------------------------------------------------------
# 6.6 Mutation `addComment`
# ---------------------------------------------------------------------------

class TestMutationAddComment:
    async def test_add_comment_mutation(self, gql_client: AsyncClient, db):
        """Given an issue exists,
        when sending an addComment mutation,
        then the created comment with all fields is returned."""
        # Given
        proj_repo = ProjectRepository(db)
        project = await proj_repo.create(name="Wedge", prefix="WDG")
        issue_repo = IssueRepository(db)
        issue = await issue_repo.create(
            project_id=project.id, title="Commentable", creator="alice@test.com"
        )

        # When
        response = await gql_client.post(
            "/graphql",
            json={
                "query": """
                    mutation($issueId: String!, $body: String!) {
                        addComment(issueIdentifier: $issueId, body: $body) {
                            id author body createdAt
                        }
                    }
                """,
                "variables": {"issueId": issue.identifier, "body": "Great work!"},
            },
            headers={"X-User": "carol@test.com"},
        )

        # Then
        assert response.status_code == 200
        data = response.json()
        assert "errors" not in data
        comment = data["data"]["addComment"]
        assert comment["body"] == "Great work!"
        assert comment["author"] == "carol@test.com"


# ---------------------------------------------------------------------------
# 6.7 Mutation `deleteIssue`
# ---------------------------------------------------------------------------

class TestMutationDeleteIssue:
    async def test_delete_issue_mutation(self, gql_client: AsyncClient, db):
        """Given an issue exists,
        when sending a deleteIssue mutation,
        then true is returned and subsequent query returns not-found."""
        # Given
        proj_repo = ProjectRepository(db)
        project = await proj_repo.create(name="Wedge", prefix="WDG")
        issue_repo = IssueRepository(db)
        issue = await issue_repo.create(
            project_id=project.id, title="To delete", creator="alice@test.com"
        )

        # When
        response = await gql_client.post(
            "/graphql",
            json={
                "query": """
                    mutation($id: String!) {
                        deleteIssue(identifier: $id)
                    }
                """,
                "variables": {"id": issue.identifier},
            },
            headers={"X-User": "admin@test.com"},
        )

        # Then
        assert response.status_code == 200
        data = response.json()
        assert "errors" not in data
        assert data["data"]["deleteIssue"] is True

        # Verify subsequent query returns error
        r2 = await gql_client.post(
            "/graphql",
            json={
                "query": """
                    query($id: String!) {
                        issue(identifier: $id) { identifier }
                    }
                """,
                "variables": {"id": issue.identifier},
            },
            headers={"X-User": "admin@test.com"},
        )
        d2 = r2.json()
        assert "errors" in d2


# ---------------------------------------------------------------------------
# 6.8 Mutation `deleteIssue` — not found
# ---------------------------------------------------------------------------

class TestMutationDeleteIssueNotFound:
    async def test_delete_nonexistent_returns_error(self, gql_client: AsyncClient):
        """Given no issue with the identifier exists,
        when sending a deleteIssue mutation,
        then a GraphQL error is returned."""
        # When
        response = await gql_client.post(
            "/graphql",
            json={
                "query": """
                    mutation {
                        deleteIssue(identifier: "NOPE-999")
                    }
                """
            },
            headers={"X-User": "admin@test.com"},
        )

        # Then
        data = response.json()
        assert "errors" in data
