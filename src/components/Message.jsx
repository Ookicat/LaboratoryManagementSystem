import React from "react";

export function formatErrorMessage(error) {
  if (!error) return "";

  if (typeof error === "string") return error;

  if (typeof error === "object") {
    const msg = error.message || error.error || error.title || "";
    const details = Array.isArray(error.details)
      ? error.details.join("; ")
      : typeof error.details === "string"
      ? error.details
      : "";

    if (msg && details) return `${msg} – ${details}`;
    if (msg) return msg;
    if (details) return details;
  }

  if (error.response?.data) {
    return formatErrorMessage(error.response.data);
  }

  return String(error);
}


const Message = ({ error, className = "" }) => {
  if (!error) return null;

  const message = formatErrorMessage(error);

  return (
    <div
      className={`p-3 rounded-md bg-red-50 border border-red-300 text-red-700 text-sm ${className}`}
    >
      {message}
    </div>
  );
};

export default Message;
