import { Folder } from "lucide-react";

export default function FolderIcon({ open }: { open: boolean }) {
  return (
    <Folder className={`h-5 w-5 ${open ? "text-blue-600" : "text-blue-400"}`} />
  );
}
