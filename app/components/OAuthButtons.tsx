"use client";
import { createClient } from "@/utils/supabase/client";

export default function OAuthButtons() {
  const supabase = createClient();

  const handleOAuthSignIn = async (provider: "google" | "github") => {
    await supabase.auth.signInWithOAuth({ provider });
  };

  return (
    <div className="flex flex-col gap-2 mt-6">
      <button
        type="button"
        className="bg-white border border-gray-300 text-gray-800 rounded px-4 py-2 font-medium hover:bg-gray-50 flex items-center justify-center gap-2 shadow-sm"
        onClick={() => handleOAuthSignIn("google")}
        aria-label="Sign in with Google"
      >
        <svg width="20" height="20" viewBox="0 0 48 48" className="mr-2" aria-hidden="true"><g><path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.23l6.85-6.85C35.64 2.7 30.14 0 24 0 14.82 0 6.73 5.8 2.69 14.09l7.98 6.2C12.36 13.13 17.74 9.5 24 9.5z"/><path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.22-.42-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.65 7.01l7.19 5.59C43.98 37.13 46.1 31.3 46.1 24.55z"/><path fill="#FBBC05" d="M10.67 28.29a14.5 14.5 0 0 1 0-8.58l-7.98-6.2A23.94 23.94 0 0 0 0 24c0 3.93.94 7.65 2.69 10.91l7.98-6.2z"/><path fill="#EA4335" d="M24 48c6.14 0 11.29-2.03 15.05-5.53l-7.19-5.59c-2.01 1.35-4.6 2.16-7.86 2.16-6.26 0-11.64-3.63-13.33-8.91l-7.98 6.2C6.73 42.2 14.82 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></g></svg>
        Sign in with Google
      </button>
      <button
        type="button"
        className="bg-black text-white rounded px-4 py-2 font-medium hover:bg-gray-900 flex items-center justify-center gap-2 shadow-sm"
        onClick={() => handleOAuthSignIn("github")}
        aria-label="Sign in with GitHub"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="mr-2" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.263.82-.582 0-.288-.012-1.243-.017-2.252-3.338.726-4.042-1.415-4.042-1.415-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.606-2.665-.304-5.466-1.332-5.466-5.931 0-1.31.469-2.381 1.236-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.3 1.23a11.5 11.5 0 0 1 3.003-.404c1.018.005 2.045.138 3.003.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.803 5.625-5.475 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.218.699.825.58C20.565 21.796 24 17.297 24 12c0-6.63-5.373-12-12-12z"/></svg>
        Sign in with GitHub
      </button>
    </div>
  );
} 