"use client";
import React, { useEffect, useState } from "react";
import FileList from "./FileList";
import { FileItemType } from "./FileItem";
import { Button } from "@/components/ui/button";
import { Trash2, FolderOpen, X } from "lucide-react";
import { useRef } from "react";

export default function FileExplorer() {
  const [items, setItems] = useState<FileItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [showBatchDelete, setShowBatchDelete] = useState(false);
  const [showBatchMove, setShowBatchMove] = useState(false);
  const [moveDestination, setMoveDestination] = useState("");

  // Function to refresh the file/folder list
  const refreshItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/objects");
      const data = await res.json();
      setItems(data.items);
    } catch (err) {
      setError("Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshItems();
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

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-zinc-950/50 rounded-lg border border-zinc-800/50 shadow-2xl backdrop-blur-sm">
      <h2 className="text-2xl font-bold text-zinc-100 mb-8 flex items-center justify-between">
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
      {/* Sticky batch actions bar */}
      {selectedKeys.length > 0 && (
        <div
          className="sticky top-0 z-40 mb-6 flex gap-3 items-center bg-[#A1CDF4]/90 p-3 rounded-xl shadow-lg border border-[#7C809B] animate-fade-in"
          aria-label="Batch actions bar"
        >
          <span className="text-zinc-900 text-base font-bold flex items-center gap-2">
            <span className="inline-block bg-[#7C809B] text-white rounded-full px-3 py-1 text-base font-bold animate-scale-in">
              {selectedKeys.length}
            </span>
            selected
          </span>
          <button
            className="p-2 rounded-lg hover:bg-[#B5B1B2] focus-visible:ring-2 focus-visible:ring-blue-400 transition"
            title="Delete selected"
            aria-label="Delete selected"
            onClick={() => setShowBatchDelete(true)}
          >
            <Trash2 className="w-5 h-5 text-red-600" />
          </button>
          <button
            className="p-2 rounded-lg hover:bg-[#B5B1B2] focus-visible:ring-2 focus-visible:ring-blue-400 transition"
            title="Move selected"
            aria-label="Move selected"
            onClick={() => setShowBatchMove(true)}
          >
            <FolderOpen className="w-5 h-5 text-blue-700" />
          </button>
          <button
            className="p-2 rounded-lg hover:bg-[#B5B1B2] focus-visible:ring-2 focus-visible:ring-blue-400 transition"
            title="Clear selection"
            aria-label="Clear selection"
            onClick={clearSelection}
          >
            <X className="w-5 h-5 text-zinc-700" />
          </button>
        </div>
      )}
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
                className="px-6 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-400 text-base font-semibold transition"
                onClick={handleBatchDelete}
                aria-label="Confirm delete"
              >
                Delete
              </button>
              <button
                className="px-6 py-2 rounded-lg bg-zinc-700 text-zinc-100 hover:bg-zinc-600 focus-visible:ring-2 focus-visible:ring-blue-400 text-base font-semibold transition"
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
                    className={`px-3 py-1 rounded-lg border text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-blue-400 ${
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
                className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-400 text-base font-semibold transition"
                onClick={handleBatchMove}
                disabled={!moveDestination}
                aria-label="Confirm move"
              >
                Move
              </button>
              <button
                className="px-6 py-2 rounded-lg bg-zinc-700 text-zinc-100 hover:bg-zinc-600 focus-visible:ring-2 focus-visible:ring-blue-400 text-base font-semibold transition"
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
          className="w-5 h-5 accent-[#A1CDF4] rounded focus-visible:ring-2 focus-visible:ring-blue-400 transition"
          aria-label="Select all"
        />
        <span className="text-zinc-100 text-base font-medium">Select All</span>
      </div>
      <FileList
        items={items}
        onRefresh={refreshItems}
        selectedKeys={selectedKeys}
        toggleSelect={toggleSelect}
        highlightSelected
      />
    </div>
  );
}
