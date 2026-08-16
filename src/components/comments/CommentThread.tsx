"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CommentThread({
  comments,
  mediaId,
  storyId,
  personId,
}: {
  comments: { id: string; body: string; author: string; createdAt: string }[];
  mediaId?: string;
  storyId?: string;
  personId?: string;
}) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function send() {
    if (!body.trim()) return;
    setBusy(true);
    await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, mediaId, storyId, personId }),
    });
    setBody("");
    setBusy(false);
    router.refresh();
  }

  return (
    <div>
      <p className="kicker">זיכרונות נוספים</p>
      <div className="mt-6 space-y-6">
        {comments.map((c) => (
          <blockquote key={c.id} className="border-r-2 border-bronze pr-4">
            <p className="text-lg leading-relaxed">{c.body}</p>
            <footer className="mt-2 text-sm text-muted">{c.author}</footer>
          </blockquote>
        ))}
      </div>
      <div className="mt-8">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          placeholder="אני זוכר שהתמונה הזאת צולמה..."
        />
        <button
          type="button"
          disabled={busy}
          onClick={send}
          className="mt-3 cursor-pointer bg-ink px-5 py-2 text-cream"
        >
          הוספת זיכרון
        </button>
      </div>
    </div>
  );
}
