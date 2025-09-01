"use client";

import { useState } from "react";
import { AuthForm } from "@/components/auth/AuthForm";

export default function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  const toggleMode = () => {
    setMode(mode === "signin" ? "signup" : "signin");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <AuthForm mode={mode} onToggleMode={toggleMode} />
    </div>
  );
}
