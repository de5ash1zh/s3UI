import NavBar from "@/components/nav";
import FileExplorer from "@/components/FileExplorer";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <FileExplorer />
    </div>
  );
}
