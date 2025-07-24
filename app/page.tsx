import NavBar from "@/components/nav";
import FileExplorer from "@/components/FileExplorer";

export default function Home() {
  return (
    <div className="min-h-screen bg-black">
      <div className="min-h-screen bg-zinc-950/30 backdrop-blur-3xl">
        <NavBar />
        <FileExplorer />
      </div>
    </div>
  );
}
