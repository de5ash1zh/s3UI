"use client";
import React, { useEffect, useState } from "react";
import FileList from "./FileList";
import { FileItemType } from "./FileItem";
import { Button } from "@/components/ui/button";
import {
  Trash2,
  FolderOpen,
  X,
  LayoutGrid,
  List as ListIcon,
} from "lucide-react";
import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Utility to format bytes as human-readable string
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function FileExplorer() {
  const [items, setItems] = useState<FileItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalSize, setTotalSize] = useState<number>(0);
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showBatchDelete, setShowBatchDelete] = useState(false);
  const [showBatchMove, setShowBatchMove] = useState(false);
  const [moveDestination, setMoveDestination] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // Function to refresh the file/folder list and storage usage
  const refreshItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/objects");
      const data = await res.json();
      setItems(data.items);
      setTotalCount(data.totalCount || 0);
      setTotalSize(data.totalSize || 0);
    } catch (err) {
      setError("Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch activity log
  const fetchActivityLog = async () => {
    try {
      const res = await fetch("/api/objects/activity");
      const data = await res.json();
      setActivityLog(data.log || []);
    } catch (err) {
      // Ignore errors for now
    }
  };

  useEffect(() => {
    refreshItems();
    fetchActivityLog();
    // Optionally, poll activity log every 10s
    const interval = setInterval(fetchActivityLog, 10000);
    return () => clearInterval(interval);
  }, []);

  // Handler for creating a new folder
  const handleCreateFolder = async () => {
    if (!newFolderName) return;
    const res = await fetch(
      `/api/objects?prefix=${encodeURIComponent(newFolderName)}/`,
      {
        method: "POST",
      }
    );
    if (res.ok) {
      await refreshItems();
      setCreatingFolder(false);
      setNewFolderName("");
    } else {
      alert("Failed to create folder");
    }
  };

  // Handler to toggle selection of a single item
  const toggleSelect = (key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Handler to select all items
  const selectAll = () => {
    setSelectedKeys(items.map((item) => item.Key));
  };

  // Handler to clear all selections
  const clearSelection = () => {
    setSelectedKeys([]);
  };

  // Handler for batch delete
  const handleBatchDelete = async () => {
    setShowBatchDelete(false);
    if (!selectedKeys.length) return;
    if (!confirm(`Delete ${selectedKeys.length} items? This cannot be undone.`))
      return;
    await Promise.all(
      selectedKeys.map((key) =>
        fetch(`/api/objects/delete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, isFolder: key.endsWith("/") }),
        })
      )
    );
    await refreshItems();
    setSelectedKeys([]);
  };

  // Handler for batch move
  const handleBatchMove = async () => {
    setShowBatchMove(false);
    if (!moveDestination) return;
    await Promise.all(
      selectedKeys.map((key) => {
        const name = key.split("/").filter(Boolean).pop() || "";
        const destKey = moveDestination + name + (key.endsWith("/") ? "/" : "");
        return fetch(`/api/objects/rename`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ oldKey: key, newKey: destKey }),
        });
      })
    );
    await refreshItems();
    setSelectedKeys([]);
    setMoveDestination("");
  };

  // Get all folders for move picker
  const allFolders = items.filter((i) => i.type === "folder");
  const moveInputRef = useRef<HTMLInputElement>(null);

  if (loading)
    return (
      <AnimatePresence>
        <motion.div
          key="loader"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        >
          <div className="rounded-full bg-zinc-900/80 px-6 py-4 text-white text-lg font-bold shadow-xl">
            Loading<span className="animate-pulse">...</span>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <motion.div
      className="max-w-2xl w-full mx-auto mt-4 sm:mt-12 p-4 sm:p-8 bg-gradient-to-br from-zinc-900/80 via-zinc-950/90 to-blue-950/80 rounded-3xl border border-zinc-800/60 shadow-2xl backdrop-blur-xl font-sans"
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Storage Usage */}
      <motion.div
        className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-8 text-zinc-200 text-base sm:text-lg font-semibold"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
      >
        <span>Files: {totalCount}</span>
        <span>Storage: {formatBytes(totalSize)}</span>
      </motion.div>
      <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-100 mb-8 flex items-center justify-between tracking-tight">
        S3 Explorer
        {/* New Folder Button and Input */}
        {creatingFolder ? (
          <div className="flex gap-2 items-center">
            <input
              className="rounded px-2 py-1 text-sm border border-zinc-700 bg-zinc-900 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
              type="text"
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateFolder();
                if (e.key === "Escape") {
                  setCreatingFolder(false);
                  setNewFolderName("");
                }
              }}
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={handleCreateFolder}
              disabled={!newFolderName}
            >
              Create
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setCreatingFolder(false);
                setNewFolderName("");
              }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCreatingFolder(true)}
          >
            + New Folder
          </Button>
        )}
      </h2>
      {/* Grid/List Toggle - always visible above file list */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-zinc-400 text-sm font-medium">View:</span>
        <button
          className={`p-2 rounded-lg ${
            viewMode === "list" ? "bg-blue-700/20" : "hover:bg-zinc-800"
          } transition`}
          title="List view"
          aria-label="List view"
          onClick={() => setViewMode("list")}
        >
          <ListIcon
            className={`w-5 h-5 ${
              viewMode === "list" ? "text-blue-400" : "text-zinc-400"
            }`}
          />
        </button>
        <button
          className={`p-2 rounded-lg ${
            viewMode === "grid" ? "bg-blue-700/20" : "hover:bg-zinc-800"
          } transition`}
          title="Grid view"
          aria-label="Grid view"
          onClick={() => setViewMode("grid")}
        >
          <LayoutGrid
            className={`w-5 h-5 ${
              viewMode === "grid" ? "text-blue-400" : "text-zinc-400"
            }`}
          />
        </button>
      </div>
      <div className="border-b border-zinc-700/60 mb-6" />
      {/* Sticky batch actions bar */}
      <AnimatePresence>
        {selectedKeys.length > 0 && (
          <motion.div
            className="sticky top-0 z-40 mb-6 flex gap-3 items-center bg-zinc-900/90 p-3 rounded-xl shadow-lg border border-zinc-800"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <span className="text-white text-base font-bold flex items-center gap-2">
              <span className="inline-block bg-[#7C809B] text-white rounded-full px-3 py-1 text-base font-bold animate-scale-in">
                {selectedKeys.length}
              </span>
              selected
            </span>
            <button
              className="p-2 rounded-lg hover:bg-[#B5B1B2] focus-visible:ring-2 focus-visible:ring-blue-400 transition-transform duration-150 active:scale-95"
              title="Delete selected"
              aria-label="Delete selected"
              onClick={() => setShowBatchDelete(true)}
            >
              <Trash2 className="w-5 h-5 text-red-600" />
            </button>
            <button
              className="p-2 rounded-lg hover:bg-[#B5B1B2] focus-visible:ring-2 focus-visible:ring-blue-400 transition-transform duration-150 active:scale-95"
              title="Move selected"
              aria-label="Move selected"
              onClick={() => setShowBatchMove(true)}
            >
              <FolderOpen className="w-5 h-5 text-blue-700" />
            </button>
            <button
              className="p-2 rounded-lg hover:bg-[#B5B1B2] focus-visible:ring-2 focus-visible:ring-blue-400 transition-transform duration-150 active:scale-95"
              title="Clear selection"
              aria-label="Clear selection"
              onClick={clearSelection}
            >
              <X className="w-5 h-5 text-zinc-700" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Divider */}
      <div className="border-b border-[#B5B1B2] mb-4" />
      {/* Batch Delete Confirmation Modal */}
      {showBatchDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in"
          aria-modal="true"
          role="dialog"
        >
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 shadow-2xl flex flex-col items-center min-w-[320px] max-w-[90vw] animate-slide-in">
            <div className="text-zinc-100 mb-6 text-center text-lg font-semibold">
              Are you sure you want to delete these {selectedKeys.length} items?
              <ul className="text-xs text-zinc-400 mt-3 max-h-32 overflow-y-auto text-left">
                {selectedKeys.map((k) => (
                  <li key={k} className="truncate">
                    {k}
                  </li>
                ))}
              </ul>
              <span className="block mt-2 text-red-400 font-bold">
                This cannot be undone.
              </span>
            </div>
            <div className="flex gap-6">
              <button
                className="px-6 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-400 text-base font-semibold transition-transform duration-150 active:scale-95"
                onClick={handleBatchDelete}
                aria-label="Confirm delete"
              >
                Delete
              </button>
              <button
                className="px-6 py-2 rounded-lg bg-zinc-700 text-zinc-100 hover:bg-zinc-600 focus-visible:ring-2 focus-visible:ring-blue-400 text-base font-semibold transition-transform duration-150 active:scale-95"
                onClick={() => setShowBatchDelete(false)}
                aria-label="Cancel delete"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Batch Move Modal */}
      {showBatchMove && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in"
          aria-modal="true"
          role="dialog"
        >
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 shadow-2xl flex flex-col items-center min-w-[320px] max-w-[90vw] animate-slide-in">
            <div className="text-zinc-100 mb-6 text-center text-lg font-semibold">
              Move {selectedKeys.length} items to folder:
              <div className="flex flex-wrap gap-2 mt-3 justify-center">
                {allFolders.map((f) => (
                  <button
                    key={f.Key}
                    className={`px-3 py-1 rounded-lg border text-sm font-medium transition-transform duration-150 active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-400 ${
                      moveDestination === f.Key
                        ? "bg-[#A1CDF4] text-zinc-900 border-[#7C809B]"
                        : "bg-zinc-800 text-zinc-100 border-zinc-700 hover:bg-zinc-700"
                    }`}
                    onClick={() => setMoveDestination(f.Key)}
                    aria-label={`Move to ${f.Key}`}
                  >
                    {f.Key}
                  </button>
                ))}
              </div>
              <input
                ref={moveInputRef}
                className="mt-4 rounded px-2 py-1 text-sm border border-zinc-700 bg-zinc-800 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
                type="text"
                placeholder="Or enter destination folder (e.g. myfolder/)"
                value={moveDestination}
                onChange={(e) => setMoveDestination(e.target.value)}
                aria-label="Destination folder"
              />
            </div>
            <div className="flex gap-6">
              <button
                className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-400 text-base font-semibold transition-transform duration-150 active:scale-95"
                onClick={handleBatchMove}
                disabled={!moveDestination}
                aria-label="Confirm move"
              >
                Move
              </button>
              <button
                className="px-6 py-2 rounded-lg bg-zinc-700 text-zinc-100 hover:bg-zinc-600 focus-visible:ring-2 focus-visible:ring-blue-400 text-base font-semibold transition-transform duration-150 active:scale-95"
                onClick={() => setShowBatchMove(false)}
                aria-label="Cancel move"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Select All checkbox */}
      <div className="mb-4 flex items-center gap-3">
        <input
          type="checkbox"
          checked={selectedKeys.length === items.length && items.length > 0}
          onChange={(e) => (e.target.checked ? selectAll() : clearSelection())}
          className="w-5 h-5 accent-[#A1CDF4] rounded focus-visible:ring-2 focus-visible:ring-blue-400 transition-transform duration-150 active:scale-95"
          aria-label="Select all"
        />
        <span className="text-zinc-100 text-base font-medium">Select All</span>
      </div>
      <div className="overflow-x-auto">
        <FileList
          items={items}
          onRefresh={refreshItems}
          selectedKeys={selectedKeys}
          toggleSelect={toggleSelect}
          highlightSelected
          showFolderUsage
          formatBytes={formatBytes}
          viewMode={viewMode}
        />
      </div>
      <div className="mt-10 sm:mt-12 bg-zinc-900/80 rounded-2xl p-4 sm:p-6 border border-zinc-800/60 shadow-lg">
        <div className="text-zinc-100 text-lg sm:text-xl font-bold mb-4">
          Activity Log
        </div>
        <ul className="max-h-48 sm:max-h-64 overflow-y-auto text-xs sm:text-sm text-zinc-300 space-y-3 sm:space-y-2">
          {activityLog.length === 0 && <li>No recent activity.</li>}
          {activityLog.map((entry, idx) => (
            <li
              key={idx}
              className="flex flex-col sm:flex-row gap-1 sm:gap-2 items-start sm:items-center w-full"
            >
              <div className="flex gap-2 items-center w-full">
                <span
                  className={
                    entry.type === "delete"
                      ? "text-red-400"
                      : entry.type === "move"
                      ? "text-blue-400"
                      : "text-zinc-300"
                  }
                >
                  {entry.type === "delete"
                    ? "Deleted"
                    : entry.type === "move"
                    ? "Moved"
                    : entry.type}
                </span>
                <span
                  className="truncate max-w-[140px] sm:max-w-xs text-zinc-100 font-medium"
                  title={entry.key || entry.oldKey}
                >
                  {entry.key || entry.oldKey}
                </span>
                {entry.newKey && (
                  <span
                    className="truncate max-w-[140px] sm:max-w-xs text-zinc-100 font-medium"
                    title={entry.newKey}
                  >
                    &rarr; {entry.newKey}
                  </span>
                )}
              </div>
              <span className="ml-0 sm:ml-auto text-xs text-zinc-500 w-full sm:w-auto">
                {new Date(entry.timestamp).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
