"use client";

import { Editor } from "@tinymce/tinymce-react";
import { useRef } from "react";

interface TinyEditorProps {
  value?: string;
  onChange: (content: string) => void;
}

export default function TinyEditor({ value, onChange }: TinyEditorProps) {
  const editorRef = useRef<any>(null);

  return (
    <Editor
      apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
      value={value}
      onInit={(_, editor) => (editorRef.current = editor)}
      init={{
        height: 1000,
        menubar: true,
        content_css: "/css/custom.css",
        plugins: [
          "directionality",
          "advlist",
          "autolink",
          "lists",
          "link",
          "image",
          "media",
          "table",
          "insertdatetime",
          "searchreplace",
          "preview",
          "fullscreen",
          "code",
          "help",
          "wordcount",
        ],

        toolbar:
          "undo redo | blocks | " +
          "bold italic underline strikethrough | " +
          "alignleft aligncenter alignright alignjustify | " +
          "bullist numlist outdent indent | " +
          "link image media table | " +
          "ltr rtl | code preview fullscreen",

        // 🔒 LOCK LTR FOREVER
        content_style: `
          html, body {
            direction: ltr !important;
            unicode-bidi: plaintext !important;
            text-align: left !important;
          }
        `,
      }}
      onEditorChange={(content) => onChange(content)}
    />
  );
}
