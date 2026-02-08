# Gemini Integration in CelestiArcana

This document outlines the integration of the Gemini model within the CelestiArcana project, based on the provided code snippets.

## Key Components:

### `GeminiModel` Class (Python)
This class appears to be a core wrapper for interacting with the Gemini API.

-   **Initialization (`__init__`)**:
    -   Sets up the model name (default: "gemini-2.0-flash-001"), whether it's a finetuned model, request distribution, caching, and temperature.
    -   Handles dynamic model naming for distributed requests across regions.
    -   Can initialize the model from cached content or directly as a `GenerativeModel`.
-   **`call(self, prompt: str, parser_func=None)`**:
    -   Makes a synchronous call to the Gemini model with a given prompt.
    -   Includes retry logic (`@retry` decorator).
    -   Applies `GenerationConfig` (temperature and other arguments) and `safety_settings`.
    -   Optionally processes the model's text response using a `parser_func`.
-   **`call_parallel(...)`**:
    -   Enables parallel calls to the Gemini model for a list of prompts using `ThreadPoolExecutor`.
    -   Incorporates retry logic for individual prompts and handles timeouts.

### `Gemini` Class (Python, likely part of an SDK/framework)
This class extends `BaseLlm` and provides an asynchronous interface for Gemini models.

-   **`supported_models()`**: Lists supported model patterns, including finetuned Vertex AI endpoints.
-   **`generate_content_async(...)`**:
    -   Asynchronously sends requests to the Gemini model, supporting streaming responses.
    -   Handles pre-processing of requests, including tracking headers and content modifications.
    -   Manages accumulation of partial thought and text content during streaming.
-   **`api_client`**: Provides an API client instance with tracking headers.
-   **`_api_backend`**: Determines whether the backend is Vertex AI or Gemini API.
-   **`_tracking_headers`**: Generates headers for telemetry, including framework and language versions.
-   **`_live_api_client` / `connect`**: Supports live connections with system instructions and tool configurations, likely for interactive or conversational scenarios.
-   **`_preprocess_request`**: Adjusts request parameters based on the API backend (e.g., removing labels for Google AI Studio API key usage).

### Utility Functions

-   **`gemini_to_json_schema(gemini_schema: Schema)`**: Converts a Gemini `Schema` object into a JSON Schema dictionary, handling various types (string, number, array, object) and validation rules.
-   **`_to_gemini_schema(openapi_schema: dict[str, Any])`**: Converts an OpenAPI schema dictionary to a Gemini `Schema` object, sanitizing formats and using `Schema.from_json_schema`.

## Usage Context:

The snippets suggest a robust integration capable of:
-   Making both synchronous and asynchronous calls to Gemini.
-   Handling parallel requests for efficiency.
-   Supporting both standard Gemini API and Vertex AI endpoints.
-   Managing streaming responses for interactive experiences.
-   Converting between OpenAPI and Gemini schema formats, indicating potential use in tool calling or structured output generation.

The presence of `App.tsx`, `index.tsx`, `components/` and `context/` folders suggests a React-based frontend application, while the Python code snippets (from the `GeminiModel` and `Gemini` classes) imply a Python backend or a Python-based utility layer that interacts with the Gemini API. The `OracleChat.tsx` and `ReadingShufflePhase.tsx` components hint at a front-end application that might be leveraging these Gemini integrations for dynamic content generation, such as interpreting tarot readings or guiding interactive chat experiences.