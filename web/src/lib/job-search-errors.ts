import { ApiError } from "@/api/client";

type JobSearchErrorCopy = {
  message: string;
  nextAction: string;
};

export function formatJobSearchError(error: unknown): JobSearchErrorCopy {
  if (!(error instanceof ApiError)) {
    return {
      message: "Search failed. Try again.",
      nextAction: "Check your connection, broaden keywords, or try again.",
    };
  }

  const code = error.code ?? "";
  const details = error.details as
    | { reason?: string; country?: string; message?: string }
    | undefined;

  switch (code) {
    case "NETWORK_ERROR":
      return {
        message: error.message,
        nextAction:
          "Confirm the API is running (port 3001 locally) and NEXT_PUBLIC_API_URL / API_UPSTREAM are correct.",
      };
    case "JOBS_NOT_CONFIGURED":
      return {
        message: error.message,
        nextAction:
          "Set ADZUNA_APP_ID and ADZUNA_API_KEY on the API server, then restart it.",
      };
    case "JOBS_PROVIDER_UNAVAILABLE":
      return {
        message: error.message,
        nextAction: "Adzuna may be down or slow. Wait a moment and try again.",
      };
    case "JOBS_PROVIDER_ERROR":
      return {
        message: error.message,
        nextAction:
          details?.reason ??
          "Try broader keywords, a different city, or another country.",
      };
    case "JOBS_MARKET_UNSUPPORTED":
      return {
        message: error.message,
        nextAction: "Choose another country from the market dropdown.",
      };
    case "RATE_LIMIT_EXCEEDED":
      return {
        message: error.message,
        nextAction: "Too many searches in a short window. Wait a minute and retry.",
      };
    case "VALIDATION_ERROR":
      return {
        message: error.message,
        nextAction: "Fix the highlighted fields and search again.",
      };
    case "INTERNAL_ERROR":
      return {
        message:
          details?.message && process.env.NODE_ENV !== "production"
            ? `${error.message}: ${details.message}`
            : error.message,
        nextAction:
          "If this keeps happening, restart the API and ensure Redis is running (docker compose up -d redis).",
      };
    default:
      if (error.status === 502 || error.status === 503 || error.status === 504) {
        return {
          message: error.message || "Job search service is unavailable.",
          nextAction:
            "The API may be restarting or overloaded. Try again shortly.",
        };
      }
      return {
        message: error.message || "Search failed. Try again.",
        nextAction: "Check your connection, broaden keywords, or try again.",
      };
  }
}
