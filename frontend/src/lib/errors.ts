import axios from "axios";

/** Turns any thrown value into a message that is safe to show to the user. */
export function getErrorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) return "Cannot reach the server. Please check your connection.";
    const data = err.response.data as { error?: unknown; details?: unknown } | undefined;
    const details = data?.details;
    if (Array.isArray(details)) {
      const messages = details
        .map((d: unknown) => (d && typeof d === "object" && "message" in d ? String((d as { message: unknown }).message) : ""))
        .filter(Boolean);
      if (messages.length) return messages.join(" · ");
    }
    if (typeof data?.error === "string") return data.error;
  }
  return fallback;
}
