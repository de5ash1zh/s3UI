"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import FolderIcon from "@/components/ui/folder-icon";
import FileIcon from "@/components/ui/file-icon";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Trash2, Download } from "lucide-react";
import ReactDOM from "react-dom";

// Type definition for a file or folder item
interface FileItemType {
  Key: string;
  Size?: number;
  LastModified?: string;
  type: "file" | "folder";
  children?: FileItemType[];
}

export type { FileItemType };

// FileItem component: displays a file or folder, handles expansion and upload
const FileItem: React.FC<{
  item: FileItemType;
  onRefresh?: () => void;
  selected?: boolean;
  toggleSelect?: (key: string) => void;
  highlightSelected?: boolean;
}> = ({
  item,
  onRefresh,
  selected = false,
  toggleSelect,
  highlightSelected = false,
}) => {
  // State for expansion, children, loading, and upload error
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState<FileItemType[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [dragOver, setDragOver] = useState(false);

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

  // Handler for renaming a file or folder
  const handleRename = async () => {
    if (!newName || newName === item.Key.split("/").pop()) {
      setRenaming(false);
      setNewName("");
      return;
    }
    // Clean new name and construct new key
    const cleanNewName = newName.replace(/\/+$/, "");
    const parentPath = item.Key.replace(/[^/]+\/?$/, "");
    const newKey =
      parentPath + cleanNewName + (item.type === "folder" ? "/" : "");
    // Call the API to rename (copy+delete) the object
    const res = await fetch(`/api/objects/rename`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        oldKey: item.Key,
        newKey,
      }),
    });
    if (res.ok && onRefresh) {
      await onRefresh();
    }
    setRenaming(false);
    setNewName("");
  };

  // Handler for deleting a file or folder
  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    const res = await fetch(`/api/objects/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: item.Key, isFolder: item.type === "folder" }),
    });
    if (res.ok && onRefresh) {
      await onRefresh();
    }
  };

  // Handler for downloading a file
  const handleDownload = async () => {
    // Get a pre-signed URL for the file
    const res = await fetch(
      `/api/objects/download?key=${encodeURIComponent(item.Key)}`
    );
    const data = await res.json();
    if (data.url) {
      window.open(data.url, "_blank");
    } else {
      // Optionally handle error (e.g., show a toast)
      alert("Failed to generate download link");
    }
  };

  // Handler for drag start
  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.setData("application/x-s3ui-key", item.Key);
    e.dataTransfer.effectAllowed = "move";
  };

  // Handler for drag over
  const handleDragOver = (e: React.DragEvent) => {
    if (item.type === "folder") {
      e.preventDefault();
      setDragOver(true);
    }
  };

  // Handler for drag leave
  const handleDragLeave = (e: React.DragEvent) => {
    if (item.type === "folder") {
      setDragOver(false);
    }
  };

  // Handler for drop
  const handleDrop = async (e: React.DragEvent) => {
    if (item.type !== "folder") return;
    setDragOver(false);
    const sourceKey = e.dataTransfer.getData("application/x-s3ui-key");
    if (!sourceKey || sourceKey === item.Key) return;
    // Compute new key
    const name = sourceKey.split("/").filter(Boolean).pop() || "";
    const destKey = item.Key + name + (sourceKey.endsWith("/") ? "/" : "");
    // Call the rename API
    await fetch(`/api/objects/rename`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldKey: sourceKey, newKey: destKey }),
    });
    if (onRefresh) await onRefresh();
  };

  // Render a file item
  if (item.type === "file") {
    return (
      <div
        className={`flex items-center px-2 py-1 rounded-md group relative transition-colors duration-150 ${
          highlightSelected && selected
            ? "bg-[#A1CDF4]/30"
            : "hover:bg-zinc-800/50"
        }`}
        draggable
        onDragStart={handleDragStart}
        tabIndex={0}
      >
        {/* Multi-select checkbox */}
        {toggleSelect && (
          <input
            type="checkbox"
            className="mr-2 w-5 h-5 accent-[#A1CDF4] rounded focus-visible:ring-2 focus-visible:ring-blue-400 transition-transform duration-100"
            checked={selected}
            onChange={() => toggleSelect(item.Key)}
            onClick={(e) => e.stopPropagation()}
            aria-label={selected ? "Deselect" : "Select"}
          />
        )}
        <span className="text-zinc-400 group-hover:text-zinc-300">
          <FileIcon />
        </span>
        {renaming ? (
          <input
            className="ml-2 px-1 py-0.5 rounded text-sm bg-zinc-900 text-zinc-100 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
              if (e.key === "Escape") {
                setRenaming(false);
                setNewName("");
              }
            }}
          />
        ) : (
          <span className="ml-2 font-medium text-zinc-100 truncate text-sm">
            {item.Key.split("/").pop() || item.Key}
          </span>
        )}
        {item.Size && (
          <span className="ml-auto text-xs text-zinc-500">
            {(item.Size / 1024).toFixed(1)} KB
          </span>
        )}
        {/* Download button removed */}
        {/* Rename button */}
        {!renaming && (
          <button
            className="ml-2 p-1 rounded hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-blue-400 transition-transform duration-100"
            title="Rename"
            onClick={() => {
              setRenaming(true);
              setNewName(item.Key.split("/").pop() || "");
            }}
            aria-label="Rename"
          >
            <Pencil className="w-4 h-4 text-zinc-400" />
          </button>
        )}
        {/* Delete button */}
        <button
          className="ml-2 p-1 rounded hover:bg-red-900 focus-visible:ring-2 focus-visible:ring-red-400 transition-transform duration-100"
          title="Delete"
          onClick={() => setShowDeleteConfirm(true)}
          aria-label="Delete"
        >
          <Trash2 className="w-4 h-4 text-red-400" />
        </button>
        {/* Delete confirmation dialog */}
        {showDeleteConfirm &&
          typeof window !== "undefined" &&
          ReactDOM.createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 shadow-xl flex flex-col items-center">
                <div className="text-zinc-100 mb-4 text-center">
                  Are you sure you want to delete{" "}
                  <span className="font-bold">{item.Key}</span>?<br />
                  This cannot be undone.
                </div>
                <div className="flex gap-4">
                  <button
                    className="px-4 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                    onClick={handleDelete}
                  >
                    Delete
                  </button>
                  <button
                    className="px-4 py-1 rounded bg-zinc-700 text-zinc-100 hover:bg-zinc-600"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}
      </div>
    );
  }

  // Render a folder item
  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={dragOver ? "bg-blue-900/30 rounded" : undefined}
    >
      <motion.div
        className={`flex items-center px-2 py-1 rounded-md group cursor-pointer relative transition-colors duration-150 ${
          highlightSelected && selected
            ? "bg-[#A1CDF4]/30"
            : "hover:bg-zinc-800/50"
        } ${loading ? "opacity-50" : ""}`}
        onClick={handleExpand}
        tabIndex={0}
      >
        {/* Multi-select checkbox */}
        {toggleSelect && (
          <input
            type="checkbox"
            className="mr-2 w-5 h-5 accent-[#A1CDF4] rounded focus-visible:ring-2 focus-visible:ring-blue-400 transition-transform duration-100"
            checked={selected}
            onChange={(e) => {
              e.stopPropagation();
              toggleSelect(item.Key);
            }}
            onClick={(e) => e.stopPropagation()}
            aria-label={selected ? "Deselect" : "Select"}
          />
        )}
        <motion.span
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-zinc-400 group-hover:text-zinc-300"
        >
          <FolderIcon open={expanded} />
        </motion.span>
        {renaming ? (
          <input
            className="ml-2 px-1 py-0.5 rounded text-sm bg-zinc-900 text-zinc-100 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
              if (e.key === "Escape") {
                setRenaming(false);
                setNewName("");
              }
            }}
          />
        ) : (
          <span className="ml-2 font-medium text-zinc-100 truncate text-sm">
            {item.Key.split("/").filter(Boolean).pop() || "Root"}
          </span>
        )}
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
          {/* Rename button */}
          {!renaming && (
            <button
              className="p-1 rounded hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-blue-400 transition-transform duration-100"
              title="Rename"
              onClick={(e) => {
                e.stopPropagation();
                setRenaming(true);
                setNewName(item.Key.split("/").filter(Boolean).pop() || "");
              }}
              aria-label="Rename"
            >
              <Pencil className="w-4 h-4 text-zinc-400" />
            </button>
          )}
          {/* Delete button */}
          <button
            className="p-1 rounded hover:bg-red-900 focus-visible:ring-2 focus-visible:ring-red-400 transition-transform duration-100"
            title="Delete"
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteConfirm(true);
            }}
            aria-label="Delete"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
          {/* Delete confirmation dialog */}
          {showDeleteConfirm &&
            typeof window !== "undefined" &&
            ReactDOM.createPortal(
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 shadow-xl flex flex-col items-center">
                  <div className="text-zinc-100 mb-4 text-center">
                    Are you sure you want to delete{" "}
                    <span className="font-bold">{item.Key}</span>?<br />
                    This cannot be undone.
                  </div>
                  <div className="flex gap-4">
                    <button
                      className="px-4 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                      onClick={handleDelete}
                    >
                      Delete
                    </button>
                    <button
                      className="px-4 py-1 rounded bg-zinc-700 text-zinc-100 hover:bg-zinc-600"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            )}
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
              <FileItem
                key={child.Key}
                item={child}
                onRefresh={loadFolderContents}
                selected={selected}
                toggleSelect={toggleSelect}
                highlightSelected={highlightSelected}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileItem;
