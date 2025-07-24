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
}: {
  items: FileItemType[];
  onRefresh?: () => void;
  selectedKeys?: string[];
  toggleSelect?: (key: string) => void;
  highlightSelected?: boolean;
  showFolderUsage?: boolean;
  formatBytes?: (bytes: number) => string;
}) {
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
          {/* Folder usage info */}
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
