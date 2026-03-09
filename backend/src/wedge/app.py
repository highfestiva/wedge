"""Starlette application for the Wedge backend."""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from time import perf_counter

from starlette.applications import Starlette
from starlette.middleware import Middleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.routing import Route
from strawberry.asgi import GraphQL

from wedge.db import connect, disconnect
from wedge.graphql.schema import schema


logger = logging.getLogger("wedge")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware that logs all incoming HTTP requests and responses."""

    async def dispatch(self, request: Request, call_next):
        start = perf_counter()
        logger.info("HTTP %s %s", request.method, request.url.path)
        response = await call_next(request)
        duration_ms = (perf_counter() - start) * 1000
        logger.info(
            "HTTP %s %s -> %s in %.1f ms",
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
        )
        return response


class WedgeGraphQL(GraphQL):
    """Custom GraphQL view that extracts the X-User header and logs calls."""

    async def get_context(self, request: Request, response=None) -> dict:
        user = request.headers.get("X-User")
        logger.info(
            "GraphQL request from user=%r path=%s", user, request.url.path
        )
        return {
            "request": request,
            "user": user,
            "db": request.app.state.db,
        }


graphql_app = WedgeGraphQL(schema)


@asynccontextmanager
async def lifespan(app):
    mongo_uri = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
    db_name = os.environ.get("MONGO_DB", "wedge")
    db = await connect(mongo_uri, db_name)
    app.state.db = db
    logger.info("Database connected and initialised")
    yield
    await disconnect()
    logger.info("Database disconnected")


app = Starlette(
    routes=[
        Route("/graphql", graphql_app),
    ],
    middleware=[
        Middleware(RequestLoggingMiddleware),
    ],
    lifespan=lifespan,
)
