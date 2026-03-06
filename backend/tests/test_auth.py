"""Tests for X-User Header (MVP Auth) — TDD Red Phase."""

from __future__ import annotations

import pytest
from httpx import ASGITransport, AsyncClient

from wedge.app import app
from wedge.repository.project_repository import ProjectRepository
from wedge.repository.issue_repository import IssueRepository


@pytest.fixture
async def gql_client(db):
    """Provide an HTTP test client."""
    app.state.db = db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


@pytest.fixture
async def seeded_project(db):
    """Create a project for auth tests."""
    repo = ProjectRepository(db)
    return await repo.create(name="Wedge", prefix="WDG")


# ---------------------------------------------------------------------------
# 7.1 Creator populated from X-User header
# ---------------------------------------------------------------------------

class TestCreatorFromXUser:
    async def test_creator_matches_x_user_header(
        self, gql_client: AsyncClient, seeded_project
    ):
        """Given the X-User header is 'alice@test.com',
        when creating an issue,
        then the issue's creator field is 'alice@test.com'."""
        # When
        response = await gql_client.post(
            "/graphql",
            json={
                "query": """
                    mutation($pid: String!) {
                        createIssue(projectId: $pid, title: "Auth test") {
                            creator
                        }
                    }
                """,
                "variables": {"pid": seeded_project.id},
            },
            headers={"X-User": "alice@test.com"},
        )

        # Then
        data = response.json()
        assert "errors" not in data
        assert data["data"]["createIssue"]["creator"] == "alice@test.com"


# ---------------------------------------------------------------------------
# 7.2 Actor populated from X-User header on update
# ---------------------------------------------------------------------------

class TestActorFromXUserOnUpdate:
    async def test_actor_matches_x_user_header(
        self, gql_client: AsyncClient, db, seeded_project
    ):
        """Given the X-User header is 'bob@test.com' during an update,
        when updating an issue,
        then the HistoryEntry's actor field is 'bob@test.com'."""
        # Given
        issue_repo = IssueRepository(db)
        issue = await issue_repo.create(
            project_id=seeded_project.id, title="For update", creator="alice@test.com"
        )

        # When
        response = await gql_client.post(
            "/graphql",
            json={
                "query": """
                    mutation($id: String!, $state: String) {
                        updateIssue(identifier: $id, state: $state) {
                            history { actor field }
                        }
                    }
                """,
                "variables": {"id": issue.identifier, "state": "Done"},
            },
            headers={"X-User": "bob@test.com"},
        )

        # Then
        data = response.json()
        assert "errors" not in data
        history = data["data"]["updateIssue"]["history"]
        state_entry = next(h for h in history if h["field"] == "state")
        assert state_entry["actor"] == "bob@test.com"


# ---------------------------------------------------------------------------
# 7.3 Comment author populated from X-User header
# ---------------------------------------------------------------------------

class TestCommentAuthorFromXUser:
    async def test_comment_author_matches_x_user_header(
        self, gql_client: AsyncClient, db, seeded_project
    ):
        """Given the X-User header is 'carol@test.com',
        when adding a comment,
        then the comment's author field is 'carol@test.com'."""
        # Given
        issue_repo = IssueRepository(db)
        issue = await issue_repo.create(
            project_id=seeded_project.id, title="Commentable", creator="alice@test.com"
        )

        # When
        response = await gql_client.post(
            "/graphql",
            json={
                "query": """
                    mutation($issueId: String!, $body: String!) {
                        addComment(issueIdentifier: $issueId, body: $body) {
                            author
                        }
                    }
                """,
                "variables": {"issueId": issue.identifier, "body": "Hello"},
            },
            headers={"X-User": "carol@test.com"},
        )

        # Then
        data = response.json()
        assert "errors" not in data
        assert data["data"]["addComment"]["author"] == "carol@test.com"


# ---------------------------------------------------------------------------
# 7.4 Missing X-User header
# ---------------------------------------------------------------------------

class TestMissingXUser:
    async def test_missing_header_returns_error(
        self, gql_client: AsyncClient, db, seeded_project
    ):
        """Given no X-User header is sent,
        when sending a mutation,
        then a clear error indicating the header is required is returned."""
        # Given
        issue_repo = IssueRepository(db)
        issue = await issue_repo.create(
            project_id=seeded_project.id, title="No auth", creator="system"
        )

        # When — no X-User header
        response = await gql_client.post(
            "/graphql",
            json={
                "query": """
                    mutation($id: String!, $state: String) {
                        updateIssue(identifier: $id, state: $state) {
                            identifier
                        }
                    }
                """,
                "variables": {"id": issue.identifier, "state": "Done"},
            },
        )

        # Then
        data = response.json()
        assert "errors" in data
        assert any("x-user" in e["message"].lower() for e in data["errors"])
