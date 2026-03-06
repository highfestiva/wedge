"""Tests for GraphQL Query Resolvers — TDD Red Phase."""

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


@pytest.fixture
async def seeded_data(db):
    """Seed a project and a few issues for query tests."""
    project_repo = ProjectRepository(db)
    issue_repo = IssueRepository(db)

    project = await project_repo.create(name="Wedge", prefix="WDG")
    i1 = await issue_repo.create(
        project_id=project.id, title="First", creator="alice@test.com", state="Todo",
        assignee="alice@test.com",
    )
    i2 = await issue_repo.create(
        project_id=project.id, title="Second", creator="bob@test.com", state="In Progress",
        assignee="bob@test.com",
    )
    i3 = await issue_repo.create(
        project_id=project.id, title="Third", creator="alice@test.com", state="Todo",
    )
    return {"project": project, "issues": [i1, i2, i3]}


# ---------------------------------------------------------------------------
# 5.1 Query `projects`
# ---------------------------------------------------------------------------

class TestQueryProjects:
    async def test_projects_query_returns_all(self, gql_client: AsyncClient, seeded_data):
        """Given projects exist,
        when sending a projects GraphQL query,
        then all projects with expected fields are returned."""
        # When
        response = await gql_client.post(
            "/graphql",
            json={
                "query": """
                    query {
                        projects {
                            id
                            name
                            prefix
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
        projects = data["data"]["projects"]
        assert len(projects) >= 1
        assert projects[0]["name"] == "Wedge"
        assert projects[0]["prefix"] == "WDG"


# ---------------------------------------------------------------------------
# 5.2 Query `issue` by identifier
# ---------------------------------------------------------------------------

class TestQueryIssueByIdentifier:
    async def test_issue_query_returns_full_issue(self, gql_client: AsyncClient, seeded_data):
        """Given an issue exists,
        when sending an issue query by identifier,
        then the matching issue with all nested fields is returned."""
        # When
        response = await gql_client.post(
            "/graphql",
            json={
                "query": """
                    query($id: String!) {
                        issue(identifier: $id) {
                            identifier
                            title
                            state
                            priority
                            creator
                            comments { id body author }
                            history { id field fromValue toValue actor }
                        }
                    }
                """,
                "variables": {"id": "WDG-1"},
            },
            headers={"X-User": "admin@test.com"},
        )

        # Then
        assert response.status_code == 200
        data = response.json()
        assert "errors" not in data
        issue = data["data"]["issue"]
        assert issue["identifier"] == "WDG-1"
        assert issue["title"] == "First"


# ---------------------------------------------------------------------------
# 5.3 Query `issue` — not found
# ---------------------------------------------------------------------------

class TestQueryIssueNotFound:
    async def test_nonexistent_identifier_returns_error(self, gql_client: AsyncClient, seeded_data):
        """Given no issue with identifier 'WDG-999' exists,
        when sending an issue query,
        then a GraphQL error with 'not found' message is returned."""
        # When
        response = await gql_client.post(
            "/graphql",
            json={
                "query": """
                    query {
                        issue(identifier: "WDG-999") {
                            identifier
                            title
                        }
                    }
                """
            },
            headers={"X-User": "admin@test.com"},
        )

        # Then
        assert response.status_code == 200
        data = response.json()
        assert "errors" in data
        assert "not found" in data["errors"][0]["message"].lower()


# ---------------------------------------------------------------------------
# 5.4 Query `issues` — with filters
# ---------------------------------------------------------------------------

class TestQueryIssuesWithFilters:
    async def test_issues_filtered_by_state_and_assignee(
        self, gql_client: AsyncClient, seeded_data
    ):
        """Given issues in different states/assignees,
        when sending an issues query with state and assignee filters,
        then only matching issues are returned."""
        project_id = seeded_data["project"].id

        # When
        response = await gql_client.post(
            "/graphql",
            json={
                "query": """
                    query($pid: String!, $state: String, $assignee: String) {
                        issues(projectId: $pid, state: $state, assignee: $assignee) {
                            items { identifier title state assignee }
                            cursor
                        }
                    }
                """,
                "variables": {
                    "pid": project_id,
                    "state": "Todo",
                    "assignee": "alice@test.com",
                },
            },
            headers={"X-User": "admin@test.com"},
        )

        # Then
        assert response.status_code == 200
        data = response.json()
        assert "errors" not in data
        items = data["data"]["issues"]["items"]
        assert len(items) == 1
        assert items[0]["title"] == "First"


# ---------------------------------------------------------------------------
# 5.5 Query `issues` — pagination
# ---------------------------------------------------------------------------

class TestQueryIssuesPagination:
    async def test_cursor_based_pagination_via_graphql(
        self, gql_client: AsyncClient, seeded_data
    ):
        """Given 3 issues exist,
        when requesting first 2 via issues query,
        then 2 issues and a cursor are returned;
        using the cursor returns the remaining issue."""
        project_id = seeded_data["project"].id
        query = """
            query($pid: String!, $first: Int, $after: String) {
                issues(projectId: $pid, first: $first, after: $after) {
                    items { identifier title }
                    cursor
                }
            }
        """

        # Page 1
        r1 = await gql_client.post(
            "/graphql",
            json={"query": query, "variables": {"pid": project_id, "first": 2}},
            headers={"X-User": "admin@test.com"},
        )
        d1 = r1.json()["data"]["issues"]
        assert len(d1["items"]) == 2
        assert d1["cursor"] is not None

        # Page 2
        r2 = await gql_client.post(
            "/graphql",
            json={"query": query, "variables": {"pid": project_id, "first": 2, "after": d1["cursor"]}},
            headers={"X-User": "admin@test.com"},
        )
        d2 = r2.json()["data"]["issues"]
        assert len(d2["items"]) == 1
