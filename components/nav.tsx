"use client";

import * as React from "react";
import { UserButton } from "@clerk/nextjs";
const NavBar: React.FC = () => {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 px-6 py-4 flex justify-between items-center bg-zinc-950/70 backdrop-blur-md border-b border-zinc-800/40 shadow-lg">
      <div>
        <h1 className="font-extrabold text-2xl tracking-tight text-zinc-100 drop-shadow">
          S3UI
        </h1>
      </div>
      <div>
        <UserButton />
      </div>
    </nav>
  );
};
export default NavBar;
