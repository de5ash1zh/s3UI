"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import FolderIcon from "@/components/ui/folder-icon";
import FileIcon from "@/components/ui/file-icon";
import { motion, AnimatePresence } from "framer-motion";

export type FileItemType = {
  Key: string;
  Size?: number;
  LastModified?: string;
  type: "file" | "folder";
  children?: FileItemType[];
};

export default function FileItem({ item }: { item: FileItemType }) {
  if (item.type === "folder") {
    const [expanded, setExpanded] = useState(false);
    const [children, setChildren] = useState<FileItemType[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleExpand = async () => {
      if (!expanded && children === null) {
        setLoading(true);
        setError(null);
        try {
          const res = await fetch(
            `/api/objects?prefix=${encodeURIComponent(item.Key)}`
          );
          const data = await res.json();
          setChildren(data.items || []);
        } catch (err) {
          setError("Failed to load folder contents");
        }
        setLoading(false);
      }
      setExpanded((prev) => !prev);
    };

    return (
      <li className="group border border-blue-200 rounded-lg p-2 bg-blue-50 hover:bg-blue-100 transition-all">
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 w-full px-2 py-1 text-left hover:bg-blue-100"
          onClick={handleExpand}
          aria-label={expanded ? "Collapse folder" : "Expand folder"}
        >
          <motion.span
            animate={{ rotate: expanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <FolderIcon open={expanded} />
          </motion.span>
          <span className="font-semibold text-blue-700 truncate">
            {item.Key.replace(/\/$/, "")}
          </span>
          <span className="ml-auto text-xs text-gray-400">
            {expanded ? "▼" : "▶"}
          </span>
        </Button>
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="ml-6 mt-2 space-y-1 overflow-hidden"
            >
              {loading && (
                <div className="text-xs text-gray-400">Loading...</div>
              )}
              {error && <div className="text-xs text-red-500">{error}</div>}
              {children && children.length > 0 && (
                <ul className="space-y-1">
                  {children.map((child) => (
                    <FileItem key={child.Key} item={child} />
                  ))}
                </ul>
              )}
              {children && children.length === 0 && !loading && !error && (
                <div className="text-xs text-gray-400">Empty folder</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </li>
    );
  }
  return (
    <li className="group border border-green-200 rounded-lg p-2 bg-green-50 hover:bg-green-100 transition-all flex items-center gap-2">
      <FileIcon />
      <span className="text-green-700 truncate">
        {item.Key.split("/").pop()}
      </span>
      <span className="text-xs text-gray-500 ml-auto">{item.Size} bytes</span>
      <a
        href={`https://s3.eu-north-1.amazonaws.com/s3ui--bucket/${encodeURIComponent(
          item.Key
        )}`}
        download
        target="_blank"
        rel="noopener noreferrer"
        className="ml-2 px-2 py-1 text-xs rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors"
      >
        Download
      </a>
    </li>
  );
}
