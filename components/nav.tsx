"use client";

import * as React from "react";
import { UserButton } from "@clerk/nextjs";
const NavBar: React.FC = () => {
  return (
    <nav className="p-4 flex justify-between items-center bg-gray-800 text-white">
      <div>
        <h1 className="font-bold">S3UI</h1>
      </div>
      <div>
        <UserButton />
      </div>
    </nav>
  );
};
export default NavBar;
