"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import FolderIcon from "@/components/ui/folder-icon";
import FileIcon from "@/components/ui/file-icon";
import { motion, AnimatePresence } from "framer-motion";

// Type definition for a file or folder item
interface FileItemType {
  Key: string;
  Size?: number;
  LastModified?: string;
  type: "file" | "folder";
  children?: FileItemType[];
}

// FileItem component: displays a file or folder, handles expansion and upload
const FileItem: React.FC<{ item: FileItemType }> = ({ item }) => {
  // State for expansion, children, loading, and upload error
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState<FileItemType[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Fetches the contents of a folder from the API
  const loadFolderContents = async () => {
    try {
      const response = await fetch(
        `/api/objects?prefix=${encodeURIComponent(item.Key)}`
      );
      if (!response.ok)
        throw new Error(`Failed to load folder contents: ${response.status}`);
      const data = await response.json();
      setChildren(data.items); // Set children to the items array from API
    } catch (error) {
      console.error("Error loading folder contents:", error);
      setChildren([]);
    }
  };

  // Handles expanding/collapsing a folder and loading its contents
  const handleExpand = async () => {
    if (!expanded && !children) {
      setLoading(true);
      await loadFolderContents();
      setLoading(false);
    }
    setExpanded(!expanded);
  };

  // Handles file upload to S3 via the API
  const handleUpload = async (file: File) => {
    setLoading(true);
    setUploadError(null);
    try {
      // Get a presigned upload URL from the API
      const uploadUrl = `/api/upload?key=${encodeURIComponent(
        `${item.Key}${item.Key.endsWith("/") ? "" : "/"}${file.name}`
      )}`;
      const response = await fetch(uploadUrl, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      const data = await response.json();
      if (!response.ok || !data.url) {
        throw new Error(`Failed to get upload URL: ${response.status}`);
      }
      // Upload the file to S3 using the presigned URL
      const uploadResponse = await fetch(data.url, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
      });
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error("Upload failed:", uploadResponse.status, errorText);
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }
      // Refresh folder contents after upload
      await loadFolderContents();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to upload file";
      console.error("Upload error:", message);
      setUploadError(message);
      setTimeout(() => setUploadError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Render a file item
  if (item.type === "file") {
    return (
      <div className="flex items-center px-2 py-1 hover:bg-zinc-800/50 rounded-md group relative">
        <span className="text-zinc-400 group-hover:text-zinc-300">
          <FileIcon />
        </span>
        <span className="ml-2 font-medium text-zinc-100 truncate text-sm">
          {item.Key.split("/").pop() || item.Key}
        </span>
        {item.Size && (
          <span className="ml-auto text-xs text-zinc-500">
            {(item.Size / 1024).toFixed(1)} KB
          </span>
        )}
      </div>
    );
  }

  // Render a folder item
  return (
    <div>
      <motion.div
        className={`flex items-center px-2 py-1 hover:bg-zinc-800/50 rounded-md group cursor-pointer relative ${
          loading ? "opacity-50" : ""
        }`}
        onClick={handleExpand}
      >
        <motion.span
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-zinc-400 group-hover:text-zinc-300"
        >
          <FolderIcon open={expanded} />
        </motion.span>
        <span className="ml-2 font-medium text-zinc-100 truncate text-sm">
          {item.Key.split("/").filter(Boolean).pop() || "Root"}
        </span>
        {/* Upload button and file input */}
        <div
          className="flex items-center ml-auto gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="file"
            id={`upload-${item.Key}`}
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              await handleUpload(file);
              e.target.value = "";
            }}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              document.getElementById(`upload-${item.Key}`)?.click();
            }}
            disabled={loading}
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                ⟳
              </motion.div>
            ) : (
              "+"
            )}
          </Button>
        </div>
        {/* Upload error message */}
        {uploadError && (
          <div className="absolute top-full left-0 right-0 bg-red-500/10 text-red-500 text-xs p-1 rounded mt-1">
            {uploadError}
          </div>
        )}
      </motion.div>
      {/* Animate and render children when expanded */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="ml-4 overflow-hidden"
          >
            {(Array.isArray(children) ? children : []).map((child) => (
              <FileItem key={child.Key} item={child} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileItem;
