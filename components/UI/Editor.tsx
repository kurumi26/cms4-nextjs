"use client";

import { Editor } from "@tinymce/tinymce-react";
import { useRef } from "react";

interface TinyEditorProps {
  initialValue?: string;
  onChange: (content: string, editor?: any) => void;
}

export default function TinyEditor({ initialValue, onChange }: TinyEditorProps) {
  const editorRef = useRef(null);

  return (
    <Editor
      apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
      onInit={(evt, editor) => (editorRef.current = editor)}
      initialValue={initialValue || "<p>Write your content here...</p>"}
      init={{
        height: 1000,
        menubar: true,
        plugins: [
          "advlist", "autolink", "lists", "link", "image", "charmap",
          "preview", "anchor", "searchreplace", "visualblocks",
          "code", "fullscreen", "insertdatetime", "media", "table",
          "help", "wordcount"
        ],
        toolbar:
          "undo redo | blocks | " +
          "bold italic underline | alignleft aligncenter alignright alignjustify | " +
          "bullist numlist outdent indent | link image media | table | code preview",
        images_upload_url: "/api/upload",
        automatic_uploads: true,
      }}
      onEditorChange={onChange}
    />
  );
}
