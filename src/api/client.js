/**
 * Ultra-lightweight REST API Client
 * Zero external dependencies, embedded-safe, minimal allocations.
 */

export class ApiError extends Error {
  constructor(status, message, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

const DEFAULT_TIMEOUT = 10_000;
const JSON_CONTENT_TYPE = "application/json";
const FROZEN_JSON_HEADERS = Object.freeze({
  Accept: JSON_CONTENT_TYPE,
  "Content-Type": JSON_CONTENT_TYPE,
});
const FROZEN_GET_HEADERS = Object.freeze({
  Accept: JSON_CONTENT_TYPE,
});
const EMPTY_OBJECT = Object.freeze({});

let apiBaseUrl = "";

/**
 * Configure default base URL for API requests
 */
export function setApiBaseUrl(url) {
  apiBaseUrl = url.endsWith("/") ? url.slice(0, -1) : url;
}

export function getApiBaseUrl() {
  return apiBaseUrl;
}

/**
 * Low-overhead HTTP request execution
 */
export async function request(endpoint, options = EMPTY_OBJECT) {
  const method = options.method || "GET";
  const headers = options.headers;
  const body = options.body;
  const signal = options.signal;
  const timeout = options.timeout ?? DEFAULT_TIMEOUT;
  const baseUrl = options.baseUrl ?? apiBaseUrl;

  const url = endpoint.includes("://")
    ? endpoint
    : `${baseUrl}${endpoint.charCodeAt(0) === 47 ? endpoint : `/${endpoint}`}`;

  const hasBody = body !== undefined && body !== null;
  const isPlainBody =
    hasBody && typeof body === "object" && (body.constructor === Object || Array.isArray(body));

  const baseHeaders = isPlainBody ? FROZEN_JSON_HEADERS : FROZEN_GET_HEADERS;
  const requestHeaders = headers ? { ...baseHeaders, ...headers } : baseHeaders;
  const requestBody = isPlainBody ? JSON.stringify(body) : body;

  let timer = null;
  let controller = null;
  let effectiveSignal = signal;
  let onAbort = null;

  if (timeout > 0 && typeof AbortController !== "undefined") {
    controller = new AbortController();
    effectiveSignal = controller.signal;

    if (signal) {
      if (signal.aborted) {
        controller.abort(signal.reason);
      } else {
        onAbort = () => controller.abort(signal.reason);
        signal.addEventListener("abort", onAbort, { once: true });
      }
    }

    timer = setTimeout(() => {
      controller.abort(new Error(`Request timeout after ${timeout}ms`));
    }, timeout);
  }

  const fetchInit = {
    method,
    headers: requestHeaders,
    body: requestBody,
    signal: effectiveSignal,
  };

  try {
    const response = await fetch(url, fetchInit);

    if (!response.ok) {
      let errorData = null;
      try {
        errorData = await response.json();
      } catch {
        // Fallback if response body is not JSON
      }
      throw new ApiError(
        response.status,
        `API Error: ${response.statusText || response.status}`,
        errorData,
      );
    }

    const status = response.status;
    if (
      status === 204 ||
      status === 205 ||
      status === 304 ||
      response.headers?.get?.("content-length") === "0"
    ) {
      return null;
    }

    const contentType = response.headers?.get?.("content-type") || "";
    if (contentType.includes(JSON_CONTENT_TYPE)) {
      if (typeof response.json === "function") {
        return await response.json();
      }
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    }
    return await response.text();
  } finally {
    if (timer !== null) {
      clearTimeout(timer);
    }
    if (onAbort !== null && signal) {
      signal.removeEventListener("abort", onAbort);
    }
  }
}
