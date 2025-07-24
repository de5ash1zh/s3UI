"use client";

import * as React from "react";
import { UserButton } from "@clerk/nextjs";
const NavBar: React.FC = () => {
  return (
    <nav className="p-4 flex justify-between items-center bg-zinc-950/50 border-b border-zinc-800/50 backdrop-blur-sm">
      <div>
        <h1 className="font-medium text-zinc-100">S3UI</h1>
      </div>
      <div>
        <UserButton />
      </div>
    </nav>
  );
};
export default NavBar;
