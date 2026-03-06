"""Custom exception types for the Wedge issue tracker."""


class WedgeError(Exception):
    """Base class for all Wedge errors."""


class NotFoundError(WedgeError):
    """Raised when a requested entity does not exist."""


class DuplicateError(WedgeError):
    """Raised when a unique constraint would be violated."""


class ValidationError(WedgeError):
    """Raised when input fails validation."""
