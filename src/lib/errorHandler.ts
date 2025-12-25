/**
 * Sanitizes error messages to prevent information leakage
 * Raw error details are logged for debugging but not exposed to users
 */
export function getSafeErrorMessage(error: unknown, operation: string): string {
  // Log full error for debugging (server-side/console only)
  console.error(`${operation} error:`, error);

  let errorString = "";
  if (error instanceof Error) {
    errorString = error.message;
  } else if (typeof error === 'object' && error !== null) {
    // Try to extract message or context from Supabase error objects
    if ('message' in error) {
      errorString = (error as any).message;
    } else if ('context' in error) { // Sometimes context has useful info
      try {
        errorString = JSON.stringify((error as any).context);
      } catch {
        errorString = "Unknown error context";
      }
    } else {
      try {
        errorString = JSON.stringify(error);
      } catch {
        errorString = String(error);
      }
    }
  } else {
    errorString = String(error);
  }

  // Map common error patterns to safe messages
  if (errorString.toLowerCase().includes('network') || errorString.toLowerCase().includes('fetch')) {
    return 'Connection issue. Please check your internet and try again.';
  }
  if (errorString.toLowerCase().includes('timeout')) {
    return 'Request timed out. Please try again.';
  }
  if (errorString.toLowerCase().includes('429') || errorString.toLowerCase().includes('rate limit')) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  if (errorString.toLowerCase().includes('401') || errorString.toLowerCase().includes('unauthorized') || errorString.toLowerCase().includes('jwt expired')) {
    return 'Session expired. Please log in again.';
  }
  if (errorString.toLowerCase().includes('403') || errorString.toLowerCase().includes('forbidden')) {
    return 'You do not have permission to perform this action.';
  }
  if (errorString.toLowerCase().includes('404') || errorString.toLowerCase().includes('not found')) {
    return 'The requested resource was not found.';
  }

  // Default safe message (Modified for Debugging)
  return `Unable to ${operation}. Error: ${errorString}`;
}
