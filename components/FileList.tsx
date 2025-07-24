import React from "react";
import FileItem, { FileItemType } from "./FileItem";

export default function FileList({ items }: { items: FileItemType[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <FileItem key={item.Key} item={item} />
      ))}
    </ul>
  );
}
