import React from "react";
import FileItem, { FileItemType } from "./FileItem";

export default function FileList({
  items,
  onRefresh,
  selectedKeys = [],
  toggleSelect,
  highlightSelected = false,
}: {
  items: FileItemType[];
  onRefresh?: () => void;
  selectedKeys?: string[];
  toggleSelect?: (key: string) => void;
  highlightSelected?: boolean;
}) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <FileItem
          key={item.Key}
          item={item}
          onRefresh={onRefresh}
          selected={selectedKeys.includes(item.Key)}
          toggleSelect={toggleSelect}
          highlightSelected={highlightSelected}
        />
      ))}
    </ul>
  );
}
