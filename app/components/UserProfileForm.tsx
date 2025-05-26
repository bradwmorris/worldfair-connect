"use client";
import { useState, ChangeEvent, FormEvent } from "react";
import { createClient } from "@/utils/supabase/client";

interface UserProfileFormProps {
  person: {
    email?: string;
    full_name?: string;
    github_username?: string;
    twitter_username?: string;
    labels?: string;
  } | null;
  user: {
    id: string;
    email?: string;
  };
}

export default function UserProfileForm({ person, user }: UserProfileFormProps) {
  const [form, setForm] = useState({
    email: person?.email || user.email || "",
    full_name: person?.full_name || "",
    github_username: person?.github_username || "",
    twitter_username: person?.twitter_username || "",
    labels: person?.labels || "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase
      .from("people")
      .update(form)
      .eq("id", user.id);
    setLoading(false);
    if (error) setMessage("Error updating profile");
    else setMessage("Profile updated!");
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card shadow-lg rounded-xl p-8 flex flex-col gap-6 w-full max-w-md border border-border">
      <label className="font-semibold text-foreground flex flex-col gap-1">
        Email
        <input
          className="border border-input bg-background p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
          name="email"
          value={form.email}
          onChange={handleChange}
          type="email"
        />
      </label>
      <label className="font-semibold text-foreground flex flex-col gap-1">
        Full Name
        <input
          className="border border-input bg-background p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
          name="full_name"
          value={form.full_name}
          onChange={handleChange}
        />
      </label>
      <label className="font-semibold text-foreground flex flex-col gap-1">
        GitHub
        <input
          className="border border-input bg-background p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
          name="github_username"
          value={form.github_username}
          onChange={handleChange}
        />
      </label>
      <label className="font-semibold text-foreground flex flex-col gap-1">
        Twitter
        <input
          className="border border-input bg-background p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
          name="twitter_username"
          value={form.twitter_username}
          onChange={handleChange}
        />
      </label>
      <label className="font-semibold text-foreground flex flex-col gap-1">
        Label
        <input
          className="border border-input bg-background p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
          name="labels"
          value={form.labels}
          onChange={handleChange}
        />
      </label>
      <button
        type="submit"
        className="mt-2 py-2 px-4 rounded-md font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition border border-primary shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60"
        disabled={loading}
      >
        {loading ? "Saving..." : "Save"}
      </button>
      {message && <p className="mt-2 text-sm text-accent-foreground">{message}</p>}
    </form>
  );
} 