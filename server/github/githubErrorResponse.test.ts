import { describe, expect, it } from "vitest";
import { getGitHubErrorResponse } from "./githubErrorResponse.ts";

describe("getGitHubErrorResponse", () => {
  it("maps a missing repository to a useful 404 response", () => {
    expect(getGitHubErrorResponse({ status: 404 })).toEqual({
      status: 404,
      message:
        "The GitHub repository was not found or is not publicly accessible.",
    });
  });

  it("maps a forbidden GitHub response to a possible rate-limit message", () => {
    expect(getGitHubErrorResponse({ status: 403 })).toEqual({
      status: 403,
      message:
        "GitHub denied the request. The API rate limit may have been exceeded.",
    });
  });

  it("uses a generic GitHub message for an unmapped numeric status", () => {
    expect(getGitHubErrorResponse({ status: 502 })).toEqual({
      status: 502,
      message: "GitHub could not complete the request.",
    });
  });

  it("returns a safe 500 response for an unexpected error", () => {
    expect(getGitHubErrorResponse(new Error("Unexpected failure"))).toEqual({
      status: 500,
      message: "An unexpected error occurred while contacting GitHub.",
    });
  });
});
