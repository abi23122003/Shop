export function getApiErrorMessage(error, fallback = "The request could not be completed. Please try again.") {
  if (!error) {
    return fallback;
  }

  if (!error.response && error.request) {
    return "The server did not respond. Check your connection and try again.";
  }

  if (error.response?.status === 401) {
    return "Your session expired. Please sign in again.";
  }

  const messages = {
    400: "Please check the submitted values and try again.",
    403: "You do not have permission to perform this action.",
    404: "The requested record could not be found.",
    409: "This request conflicts with the current data. Refresh and try again.",
    422: "Some submitted values are invalid. Please review them and try again.",
    502: "The backend is not responding. Start the Spring Boot service on port 8081 and try again.",
    503: "The backend is temporarily unavailable. Try again when the service is running.",
    504: "The backend did not respond in time. Check that the service is running and try again.",
    500: "The server could not complete the request. Please try again later.",
  };
  return messages[error.response?.status] ?? fallback;
}
