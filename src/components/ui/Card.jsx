import React from "react";

export default function Card({ children, className = "", shadow = true }) {
  return (
    <div
      className={`bg-white rounded-2xl ${
        shadow ? "shadow-sm" : ""
      } p-4 overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}
