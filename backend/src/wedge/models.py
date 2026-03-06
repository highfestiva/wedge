"""Domain models for the Wedge issue tracker."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class IssueState(str, Enum):
    BACKLOG = "Backlog"
    TODO = "Todo"
    IN_PROGRESS = "In Progress"
    IN_REVIEW = "In Review"
    DONE = "Done"
    CANCELLED = "Cancelled"


class Priority(str, Enum):
    URGENT = "urgent"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    NONE = "none"


# ---------------------------------------------------------------------------
# Value objects / embedded documents
# ---------------------------------------------------------------------------

@dataclass
class Comment:
    id: str
    author: str
    body: str
    created_at: datetime


@dataclass
class HistoryEntry:
    id: str
    actor: str
    field: str
    to_value: str
    timestamp: datetime
    from_value: Optional[str] = None


# ---------------------------------------------------------------------------
# Entities
# ---------------------------------------------------------------------------

@dataclass
class Project:
    id: str
    name: str
    prefix: str
    created_at: datetime
    description: Optional[str] = None
    issue_counter: int = 0


@dataclass
class Issue:
    id: str
    identifier: str
    title: str
    state: IssueState
    priority: Priority
    creator: str
    project: str
    url: str
    created_at: datetime
    updated_at: datetime
    description: Optional[str] = None
    assignee: Optional[str] = None
    labels: list[str] = field(default_factory=list)
    comments: list[Comment] = field(default_factory=list)
    history: list[HistoryEntry] = field(default_factory=list)


@dataclass
class User:
    id: str
    displayname: str
    email: str
    created_at: datetime
