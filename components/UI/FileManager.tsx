{/**

"use client";

import { useState } from "react";
import FileManager from "react-file-manager";

export default function FileManagerUI() {
    
  const [files, setFiles] = useState([
    {
      id: "1",
      name: "Documents",
      type: "folder",
      modified: new Date(),
    },
    {
      id: "2",
      name: "Images",
      type: "folder",
      modified: new Date(),
    },
    {
      id: "3",
      name: "photo.png",
      type: "file",
      modified: new Date(),
      size: 1024,
    },
  ]);
  return (
    <div>
    </div>
  );
}
*/}