"""Issue repository — data-access layer for Issue entities."""

from __future__ import annotations

import base64
import json
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from wedge.errors import NotFoundError, ValidationError
from wedge.models import Comment, HistoryEntry, Issue, IssueState, Priority
from wedge.repository.project_repository import ProjectRepository


class PaginatedResult:
    """Wrapper for cursor-based pagination results."""

    def __init__(self, items: list[Issue], cursor: str | None) -> None:
        self.items = items
        self.cursor = cursor


def _encode_cursor(issue_id: str, sort_order: float = 0.0) -> str:
    return base64.b64encode(json.dumps({"id": issue_id, "so": sort_order}).encode()).decode()


def _decode_cursor(cursor: str) -> tuple[str, float]:
    data = json.loads(base64.b64decode(cursor))
    return data["id"], data.get("so", 0.0)


def _validate_state(state: str) -> IssueState:
    """Validate and return an IssueState enum value."""
    for s in IssueState:
        if s.value == state:
            return s
    raise ValidationError(f"Invalid state: '{state}'")


def _validate_priority(priority: str) -> Priority:
    """Validate and return a Priority enum value."""
    for p in Priority:
        if p.value == priority:
            return p
    raise ValidationError(f"Invalid priority: '{priority}'")


_PRIORITY_SORT_ORDER = {
    Priority.URGENT: 0.0,
    Priority.HIGH: 1.0,
    Priority.MEDIUM: 2.0,
    Priority.LOW: 3.0,
    Priority.NONE: 4.0,
}


def _priority_sort_order(priority: Priority) -> float:
    """Return the default sort_order for a given priority."""
    return _PRIORITY_SORT_ORDER[priority]


class IssueRepository:
    """Manages CRUD operations for Issue documents in MongoDB."""

    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._db = db
        self._collection = db["issues"]
        self._project_repo = ProjectRepository(db)

    def _comment_from_doc(self, doc: dict) -> Comment:
        return Comment(
            id=doc["id"],
            author=doc["author"],
            body=doc["body"],
            created_at=doc["created_at"],
        )

    def _history_from_doc(self, doc: dict) -> HistoryEntry:
        return HistoryEntry(
            id=doc["id"],
            actor=doc["actor"],
            field=doc["field"],
            to_value=doc["to_value"],
            timestamp=doc["timestamp"],
            from_value=doc.get("from_value"),
        )

    def _to_model(self, doc: dict) -> Issue:
        """Convert a MongoDB document to an Issue model."""
        return Issue(
            id=str(doc["_id"]),
            identifier=doc["identifier"],
            title=doc["title"],
            state=IssueState(doc["state"]),
            priority=Priority(doc["priority"]),
            creator=doc["creator"],
            project=doc["project"],
            url=doc["url"],
            created_at=doc["created_at"],
            updated_at=doc["updated_at"],
            description=doc.get("description"),
            assignee=doc.get("assignee"),
            labels=doc.get("labels", []),
            comments=[self._comment_from_doc(c) for c in doc.get("comments", [])],
            history=[self._history_from_doc(h) for h in doc.get("history", [])],
            sort_order=doc.get("sort_order", 0.0),
        )

    async def create(
        self,
        project_id: str,
        title: str,
        creator: str,
        description: Optional[str] = None,
        state: Optional[str] = None,
        priority: Optional[str] = None,
        labels: Optional[list[str]] = None,
        assignee: Optional[str] = None,
        sort_order: Optional[float] = None,
    ) -> Issue:
        """Create a new issue.  Auto-generates identifier from project prefix + counter."""
        # Validate project exists
        try:
            project = await self._project_repo.get_by_id(project_id)
        except NotFoundError:
            raise NotFoundError(f"Project '{project_id}' not found.")

        # Validate state
        issue_state = IssueState.BACKLOG
        if state is not None:
            issue_state = _validate_state(state)

        # Validate priority
        issue_priority = Priority.NONE
        if priority is not None:
            issue_priority = _validate_priority(priority)

        # Compute sort_order: use explicit value or derive from priority
        if sort_order is not None:
            effective_sort_order = sort_order
        else:
            effective_sort_order = _priority_sort_order(issue_priority)

        # Atomically get the next counter
        counter = await self._project_repo.increment_counter(project_id)
        identifier = f"{project.prefix}-{counter}"

        now = datetime.now(timezone.utc)
        doc = {
            "identifier": identifier,
            "title": title,
            "state": issue_state.value,
            "priority": issue_priority.value,
            "creator": creator,
            "project": project_id,
            "url": f"/issue/{identifier}",
            "created_at": now,
            "updated_at": now,
            "description": description,
            "assignee": assignee,
            "labels": labels or [],
            "comments": [],
            "history": [],
            "sort_order": effective_sort_order,
        }
        result = await self._collection.insert_one(doc)
        doc["_id"] = result.inserted_id
        return self._to_model(doc)

    async def get_by_identifier(self, identifier: str) -> Issue:
        """Fetch a single issue by its human-readable identifier.  Raises NotFoundError."""
        doc = await self._collection.find_one({"identifier": identifier})
        if doc is None:
            raise NotFoundError(f"Issue '{identifier}' not found.")
        return self._to_model(doc)

    async def list_issues(
        self,
        project_id: str,
        state: Optional[str] = None,
        assignee: Optional[str] = None,
        label: Optional[str] = None,
        first: Optional[int] = None,
        after: Optional[str] = None,
    ) -> PaginatedResult:
        """List issues with optional filters and cursor-based pagination."""
        query: dict = {"project": project_id}
        if state is not None:
            query["state"] = state
        if assignee is not None:
            query["assignee"] = assignee
        if label is not None:
            query["labels"] = label

        if after is not None:
            after_id, after_so = _decode_cursor(after)
            query["$or"] = [
                {"sort_order": {"$gt": after_so}},
                {"sort_order": after_so, "_id": {"$gt": ObjectId(after_id)}},
            ]

        cursor = self._collection.find(query).sort([("sort_order", 1), ("_id", 1)])
        if first is not None:
            cursor = cursor.limit(first + 1)

        docs = [doc async for doc in cursor]

        has_next = False
        if first is not None and len(docs) > first:
            has_next = True
            docs = docs[:first]

        items = [self._to_model(doc) for doc in docs]

        next_cursor = None
        if has_next and docs:
            next_cursor = _encode_cursor(str(docs[-1]["_id"]), docs[-1].get("sort_order", 0.0))

        return PaginatedResult(items=items, cursor=next_cursor)

    async def update(
        self,
        identifier: str,
        actor: str,
        title: Optional[str] = None,
        description: Optional[str] = None,
        state: Optional[str] = None,
        priority: Optional[str] = None,
        labels: Optional[list[str]] = None,
        assignee: Optional[str] = None,
        sort_order: Optional[float] = None,
    ) -> Issue:
        """Update an issue.  Creates HistoryEntry for each changed field.  Raises NotFoundError."""
        # Validate before fetching to fail fast
        if state is not None:
            _validate_state(state)
        if priority is not None:
            _validate_priority(priority)

        issue = await self.get_by_identifier(identifier)
        now = datetime.now(timezone.utc)
        updates: dict = {}
        history_entries: list[dict] = []

        field_map = {
            "title": (title, issue.title),
            "description": (description, issue.description),
            "state": (state, issue.state.value),
            "priority": (priority, issue.priority.value),
            "assignee": (assignee, issue.assignee),
        }

        if sort_order is not None and sort_order != issue.sort_order:
            updates["sort_order"] = sort_order

        for field_name, (new_val, old_val) in field_map.items():
            if new_val is not None and new_val != old_val:
                updates[field_name] = new_val
                history_entries.append({
                    "id": str(ObjectId()),
                    "actor": actor,
                    "field": field_name,
                    "from_value": old_val if old_val is not None else None,
                    "to_value": new_val,
                    "timestamp": now,
                })

        if labels is not None and labels != issue.labels:
            updates["labels"] = labels
            history_entries.append({
                "id": str(ObjectId()),
                "actor": actor,
                "field": "labels",
                "from_value": str(issue.labels),
                "to_value": str(labels),
                "timestamp": now,
            })

        if updates:
            updates["updated_at"] = now
            mongo_update: dict = {"$set": updates}
            if history_entries:
                mongo_update["$push"] = {"history": {"$each": history_entries}}
            await self._collection.update_one(
                {"identifier": identifier},
                mongo_update,
            )

        return await self.get_by_identifier(identifier)

    async def add_comment(self, identifier: str, author: str, body: str) -> Comment:
        """Add a comment to an issue.  Also creates a HistoryEntry.  Raises NotFoundError."""
        if not body:
            raise ValidationError("Comment body cannot be empty.")

        await self.get_by_identifier(identifier)

        now = datetime.now(timezone.utc)
        comment_doc = {
            "id": str(ObjectId()),
            "author": author,
            "body": body,
            "created_at": now,
        }
        history_doc = {
            "id": str(ObjectId()),
            "actor": author,
            "field": "comment",
            "from_value": None,
            "to_value": body,
            "timestamp": now,
        }

        await self._collection.update_one(
            {"identifier": identifier},
            {
                "$push": {
                    "comments": comment_doc,
                    "history": history_doc,
                },
                "$set": {"updated_at": now},
            },
        )

        return self._comment_from_doc(comment_doc)

    async def delete(self, identifier: str) -> bool:
        """Delete an issue by its identifier.  Raises NotFoundError."""
        result = await self._collection.delete_one({"identifier": identifier})
        if result.deleted_count == 0:
            raise NotFoundError(f"Issue '{identifier}' not found.")
        return True
