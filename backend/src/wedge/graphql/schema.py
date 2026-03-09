"""Strawberry GraphQL schema definition for the Wedge issue tracker."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

import strawberry

from wedge.errors import DuplicateError, NotFoundError, ValidationError
from wedge.repository.issue_repository import IssueRepository
from wedge.repository.project_repository import ProjectRepository


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _require_user(info: strawberry.types.Info) -> str:
    """Extract and validate X-User header.  Raises GraphQLError if missing."""
    user = info.context.get("user")
    if not user:
        raise PermissionError("X-User header is required.")
    return user


def _get_db(info: strawberry.types.Info):
    return info.context["db"]


# ---------------------------------------------------------------------------
# GraphQL Types
# ---------------------------------------------------------------------------


@strawberry.type
class CommentType:
    id: str
    author: str
    body: str
    created_at: datetime


@strawberry.type
class HistoryEntryType:
    id: str
    actor: str
    field: str
    to_value: str
    timestamp: datetime
    from_value: Optional[str] = None


@strawberry.type
class ProjectType:
    id: str
    name: str
    prefix: str
    created_at: datetime
    description: Optional[str] = None


@strawberry.type
class IssueType:
    id: str
    identifier: str
    title: str
    state: str
    priority: str
    creator: str
    project: str
    url: str
    created_at: datetime
    updated_at: datetime
    sort_order: float = 0.0
    description: Optional[str] = None
    assignee: Optional[str] = None
    labels: list[str] = strawberry.field(default_factory=list)
    comments: list[CommentType] = strawberry.field(default_factory=list)
    history: list[HistoryEntryType] = strawberry.field(default_factory=list)


@strawberry.type
class PaginatedIssuesType:
    items: list[IssueType]
    cursor: Optional[str] = None


# ---------------------------------------------------------------------------
# Converters
# ---------------------------------------------------------------------------


def _project_to_type(p) -> ProjectType:
    return ProjectType(
        id=p.id, name=p.name, prefix=p.prefix,
        created_at=p.created_at, description=p.description,
    )


def _comment_to_type(c) -> CommentType:
    return CommentType(id=c.id, author=c.author, body=c.body, created_at=c.created_at)


def _history_to_type(h) -> HistoryEntryType:
    return HistoryEntryType(
        id=h.id, actor=h.actor, field=h.field,
        to_value=h.to_value, timestamp=h.timestamp, from_value=h.from_value,
    )


def _issue_to_type(i) -> IssueType:
    return IssueType(
        id=i.id, identifier=i.identifier, title=i.title,
        state=i.state.value, priority=i.priority.value,
        creator=i.creator, project=i.project, url=i.url,
        created_at=i.created_at, updated_at=i.updated_at,
        sort_order=i.sort_order,
        description=i.description, assignee=i.assignee,
        labels=i.labels,
        comments=[_comment_to_type(c) for c in i.comments],
        history=[_history_to_type(h) for h in i.history],
    )


# ---------------------------------------------------------------------------
# Query
# ---------------------------------------------------------------------------


@strawberry.type
class Query:
    @strawberry.field
    async def projects(self, info: strawberry.types.Info) -> list[ProjectType]:
        repo = ProjectRepository(_get_db(info))
        projects = await repo.list_all()
        return [_project_to_type(p) for p in projects]

    @strawberry.field
    async def issue(self, info: strawberry.types.Info, identifier: str) -> IssueType:
        repo = IssueRepository(_get_db(info))
        try:
            issue = await repo.get_by_identifier(identifier)
        except NotFoundError as e:
            raise ValueError(str(e))
        return _issue_to_type(issue)

    @strawberry.field
    async def issues(
        self,
        info: strawberry.types.Info,
        project_id: str,
        state: Optional[str] = None,
        assignee: Optional[str] = None,
        label: Optional[str] = None,
        first: Optional[int] = None,
        after: Optional[str] = None,
    ) -> PaginatedIssuesType:
        repo = IssueRepository(_get_db(info))
        result = await repo.list_issues(
            project_id=project_id, state=state, assignee=assignee,
            label=label, first=first, after=after,
        )
        return PaginatedIssuesType(
            items=[_issue_to_type(i) for i in result.items],
            cursor=result.cursor,
        )


# ---------------------------------------------------------------------------
# Mutation
# ---------------------------------------------------------------------------


@strawberry.type
class Mutation:
    @strawberry.mutation
    async def create_project(
        self,
        info: strawberry.types.Info,
        name: str,
        prefix: str,
        description: Optional[str] = None,
    ) -> ProjectType:
        _require_user(info)
        repo = ProjectRepository(_get_db(info))
        try:
            project = await repo.create(name=name, prefix=prefix, description=description)
        except (DuplicateError, ValidationError) as e:
            raise ValueError(str(e))
        return _project_to_type(project)

    @strawberry.mutation
    async def create_issue(
        self,
        info: strawberry.types.Info,
        project_id: str,
        title: str,
        description: Optional[str] = None,
        state: Optional[str] = None,
        priority: Optional[str] = None,
        labels: Optional[list[str]] = None,
        assignee: Optional[str] = None,
        sort_order: Optional[float] = None,
    ) -> IssueType:
        user = _require_user(info)
        repo = IssueRepository(_get_db(info))
        try:
            issue = await repo.create(
                project_id=project_id, title=title, creator=user,
                description=description, state=state, priority=priority,
                labels=labels, assignee=assignee, sort_order=sort_order,
            )
        except (NotFoundError, ValidationError) as e:
            raise ValueError(str(e))
        return _issue_to_type(issue)

    @strawberry.mutation
    async def update_issue(
        self,
        info: strawberry.types.Info,
        identifier: str,
        title: Optional[str] = None,
        description: Optional[str] = None,
        state: Optional[str] = None,
        priority: Optional[str] = None,
        labels: Optional[list[str]] = None,
        assignee: Optional[str] = None,
        sort_order: Optional[float] = None,
    ) -> IssueType:
        user = _require_user(info)
        repo = IssueRepository(_get_db(info))
        try:
            issue = await repo.update(
                identifier=identifier, actor=user,
                title=title, description=description, state=state,
                priority=priority, labels=labels, assignee=assignee,
                sort_order=sort_order,
            )
        except (NotFoundError, ValidationError) as e:
            raise ValueError(str(e))
        return _issue_to_type(issue)

    @strawberry.mutation
    async def add_comment(
        self,
        info: strawberry.types.Info,
        issue_identifier: str,
        body: str,
    ) -> CommentType:
        user = _require_user(info)
        repo = IssueRepository(_get_db(info))
        try:
            comment = await repo.add_comment(
                identifier=issue_identifier, author=user, body=body,
            )
        except (NotFoundError, ValidationError) as e:
            raise ValueError(str(e))
        return _comment_to_type(comment)

    @strawberry.mutation
    async def delete_issue(
        self,
        info: strawberry.types.Info,
        identifier: str,
    ) -> bool:
        _require_user(info)
        repo = IssueRepository(_get_db(info))
        try:
            return await repo.delete(identifier)
        except NotFoundError as e:
            raise ValueError(str(e))


# ---------------------------------------------------------------------------
# Schema
# ---------------------------------------------------------------------------


schema = strawberry.Schema(query=Query, mutation=Mutation)
