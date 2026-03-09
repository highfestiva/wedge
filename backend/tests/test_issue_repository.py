"""Tests for IssueRepository — TDD Red Phase."""

from __future__ import annotations

import asyncio

import pytest

from wedge.errors import NotFoundError, ValidationError
from wedge.models import Issue, IssueState, Priority
from wedge.repository.issue_repository import IssueRepository
from wedge.repository.project_repository import ProjectRepository


# ---------------------------------------------------------------------------
# 2.1 Create an issue with required fields only
# ---------------------------------------------------------------------------

class TestCreateIssueDefaults:
    async def test_create_issue_returns_defaults(
        self, issue_repo: IssueRepository, sample_project
    ):
        """Given a project exists,
        when creating an issue with only required fields,
        then the issue has auto-generated identifier, default state Backlog,
        default priority none, auto-generated url, createdAt, updatedAt."""
        # When
        issue = await issue_repo.create(
            project_id=sample_project.id,
            title="My first issue",
            creator="alice@test.com",
        )

        # Then
        assert isinstance(issue, Issue)
        assert issue.identifier.startswith("WDG-")
        assert issue.title == "My first issue"
        assert issue.state == IssueState.BACKLOG
        assert issue.priority == Priority.NONE
        assert issue.creator == "alice@test.com"
        assert issue.url is not None
        assert issue.created_at is not None
        assert issue.updated_at is not None


# ---------------------------------------------------------------------------
# 2.2 Create an issue with all optional fields
# ---------------------------------------------------------------------------

class TestCreateIssueAllFields:
    async def test_create_issue_with_optional_fields(
        self, issue_repo: IssueRepository, sample_project
    ):
        """Given a project exists,
        when creating an issue with all optional fields,
        then all fields are set correctly."""
        # When
        issue = await issue_repo.create(
            project_id=sample_project.id,
            title="Full issue",
            creator="alice@test.com",
            description="Detailed description",
            state="In Progress",
            priority="high",
            labels=["bug", "urgent"],
            assignee="bob@test.com",
        )

        # Then
        assert issue.description == "Detailed description"
        assert issue.state == IssueState.IN_PROGRESS
        assert issue.priority == Priority.HIGH
        assert issue.labels == ["bug", "urgent"]
        assert issue.assignee == "bob@test.com"


# ---------------------------------------------------------------------------
# 2.3 Identifier generation — sequential within a project
# ---------------------------------------------------------------------------

class TestIdentifierSequential:
    async def test_sequential_identifiers(
        self, issue_repo: IssueRepository, sample_project
    ):
        """Given a project with prefix WDG,
        when creating three issues sequentially,
        then identifiers are WDG-1, WDG-2, WDG-3."""
        # When
        i1 = await issue_repo.create(project_id=sample_project.id, title="One", creator="a@test.com")
        i2 = await issue_repo.create(project_id=sample_project.id, title="Two", creator="a@test.com")
        i3 = await issue_repo.create(project_id=sample_project.id, title="Three", creator="a@test.com")

        # Then
        assert i1.identifier == "WDG-1"
        assert i2.identifier == "WDG-2"
        assert i3.identifier == "WDG-3"


# ---------------------------------------------------------------------------
# 2.4 Identifier generation — independent across projects
# ---------------------------------------------------------------------------

class TestIdentifierIndependentProjects:
    async def test_independent_counters_per_project(
        self, issue_repo: IssueRepository, project_repo: ProjectRepository
    ):
        """Given two projects with different prefixes,
        when creating issues in both,
        then counters are independent."""
        # Given
        proj_a = await project_repo.create(name="Alpha", prefix="ALP")
        proj_b = await project_repo.create(name="Beta", prefix="BET")

        # When
        a1 = await issue_repo.create(project_id=proj_a.id, title="A-1", creator="a@test.com")
        b1 = await issue_repo.create(project_id=proj_b.id, title="B-1", creator="a@test.com")
        a2 = await issue_repo.create(project_id=proj_a.id, title="A-2", creator="a@test.com")

        # Then
        assert a1.identifier == "ALP-1"
        assert b1.identifier == "BET-1"
        assert a2.identifier == "ALP-2"


# ---------------------------------------------------------------------------
# 2.5 Identifier generation — atomicity
# ---------------------------------------------------------------------------

class TestIdentifierAtomicity:
    async def test_concurrent_creation_no_duplicate_identifiers(
        self, issue_repo: IssueRepository, sample_project
    ):
        """Given concurrent issue creation in the same project,
        when multiple issues are created simultaneously,
        then no duplicate identifiers are produced."""
        # When
        tasks = [
            issue_repo.create(project_id=sample_project.id, title=f"Issue-{i}", creator="a@test.com")
            for i in range(10)
        ]
        issues = await asyncio.gather(*tasks)

        # Then
        identifiers = [issue.identifier for issue in issues]
        assert len(identifiers) == len(set(identifiers)), "Duplicate identifiers found!"


# ---------------------------------------------------------------------------
# 2.6 Create an issue — invalid project
# ---------------------------------------------------------------------------

class TestCreateIssueInvalidProject:
    async def test_nonexistent_project_raises_not_found(self, issue_repo: IssueRepository):
        """Given a non-existent project id,
        when creating an issue,
        then a NotFoundError is raised."""
        with pytest.raises(NotFoundError):
            await issue_repo.create(
                project_id="nonexistent_id",
                title="Orphan",
                creator="a@test.com",
            )


# ---------------------------------------------------------------------------
# 2.7 Create an issue — invalid state value
# ---------------------------------------------------------------------------

class TestCreateIssueInvalidState:
    async def test_invalid_state_raises_validation_error(
        self, issue_repo: IssueRepository, sample_project
    ):
        """Given an invalid state value,
        when creating an issue,
        then a ValidationError is raised."""
        with pytest.raises(ValidationError):
            await issue_repo.create(
                project_id=sample_project.id,
                title="Bad state",
                creator="a@test.com",
                state="InvalidState",
            )


# ---------------------------------------------------------------------------
# 2.8 Create an issue — invalid priority value
# ---------------------------------------------------------------------------

class TestCreateIssueInvalidPriority:
    async def test_invalid_priority_raises_validation_error(
        self, issue_repo: IssueRepository, sample_project
    ):
        """Given an invalid priority value,
        when creating an issue,
        then a ValidationError is raised."""
        with pytest.raises(ValidationError):
            await issue_repo.create(
                project_id=sample_project.id,
                title="Bad priority",
                creator="a@test.com",
                priority="critical",
            )


# ---------------------------------------------------------------------------
# 2.9 Fetch a single issue by identifier
# ---------------------------------------------------------------------------

class TestFetchIssueByIdentifier:
    async def test_fetch_returns_complete_issue(
        self, issue_repo: IssueRepository, sample_project
    ):
        """Given an issue exists,
        when fetching by its identifier,
        then the complete issue with all fields is returned."""
        # Given
        created = await issue_repo.create(
            project_id=sample_project.id, title="Fetchable", creator="a@test.com"
        )

        # When
        fetched = await issue_repo.get_by_identifier(created.identifier)

        # Then
        assert fetched.identifier == created.identifier
        assert fetched.title == "Fetchable"
        assert fetched.id == created.id


# ---------------------------------------------------------------------------
# 2.10 Fetch an issue — not found
# ---------------------------------------------------------------------------

class TestFetchIssueNotFound:
    async def test_nonexistent_identifier_raises_not_found(self, issue_repo: IssueRepository):
        """Given no issue with identifier 'NOPE-999' exists,
        when fetching by that identifier,
        then a NotFoundError is raised."""
        with pytest.raises(NotFoundError):
            await issue_repo.get_by_identifier("NOPE-999")


# ---------------------------------------------------------------------------
# 2.11 List issues — filter by project
# ---------------------------------------------------------------------------

class TestListIssuesFilterByProject:
    async def test_filter_returns_only_project_issues(
        self, issue_repo: IssueRepository, project_repo: ProjectRepository
    ):
        """Given issues in two different projects,
        when listing issues for one project,
        then only that project's issues are returned."""
        # Given
        proj_a = await project_repo.create(name="A", prefix="AAA")
        proj_b = await project_repo.create(name="B", prefix="BBB")
        await issue_repo.create(project_id=proj_a.id, title="A-issue", creator="a@test.com")
        await issue_repo.create(project_id=proj_b.id, title="B-issue", creator="a@test.com")

        # When
        result = await issue_repo.list_issues(project_id=proj_a.id)

        # Then
        assert len(result.items) == 1
        assert result.items[0].title == "A-issue"


# ---------------------------------------------------------------------------
# 2.12 List issues — filter by state
# ---------------------------------------------------------------------------

class TestListIssuesFilterByState:
    async def test_filter_by_state(self, issue_repo: IssueRepository, sample_project):
        """Given issues in different states,
        when listing with a state filter,
        then only matching issues are returned."""
        # Given
        await issue_repo.create(
            project_id=sample_project.id, title="Todo item", creator="a@test.com", state="Todo"
        )
        await issue_repo.create(
            project_id=sample_project.id, title="Backlog item", creator="a@test.com"
        )

        # When
        result = await issue_repo.list_issues(project_id=sample_project.id, state="Todo")

        # Then
        assert len(result.items) == 1
        assert result.items[0].title == "Todo item"


# ---------------------------------------------------------------------------
# 2.13 List issues — filter by assignee
# ---------------------------------------------------------------------------

class TestListIssuesFilterByAssignee:
    async def test_filter_by_assignee(self, issue_repo: IssueRepository, sample_project):
        """Given issues with different assignees,
        when listing with an assignee filter,
        then only matching issues are returned."""
        # Given
        await issue_repo.create(
            project_id=sample_project.id, title="Alice's issue", creator="a@test.com",
            assignee="alice@test.com",
        )
        await issue_repo.create(
            project_id=sample_project.id, title="Bob's issue", creator="a@test.com",
            assignee="bob@test.com",
        )

        # When
        result = await issue_repo.list_issues(project_id=sample_project.id, assignee="alice@test.com")

        # Then
        assert len(result.items) == 1
        assert result.items[0].title == "Alice's issue"


# ---------------------------------------------------------------------------
# 2.14 List issues — filter by label
# ---------------------------------------------------------------------------

class TestListIssuesFilterByLabel:
    async def test_filter_by_label(self, issue_repo: IssueRepository, sample_project):
        """Given issues with different labels,
        when listing with a label filter,
        then only issues containing that label are returned."""
        # Given
        await issue_repo.create(
            project_id=sample_project.id, title="Bug", creator="a@test.com", labels=["bug"]
        )
        await issue_repo.create(
            project_id=sample_project.id, title="Feature", creator="a@test.com", labels=["feature"]
        )

        # When
        result = await issue_repo.list_issues(project_id=sample_project.id, label="bug")

        # Then
        assert len(result.items) == 1
        assert result.items[0].title == "Bug"


# ---------------------------------------------------------------------------
# 2.15 List issues — combined filters
# ---------------------------------------------------------------------------

class TestListIssuesCombinedFilters:
    async def test_combined_state_and_assignee_filter(
        self, issue_repo: IssueRepository, sample_project
    ):
        """Given issues with various states and assignees,
        when listing with both state and assignee filters,
        then only issues matching all criteria are returned."""
        # Given
        await issue_repo.create(
            project_id=sample_project.id, title="Match", creator="a@test.com",
            state="Todo", assignee="alice@test.com",
        )
        await issue_repo.create(
            project_id=sample_project.id, title="Wrong state", creator="a@test.com",
            state="In Progress", assignee="alice@test.com",
        )
        await issue_repo.create(
            project_id=sample_project.id, title="Wrong assignee", creator="a@test.com",
            state="Todo", assignee="bob@test.com",
        )

        # When
        result = await issue_repo.list_issues(
            project_id=sample_project.id, state="Todo", assignee="alice@test.com"
        )

        # Then
        assert len(result.items) == 1
        assert result.items[0].title == "Match"


# ---------------------------------------------------------------------------
# 2.16 List issues — pagination (cursor-based)
# ---------------------------------------------------------------------------

class TestListIssuesPagination:
    async def test_cursor_based_pagination(self, issue_repo: IssueRepository, sample_project):
        """Given 5 issues exist,
        when requesting first 2,
        then 2 issues and a cursor are returned;
        using the cursor returns the next 2."""
        # Given
        for i in range(5):
            await issue_repo.create(
                project_id=sample_project.id, title=f"Issue-{i}", creator="a@test.com"
            )

        # When — page 1
        page1 = await issue_repo.list_issues(project_id=sample_project.id, first=2)

        # Then
        assert len(page1.items) == 2
        assert page1.cursor is not None

        # When — page 2
        page2 = await issue_repo.list_issues(
            project_id=sample_project.id, first=2, after=page1.cursor
        )

        # Then
        assert len(page2.items) == 2
        # No overlap
        page1_ids = {i.identifier for i in page1.items}
        page2_ids = {i.identifier for i in page2.items}
        assert page1_ids.isdisjoint(page2_ids)


# ---------------------------------------------------------------------------
# 2.17 List issues — empty result
# ---------------------------------------------------------------------------

class TestListIssuesEmpty:
    async def test_empty_project_returns_empty_list(
        self, issue_repo: IssueRepository, sample_project
    ):
        """Given a project with no issues,
        when listing issues,
        then an empty list is returned."""
        # When
        result = await issue_repo.list_issues(project_id=sample_project.id)

        # Then
        assert result.items == []
        assert result.cursor is None


# ---------------------------------------------------------------------------
# 2.18 Delete an issue
# ---------------------------------------------------------------------------

class TestDeleteIssue:
    async def test_delete_removes_issue(self, issue_repo: IssueRepository, sample_project):
        """Given an issue exists,
        when deleting by identifier,
        then a subsequent fetch raises NotFoundError."""
        # Given
        issue = await issue_repo.create(
            project_id=sample_project.id, title="To delete", creator="a@test.com"
        )

        # When
        result = await issue_repo.delete(issue.identifier)

        # Then
        assert result is True
        with pytest.raises(NotFoundError):
            await issue_repo.get_by_identifier(issue.identifier)


# ---------------------------------------------------------------------------
# 2.19 Delete an issue — not found
# ---------------------------------------------------------------------------

class TestDeleteIssueNotFound:
    async def test_delete_nonexistent_raises_not_found(self, issue_repo: IssueRepository):
        """Given no issue with the given identifier exists,
        when deleting,
        then a NotFoundError is raised."""
        with pytest.raises(NotFoundError):
            await issue_repo.delete("NOPE-999")


# ===========================================================================
# Sort Order — New Feature Tests
# ===========================================================================


# ---------------------------------------------------------------------------
# 1.1 Issue dataclass has sort_order attribute with default 0.0
# ---------------------------------------------------------------------------

class TestIssueSortOrderDefault:
    async def test_issue_model_has_sort_order_default(self, issue_repo: IssueRepository, sample_project):
        """Given an issue is created without explicit sort_order,
        when inspecting the issue,
        then sort_order attribute exists and equals 0.0."""
        # When
        issue = await issue_repo.create(
            project_id=sample_project.id,
            title="Default sort order",
            creator="alice@test.com",
        )

        # Then
        assert hasattr(issue, "sort_order")
        assert issue.sort_order == 4.0  # priority NONE defaults to 4.0


# ---------------------------------------------------------------------------
# 2.1 Create issue without explicit sort_order assigns priority-based default
# ---------------------------------------------------------------------------

class TestCreateIssueSortOrderPriorityDefault:
    @pytest.mark.parametrize(
        "priority, expected_sort_order",
        [
            ("urgent", 0.0),
            ("high", 1.0),
            ("medium", 2.0),
            ("low", 3.0),
            ("none", 4.0),
        ],
    )
    async def test_priority_based_sort_order_default(
        self, issue_repo: IssueRepository, sample_project, priority, expected_sort_order
    ):
        """Given an issue is created with a specific priority and no sort_order,
        when the issue is created,
        then sort_order is derived from the priority."""
        # When
        issue = await issue_repo.create(
            project_id=sample_project.id,
            title=f"Issue with {priority}",
            creator="alice@test.com",
            priority=priority,
        )

        # Then
        assert issue.sort_order == expected_sort_order


# ---------------------------------------------------------------------------
# 2.2 Create issue with explicit sort_order uses provided value
# ---------------------------------------------------------------------------

class TestCreateIssueExplicitSortOrder:
    async def test_explicit_sort_order_used(self, issue_repo: IssueRepository, sample_project):
        """Given a sort_order of 7.5 is provided,
        when creating an issue,
        then the returned issue has sort_order == 7.5."""
        # When
        issue = await issue_repo.create(
            project_id=sample_project.id,
            title="Explicit sort order",
            creator="alice@test.com",
            sort_order=7.5,
        )

        # Then
        assert issue.sort_order == 7.5


# ---------------------------------------------------------------------------
# 2.3 Created issue sort_order is persisted in MongoDB
# ---------------------------------------------------------------------------

class TestCreateIssueSortOrderPersisted:
    async def test_sort_order_round_trips(self, issue_repo: IssueRepository, sample_project):
        """Given an issue is created with sort_order=3.14,
        when fetching it back by identifier,
        then sort_order is 3.14."""
        # Given
        created = await issue_repo.create(
            project_id=sample_project.id,
            title="Persisted sort order",
            creator="alice@test.com",
            sort_order=3.14,
        )

        # When
        fetched = await issue_repo.get_by_identifier(created.identifier)

        # Then
        assert fetched.sort_order == 3.14


# ---------------------------------------------------------------------------
# 3.1 list_issues returns issues sorted by sort_order ascending
# ---------------------------------------------------------------------------

class TestListIssuesSortedBySortOrder:
    async def test_list_issues_ordered_by_sort_order(
        self, issue_repo: IssueRepository, sample_project
    ):
        """Given three issues with sort_order 3.0, 1.0, 2.0,
        when listing issues,
        then they are returned in order 1.0, 2.0, 3.0."""
        # Given
        await issue_repo.create(
            project_id=sample_project.id, title="Third", creator="a@test.com", sort_order=3.0
        )
        await issue_repo.create(
            project_id=sample_project.id, title="First", creator="a@test.com", sort_order=1.0
        )
        await issue_repo.create(
            project_id=sample_project.id, title="Second", creator="a@test.com", sort_order=2.0
        )

        # When
        result = await issue_repo.list_issues(project_id=sample_project.id)

        # Then
        sort_orders = [i.sort_order for i in result.items]
        assert sort_orders == [1.0, 2.0, 3.0]


# ---------------------------------------------------------------------------
# 3.2 Issues with same sort_order are sub-sorted by _id (stable order)
# ---------------------------------------------------------------------------

class TestListIssuesSortOrderTieBreaker:
    async def test_same_sort_order_stable_by_id(
        self, issue_repo: IssueRepository, sample_project
    ):
        """Given two issues with identical sort_order=5.0,
        when listing issues,
        then both are returned in consistent _id ascending order."""
        # Given
        i1 = await issue_repo.create(
            project_id=sample_project.id, title="A", creator="a@test.com", sort_order=5.0
        )
        i2 = await issue_repo.create(
            project_id=sample_project.id, title="B", creator="a@test.com", sort_order=5.0
        )

        # When
        result = await issue_repo.list_issues(project_id=sample_project.id)

        # Then
        assert len(result.items) == 2
        ids = [i.id for i in result.items]
        assert ids == sorted(ids)


# ---------------------------------------------------------------------------
# 3.3 list_issues pagination still works with sort_order-based ordering
# ---------------------------------------------------------------------------

class TestListIssuesPaginationWithSortOrder:
    async def test_pagination_respects_sort_order(
        self, issue_repo: IssueRepository, sample_project
    ):
        """Given 5 issues with sort_order 5.0, 3.0, 1.0, 4.0, 2.0,
        when requesting first=2,
        then the first page has sort_order 1.0, 2.0
        and the next page has sort_order 3.0, 4.0."""
        # Given
        for so in [5.0, 3.0, 1.0, 4.0, 2.0]:
            await issue_repo.create(
                project_id=sample_project.id,
                title=f"Issue-{so}",
                creator="a@test.com",
                sort_order=so,
            )

        # When — page 1
        page1 = await issue_repo.list_issues(project_id=sample_project.id, first=2)

        # Then
        assert len(page1.items) == 2
        assert page1.items[0].sort_order == 1.0
        assert page1.items[1].sort_order == 2.0
        assert page1.cursor is not None

        # When — page 2
        page2 = await issue_repo.list_issues(
            project_id=sample_project.id, first=2, after=page1.cursor
        )

        # Then
        assert len(page2.items) == 2
        assert page2.items[0].sort_order == 3.0
        assert page2.items[1].sort_order == 4.0


# ---------------------------------------------------------------------------
# 3.4 list_issues with filters still respects sort_order ordering
# ---------------------------------------------------------------------------

class TestListIssuesFilteredSortOrder:
    async def test_filtered_results_sorted_by_sort_order(
        self, issue_repo: IssueRepository, sample_project
    ):
        """Given issues with different states and sort orders,
        when filtering by state,
        then filtered results are sorted by sort_order ascending."""
        # Given
        await issue_repo.create(
            project_id=sample_project.id, title="Todo-High", creator="a@test.com",
            state="Todo", sort_order=5.0,
        )
        await issue_repo.create(
            project_id=sample_project.id, title="Todo-Low", creator="a@test.com",
            state="Todo", sort_order=1.0,
        )
        await issue_repo.create(
            project_id=sample_project.id, title="Backlog", creator="a@test.com",
            state="Backlog", sort_order=0.0,
        )

        # When
        result = await issue_repo.list_issues(project_id=sample_project.id, state="Todo")

        # Then
        assert len(result.items) == 2
        assert result.items[0].sort_order == 1.0
        assert result.items[1].sort_order == 5.0


# ---------------------------------------------------------------------------
# 5.1 _to_model defaults sort_order to 0.0 for documents missing the field
# ---------------------------------------------------------------------------

class TestBackwardCompatibilitySortOrder:
    async def test_missing_sort_order_field_defaults_to_zero(
        self, issue_repo: IssueRepository, sample_project
    ):
        """Given a MongoDB document without a sort_order field,
        when fetching via get_by_identifier,
        then the Issue has sort_order == 0.0."""
        # Given — insert a raw document without sort_order
        from bson import ObjectId
        from datetime import datetime, timezone

        now = datetime.now(timezone.utc)
        raw_doc = {
            "_id": ObjectId(),
            "identifier": "WDG-999",
            "title": "Legacy issue",
            "state": "Backlog",
            "priority": "none",
            "creator": "legacy@test.com",
            "project": sample_project.id,
            "url": "/issue/WDG-999",
            "created_at": now,
            "updated_at": now,
            "description": None,
            "assignee": None,
            "labels": [],
            "comments": [],
            "history": [],
        }
        await issue_repo._collection.insert_one(raw_doc)

        # When
        fetched = await issue_repo.get_by_identifier("WDG-999")

        # Then
        assert fetched.sort_order == 0.0
