"""Tests for Issue Update & History Tracking — TDD Red Phase."""

from __future__ import annotations

import pytest

from wedge.errors import NotFoundError, ValidationError
from wedge.models import Issue, IssueState, Priority
from wedge.repository.issue_repository import IssueRepository


# ---------------------------------------------------------------------------
# 3.1 Update title
# ---------------------------------------------------------------------------

class TestUpdateTitle:
    async def test_update_title_creates_history_entry(
        self, issue_repo: IssueRepository, sample_issue: Issue
    ):
        """Given an existing issue,
        when updating its title,
        then the returned issue has the new title and a HistoryEntry
        with field='title', fromValue=old title, toValue=new title."""
        # When
        updated = await issue_repo.update(
            identifier=sample_issue.identifier,
            actor="editor@test.com",
            title="Updated Title",
        )

        # Then
        assert updated.title == "Updated Title"
        assert len(updated.history) >= 1
        entry = next(h for h in updated.history if h.field == "title")
        assert entry.from_value == "First issue"
        assert entry.to_value == "Updated Title"
        assert entry.actor == "editor@test.com"
        assert entry.timestamp is not None


# ---------------------------------------------------------------------------
# 3.2 Update state
# ---------------------------------------------------------------------------

class TestUpdateState:
    async def test_update_state_creates_history_entry(
        self, issue_repo: IssueRepository, sample_issue: Issue
    ):
        """Given an existing issue in Backlog state,
        when updating state to In Progress,
        then the history records the state change."""
        # When
        updated = await issue_repo.update(
            identifier=sample_issue.identifier,
            actor="editor@test.com",
            state="In Progress",
        )

        # Then
        assert updated.state == IssueState.IN_PROGRESS
        entry = next(h for h in updated.history if h.field == "state")
        assert entry.from_value == "Backlog"
        assert entry.to_value == "In Progress"


# ---------------------------------------------------------------------------
# 3.3 Update priority
# ---------------------------------------------------------------------------

class TestUpdatePriority:
    async def test_update_priority_creates_history_entry(
        self, issue_repo: IssueRepository, sample_issue: Issue
    ):
        """Given an existing issue with priority none,
        when updating priority to high,
        then the history records the priority change."""
        # When
        updated = await issue_repo.update(
            identifier=sample_issue.identifier,
            actor="editor@test.com",
            priority="high",
        )

        # Then
        assert updated.priority == Priority.HIGH
        entry = next(h for h in updated.history if h.field == "priority")
        assert entry.from_value == "none"
        assert entry.to_value == "high"


# ---------------------------------------------------------------------------
# 3.4 Update assignee
# ---------------------------------------------------------------------------

class TestUpdateAssignee:
    async def test_update_assignee_creates_history_entry(
        self, issue_repo: IssueRepository, sample_issue: Issue
    ):
        """Given an existing issue with no assignee,
        when updating assignee to bob@test.com,
        then the history records the assignee change."""
        # When
        updated = await issue_repo.update(
            identifier=sample_issue.identifier,
            actor="editor@test.com",
            assignee="bob@test.com",
        )

        # Then
        assert updated.assignee == "bob@test.com"
        entry = next(h for h in updated.history if h.field == "assignee")
        assert entry.from_value is None
        assert entry.to_value == "bob@test.com"


# ---------------------------------------------------------------------------
# 3.5 Update labels
# ---------------------------------------------------------------------------

class TestUpdateLabels:
    async def test_update_labels_creates_history_entry(
        self, issue_repo: IssueRepository, sample_issue: Issue
    ):
        """Given an existing issue with no labels,
        when updating labels to ['bug', 'frontend'],
        then the history records the labels change."""
        # When
        updated = await issue_repo.update(
            identifier=sample_issue.identifier,
            actor="editor@test.com",
            labels=["bug", "frontend"],
        )

        # Then
        assert updated.labels == ["bug", "frontend"]
        entry = next(h for h in updated.history if h.field == "labels")
        assert entry.to_value is not None


# ---------------------------------------------------------------------------
# 3.6 Update description
# ---------------------------------------------------------------------------

class TestUpdateDescription:
    async def test_update_description_creates_history_entry(
        self, issue_repo: IssueRepository, sample_issue: Issue
    ):
        """Given an existing issue with no description,
        when updating description,
        then the history records the description change."""
        # When
        updated = await issue_repo.update(
            identifier=sample_issue.identifier,
            actor="editor@test.com",
            description="New detailed description",
        )

        # Then
        assert updated.description == "New detailed description"
        entry = next(h for h in updated.history if h.field == "description")
        assert entry.to_value == "New detailed description"


# ---------------------------------------------------------------------------
# 3.7 Update multiple fields at once
# ---------------------------------------------------------------------------

class TestUpdateMultipleFields:
    async def test_multiple_field_update_creates_multiple_history_entries(
        self, issue_repo: IssueRepository, sample_issue: Issue
    ):
        """Given an existing issue,
        when updating title and state in a single call,
        then two separate HistoryEntry records are created."""
        # When
        updated = await issue_repo.update(
            identifier=sample_issue.identifier,
            actor="editor@test.com",
            title="New Title",
            state="Done",
        )

        # Then
        assert updated.title == "New Title"
        assert updated.state == IssueState.DONE
        history_fields = [h.field for h in updated.history]
        assert "title" in history_fields
        assert "state" in history_fields
        assert len(updated.history) >= 2


# ---------------------------------------------------------------------------
# 3.8 Update with no actual change
# ---------------------------------------------------------------------------

class TestUpdateNoChange:
    async def test_same_value_does_not_create_history_entry(
        self, issue_repo: IssueRepository, sample_issue: Issue
    ):
        """Given an existing issue with title 'First issue',
        when updating title to the same value,
        then no HistoryEntry is created."""
        # When
        updated = await issue_repo.update(
            identifier=sample_issue.identifier,
            actor="editor@test.com",
            title="First issue",  # same as current
        )

        # Then
        title_entries = [h for h in updated.history if h.field == "title"]
        assert len(title_entries) == 0


# ---------------------------------------------------------------------------
# 3.9 Update — invalid state value
# ---------------------------------------------------------------------------

class TestUpdateInvalidState:
    async def test_invalid_state_raises_validation_error(
        self, issue_repo: IssueRepository, sample_issue: Issue
    ):
        """Given an existing issue,
        when updating state to an invalid value,
        then a ValidationError is raised and the issue is not modified."""
        # When / Then
        with pytest.raises(ValidationError):
            await issue_repo.update(
                identifier=sample_issue.identifier,
                actor="editor@test.com",
                state="InvalidState",
            )

        # Verify not modified
        current = await issue_repo.get_by_identifier(sample_issue.identifier)
        assert current.state == IssueState.BACKLOG


# ---------------------------------------------------------------------------
# 3.10 Update — invalid priority value
# ---------------------------------------------------------------------------

class TestUpdateInvalidPriority:
    async def test_invalid_priority_raises_validation_error(
        self, issue_repo: IssueRepository, sample_issue: Issue
    ):
        """Given an existing issue,
        when updating priority to an invalid value,
        then a ValidationError is raised."""
        with pytest.raises(ValidationError):
            await issue_repo.update(
                identifier=sample_issue.identifier,
                actor="editor@test.com",
                priority="critical",
            )


# ---------------------------------------------------------------------------
# 3.11 Update — non-existent issue
# ---------------------------------------------------------------------------

class TestUpdateNonExistent:
    async def test_update_nonexistent_raises_not_found(self, issue_repo: IssueRepository):
        """Given no issue with the given identifier exists,
        when updating,
        then a NotFoundError is raised."""
        with pytest.raises(NotFoundError):
            await issue_repo.update(
                identifier="NOPE-999",
                actor="editor@test.com",
                title="Does not matter",
            )


# ---------------------------------------------------------------------------
# 3.12 updatedAt is refreshed on update
# ---------------------------------------------------------------------------

class TestUpdatedAtRefreshed:
    async def test_updated_at_changes_after_update(
        self, issue_repo: IssueRepository, sample_issue: Issue
    ):
        """Given an existing issue,
        when updating any field,
        then updatedAt is more recent than createdAt."""
        # When
        updated = await issue_repo.update(
            identifier=sample_issue.identifier,
            actor="editor@test.com",
            title="Changed",
        )

        # Then
        assert updated.updated_at >= updated.created_at
