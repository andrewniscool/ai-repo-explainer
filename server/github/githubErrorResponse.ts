type GitHubErrorResponse = {
  message: string;
  status: number;
};

export function getGitHubErrorResponse(error: unknown): GitHubErrorResponse {
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number"
  ) {
    const messages: Partial<Record<number, string>> = {
      401: "GitHub authentication failed. Please check the server's GitHub credentials.",
      403: "GitHub denied the request. The API rate limit may have been exceeded.",
      404: "The GitHub repository was not found or is not publicly accessible.",
      409: "The GitHub repository is empty or currently unavailable.",
      422: "GitHub could not process the repository request.",
      429: "Too many requests were sent to GitHub. Please try again later.",
    };

    return {
      message:
        messages[error.status] ?? "GitHub could not complete the request.",
      status: error.status,
    };
  }

  return {
    message: "An unexpected error occurred while contacting GitHub.",
    status: 500,
  };
}
