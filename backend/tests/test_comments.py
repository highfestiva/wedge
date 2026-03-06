"""Tests for Comments — TDD Red Phase."""

from __future__ import annotations

import pytest

from wedge.errors import NotFoundError, ValidationError
from wedge.models import Comment, Issue
from wedge.repository.issue_repository import IssueRepository


# ---------------------------------------------------------------------------
# 4.1 Add a comment to an issue
# ---------------------------------------------------------------------------

class TestAddComment:
    async def test_add_comment_returns_comment_with_fields(
        self, issue_repo: IssueRepository, sample_issue: Issue
    ):
        """Given an existing issue,
        when adding a comment with body text,
        then the returned comment has auto-generated id, correct author, and createdAt;
        and the comment is present in the issue's comments array."""
        # When
        comment = await issue_repo.add_comment(
            identifier=sample_issue.identifier,
            author="commenter@test.com",
            body="This is a comment",
        )

        # Then
        assert isinstance(comment, Comment)
        assert comment.id is not None
        assert comment.author == "commenter@test.com"
        assert comment.body == "This is a comment"
        assert comment.created_at is not None

        # Verify it's in the issue
        issue = await issue_repo.get_by_identifier(sample_issue.identifier)
        assert len(issue.comments) == 1
        assert issue.comments[0].body == "This is a comment"


# ---------------------------------------------------------------------------
# 4.2 Add a comment — history entry created
# ---------------------------------------------------------------------------

class TestAddCommentHistory:
    async def test_add_comment_creates_history_entry(
        self, issue_repo: IssueRepository, sample_issue: Issue
    ):
        """Given an existing issue,
        when adding a comment,
        then a HistoryEntry recording the comment addition is appended."""
        # When
        await issue_repo.add_comment(
            identifier=sample_issue.identifier,
            author="commenter@test.com",
            body="Another comment",
        )

        # Then
        issue = await issue_repo.get_by_identifier(sample_issue.identifier)
        comment_history = [h for h in issue.history if h.field == "comment"]
        assert len(comment_history) >= 1


# ---------------------------------------------------------------------------
# 4.3 Add a comment — empty body
# ---------------------------------------------------------------------------

class TestAddCommentEmptyBody:
    async def test_empty_body_raises_validation_error(
        self, issue_repo: IssueRepository, sample_issue: Issue
    ):
        """Given an existing issue,
        when adding a comment with an empty body,
        then a ValidationError is raised."""
        with pytest.raises(ValidationError):
            await issue_repo.add_comment(
                identifier=sample_issue.identifier,
                author="commenter@test.com",
                body="",
            )


# ---------------------------------------------------------------------------
# 4.4 Add a comment — non-existent issue
# ---------------------------------------------------------------------------

class TestAddCommentNonExistent:
    async def test_comment_on_nonexistent_issue_raises_not_found(
        self, issue_repo: IssueRepository
    ):
        """Given no issue with the given identifier exists,
        when adding a comment,
        then a NotFoundError is raised."""
        with pytest.raises(NotFoundError):
            await issue_repo.add_comment(
                identifier="NOPE-999",
                author="commenter@test.com",
                body="Orphan comment",
            )


# ---------------------------------------------------------------------------
# 4.5 Multiple comments on the same issue
# ---------------------------------------------------------------------------

class TestMultipleComments:
    async def test_multiple_comments_stored_in_order(
        self, issue_repo: IssueRepository, sample_issue: Issue
    ):
        """Given an existing issue,
        when adding multiple comments,
        then all are stored in chronological order."""
        # When
        await issue_repo.add_comment(
            identifier=sample_issue.identifier, author="a@test.com", body="First"
        )
        await issue_repo.add_comment(
            identifier=sample_issue.identifier, author="b@test.com", body="Second"
        )
        await issue_repo.add_comment(
            identifier=sample_issue.identifier, author="c@test.com", body="Third"
        )

        # Then
        issue = await issue_repo.get_by_identifier(sample_issue.identifier)
        assert len(issue.comments) == 3
        assert issue.comments[0].body == "First"
        assert issue.comments[1].body == "Second"
        assert issue.comments[2].body == "Third"
