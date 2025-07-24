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
    <div className="max-w-2xl mx-auto mt-8 p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">File Explorer</h2>
      <FileList items={items} />
    </div>
  );
}
