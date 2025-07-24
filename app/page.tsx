import NavBar from "@/components/nav";
import FileExplorer from "@/components/FileExplorer";

export default function Page() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-zinc-900 to-indigo-900 relative">
      {/* Outer gradient background */}
      <div
        className="absolute inset-0 -z-10 bg-gradient-radial from-blue-200/20 via-transparent to-zinc-900/80"
        style={{ pointerEvents: "none" }}
      />
      {/* Navigation Bar */}
      <NavBar />
      {/* Centered S3 Explorer */}
      <main className="w-full flex items-center justify-center flex-1">
        <div className="w-full max-w-3xl px-2 sm:px-0">
          <FileExplorer />
        </div>
      </main>
    </div>
  );
}
