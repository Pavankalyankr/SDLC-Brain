"""
SDLC Brain — Gemini Provider

Provider-agnostic LLM client using the official Google GenAI SDK.
Includes automatic retry with exponential backoff for rate-limit errors.
"""

import asyncio
import logging
import re
from collections.abc import AsyncGenerator
from typing import Any

from google import genai
from google.genai import types

from app.ai.providers.base import BaseLLMProvider

logger = logging.getLogger(__name__)

# Retry configuration
MAX_RETRIES = 5
BASE_DELAY_SECONDS = 2.0
MAX_DELAY_SECONDS = 60.0


def _is_rate_limit_error(exc: Exception) -> bool:
    """Check if an exception is a rate-limit / quota-exhausted error."""
    msg = str(exc).lower()
    return any(keyword in msg for keyword in [
        "resource_exhausted",
        "429",
        "quota",
        "rate limit",
        "too many requests",
    ])


def _extract_retry_delay(exc: Exception) -> float | None:
    """Try to extract the retry delay from a Google API error message."""
    msg = str(exc)
    # Match patterns like "retry in 25.787275946s" or "retryDelay: 25s"
    match = re.search(r"retry\s*(?:in|Delay[\"']?:\s*[\"']?)\s*([\d.]+)\s*s", msg, re.IGNORECASE)
    if match:
        return float(match.group(1))
    return None


class GeminiProvider(BaseLLMProvider):
    """
    Gemini API provider using google-genai.
    Automatically retries on rate-limit errors with exponential backoff.
    """

    def __init__(self, api_key: str | None = None) -> None:
        self.api_key = api_key
        if not self.api_key:
            logger.warning("GeminiProvider initialized without API key")
            self.client = None
        else:
            self.client = genai.Client(api_key=self.api_key)

    def _format_messages(self, messages: list[dict[str, str]]) -> list[types.Content]:
        """Convert OpenAI-style messages to Gemini Content objects."""
        formatted_messages = []
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")

            # Map roles: 'assistant' -> 'model', everything else -> 'user'
            gemini_role = "model" if role == "assistant" else "user"

            formatted_messages.append(
                types.Content(
                    role=gemini_role,
                    parts=[types.Part.from_text(text=content)]
                )
            )
        return formatted_messages

    def _extract_system_and_contents(
        self, messages: list[dict[str, str]]
    ) -> tuple[str | None, list[types.Content]]:
        """Split messages into an optional system instruction and Gemini contents."""
        system_instruction = None
        filtered_messages = []
        for msg in messages:
            if msg.get("role") == "system":
                system_instruction = msg.get("content")
            else:
                filtered_messages.append(msg)
        return system_instruction, self._format_messages(filtered_messages)

    def _build_config(
        self,
        max_tokens: int,
        temperature: float,
        system_instruction: str | None,
        **kwargs: Any,
    ) -> types.GenerateContentConfig:
        """Build the generation config with optional system instruction."""
        config_args: dict[str, Any] = {
            "max_output_tokens": max_tokens,
            "temperature": temperature,
        }
        if system_instruction:
            config_args["system_instruction"] = system_instruction
        if "top_p" in kwargs:
            config_args["top_p"] = kwargs["top_p"]
        return types.GenerateContentConfig(**config_args)

    async def generate(
        self,
        model: str,
        messages: list[dict[str, str]],
        max_tokens: int = 4096,
        temperature: float = 0.5,
        **kwargs: Any,
    ) -> str:
        """Generate a complete response with automatic retry on rate-limit."""
        if not self.client:
            raise ValueError("Gemini API key is not configured.")

        system_instruction, contents = self._extract_system_and_contents(messages)
        config = self._build_config(max_tokens, temperature, system_instruction, **kwargs)

        last_error: Exception | None = None
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                response = await self.client.aio.models.generate_content(
                    model=model,
                    contents=contents,
                    config=config,
                )
                return response.text or ""

            except Exception as e:
                last_error = e
                if _is_rate_limit_error(e) and attempt < MAX_RETRIES:
                    # Use the API-suggested delay if available, otherwise exponential backoff
                    delay = _extract_retry_delay(e) or min(
                        BASE_DELAY_SECONDS * (2 ** (attempt - 1)), MAX_DELAY_SECONDS
                    )
                    logger.warning(
                        f"Gemini rate-limited (attempt {attempt}/{MAX_RETRIES}). "
                        f"Retrying in {delay:.1f}s..."
                    )
                    await asyncio.sleep(delay)
                else:
                    logger.error(f"Gemini generation error: {e}")
                    raise

        # Should not reach here, but just in case
        raise Exception(f"Gemini generation failed after {MAX_RETRIES} retries: {last_error}")

    async def stream(
        self,
        model: str,
        messages: list[dict[str, str]],
        max_tokens: int = 4096,
        temperature: float = 0.5,
        **kwargs: Any,
    ) -> AsyncGenerator[str, None]:
        """Stream tokens with automatic retry on rate-limit."""
        if not self.client:
            raise ValueError("Gemini API key is not configured.")

        system_instruction, contents = self._extract_system_and_contents(messages)
        config = self._build_config(max_tokens, temperature, system_instruction, **kwargs)

        last_error: Exception | None = None
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                response_stream = await self.client.aio.models.generate_content_stream(
                    model=model,
                    contents=contents,
                    config=config,
                )

                async for chunk in response_stream:
                    if chunk.text:
                        yield chunk.text

                # If we got here, streaming completed successfully
                return

            except Exception as e:
                last_error = e
                if _is_rate_limit_error(e) and attempt < MAX_RETRIES:
                    delay = _extract_retry_delay(e) or min(
                        BASE_DELAY_SECONDS * (2 ** (attempt - 1)), MAX_DELAY_SECONDS
                    )
                    logger.warning(
                        f"Gemini stream rate-limited (attempt {attempt}/{MAX_RETRIES}). "
                        f"Retrying in {delay:.1f}s..."
                    )
                    await asyncio.sleep(delay)
                else:
                    logger.error(f"Gemini streaming error: {e}")
                    raise

        raise Exception(f"Gemini streaming failed after {MAX_RETRIES} retries: {last_error}")

    async def health_check(self) -> bool:
        """Check if the provider is reachable and key is valid."""
        if not self.client:
            return False

        try:
            await self.client.aio.models.generate_content(
                model="gemini-flash-latest",
                contents="Hi",
                config=types.GenerateContentConfig(max_output_tokens=5)
            )
            return True
        except Exception as e:
            logger.warning(f"Gemini health check failed: {e}")
            return False
