"""Domain specific exceptions mapped to HTTP responses in the routers."""


class DomainError(Exception):
    """Base class for expected, user friendly application errors."""

    status_code = 400
    code = "bad_request"

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class ValidationError(DomainError):
    status_code = 422
    code = "validation_error"


class TTSError(DomainError):
    status_code = 502
    code = "tts_error"


class STTError(DomainError):
    status_code = 422
    code = "stt_error"


class AssistantError(DomainError):
    status_code = 400
    code = "assistant_error"


class NotFoundError(DomainError):
    status_code = 404
    code = "not_found"
