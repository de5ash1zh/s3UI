"use client";
import React, { useEffect, useState } from "react";
import FileList from "./FileList";
import { FileItemType } from "./FileItem";

export default function FileExplorer() {
  const [items, setItems] = useState<FileItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/objects")
      .then((res) => res.json())
      .then((data) => {
        setItems(data.items);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load files");
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-zinc-950/50 rounded-lg border border-zinc-800/50 shadow-2xl backdrop-blur-sm">
      <h2 className="text-lg font-medium text-zinc-100 mb-6">S3 Explorer</h2>
      <FileList items={items} />
    </div>
  );
}
