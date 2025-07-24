import React from "react";
import FileItem, { FileItemType } from "./FileItem";

export default function FileList({
  items,
  onRefresh,
  selectedKeys = [],
  toggleSelect,
  highlightSelected = false,
  showFolderUsage = false,
  formatBytes,
  viewMode = "list",
}: {
  items: FileItemType[];
  onRefresh?: () => void;
  selectedKeys?: string[];
  toggleSelect?: (key: string) => void;
  highlightSelected?: boolean;
  showFolderUsage?: boolean;
  formatBytes?: (bytes: number) => string;
  viewMode?: "list" | "grid";
}) {
  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto">
        {items.map((item) => (
          <div
            key={item.Key}
            className={`rounded-xl bg-zinc-900/80 border border-zinc-800 p-3 shadow-lg transition-transform duration-200 hover:scale-103 hover:shadow-xl group ${
              highlightSelected && selectedKeys.includes(item.Key)
                ? "ring-2 ring-blue-400/60"
                : ""
            }`}
            style={{ minWidth: 0 }}
          >
            <FileItem
              item={item}
              onRefresh={onRefresh}
              selected={selectedKeys.includes(item.Key)}
              toggleSelect={toggleSelect}
              highlightSelected={highlightSelected}
            />
            {showFolderUsage &&
              item.type === "folder" &&
              Array.isArray(item.children) &&
              formatBytes && (
                <span className="mt-2 text-xs text-zinc-400 text-center block">
                  {item.children.length} files,{" "}
                  {formatBytes(
                    item.children.reduce((sum, f) => sum + (f.Size || 0), 0)
                  )}
                </span>
              )}
          </div>
        ))}
      </div>
    );
  }
  // List view (default)
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.Key} className="flex items-center">
          <FileItem
            item={item}
            onRefresh={onRefresh}
            selected={selectedKeys.includes(item.Key)}
            toggleSelect={toggleSelect}
            highlightSelected={highlightSelected}
          />
          {showFolderUsage &&
            item.type === "folder" &&
            Array.isArray(item.children) &&
            formatBytes && (
              <span className="ml-2 text-xs text-zinc-400">
                {item.children.length} files,{" "}
                {formatBytes(
                  item.children.reduce((sum, f) => sum + (f.Size || 0), 0)
                )}
              </span>
            )}
        </li>
      ))}
    </ul>
  );
}
