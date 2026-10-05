"""Reusable input validation helpers (TDD refactor step)."""

from app.utils.exceptions import ValidationError

MAX_TEXT_LENGTH = 5000
MIN_TEXT_LENGTH = 1


def validate_text(text, max_length: int = MAX_TEXT_LENGTH, min_length: int = MIN_TEXT_LENGTH, field: str = "text") -> str:
    """Validate a free text field and return the normalised value."""
    if text is None:
        raise ValidationError(f"'{field}' is required.")
    if not isinstance(text, str):
        raise ValidationError(f"'{field}' must be a string.")
    cleaned = text.strip()
    if len(cleaned) < min_length:
        raise ValidationError(f"'{field}' cannot be empty. Please enter some text.")
    if len(cleaned) > max_length:
        raise ValidationError(f"'{field}' is too long. Maximum {max_length} characters allowed.")
    return cleaned


def validate_choice(value, allowed, field: str):
    """Validate that a value belongs to a fixed set of options."""
    if value not in allowed:
        raise ValidationError(f"Invalid value for '{field}'. Allowed values: {', '.join(sorted(allowed))}.")
    return value
