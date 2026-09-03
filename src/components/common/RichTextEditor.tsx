import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";

import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  RemoveFormatting
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  editorClassName?: string;
}

const RichTextEditor = ({
  value,
  onChange,
  placeholder = "Enter Description",
  className = "",
  editorClassName = ""
}: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        }
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline cursor-pointer"
        }
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg my-2"
        }
      }),
      Placeholder.configure({
        placeholder
      })
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html === "<p></p>" ? "" : html);
    },
    editorProps: {
      attributes: {
        class: `focus:outline-none min-h-[180px] p-4 text-sm text-slate-700 cursor-text ${editorClassName}`
      }
    }
  });

  // Sync external value changes (e.g. initial load or form reset)
  useEffect(() => {
    if (editor && value !== undefined) {
      const currentHTML = editor.getHTML();
      if (currentHTML !== value && !(currentHTML === "<p></p>" && value === "")) {
        editor.commands.setContent(value || "");
      }
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  const setHeading = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "p") {
      editor.chain().focus().setParagraph().run();
    } else if (val === "h1") {
      editor.chain().focus().toggleHeading({ level: 1 }).run();
    } else if (val === "h2") {
      editor.chain().focus().toggleHeading({ level: 2 }).run();
    } else if (val === "h3") {
      editor.chain().focus().toggleHeading({ level: 3 }).run();
    }
  };

  const getCurrentHeadingValue = () => {
    if (editor.isActive("heading", { level: 1 })) return "h1";
    if (editor.isActive("heading", { level: 2 })) return "h2";
    if (editor.isActive("heading", { level: 3 })) return "h3";
    return "p";
  };

  const handleLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL:", previousUrl);

    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const handleImage = () => {
    const url = window.prompt("Enter Image URL:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div className={`w-full rounded-xl border border-slate-200 bg-white transition-all overflow-hidden flex flex-col focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 border-b border-slate-200">
        <select
          value={getCurrentHeadingValue()}
          onChange={setHeading}
          className="h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer hover:bg-slate-50 transition-colors mr-1"
        >
          <option value="p">Normal</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>

        <div className="h-5 w-[1px] bg-slate-200 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`h-8 w-8 rounded-lg transition-colors ${editor.isActive("bold") ? "bg-slate-200 text-slate-900 font-bold" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <Bold size={15} />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`h-8 w-8 rounded-lg transition-colors ${editor.isActive("italic") ? "bg-slate-200 text-slate-900" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <Italic size={15} />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`h-8 w-8 rounded-lg transition-colors ${editor.isActive("underline") ? "bg-slate-200 text-slate-900" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"}`}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline"
        >
          <UnderlineIcon size={15} />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`h-8 w-8 rounded-lg transition-colors ${editor.isActive("strike") ? "bg-slate-200 text-slate-900" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"}`}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
        >
          <Strikethrough size={15} />
        </Button>

        <div className="h-5 w-[1px] bg-slate-200 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`h-8 w-8 rounded-lg transition-colors ${editor.isActive("bulletList") ? "bg-slate-200 text-slate-900" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"}`}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
        >
          <List size={15} />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`h-8 w-8 rounded-lg transition-colors ${editor.isActive("orderedList") ? "bg-slate-200 text-slate-900" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"}`}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered List"
        >
          <ListOrdered size={15} />
        </Button>

        <div className="h-5 w-[1px] bg-slate-200 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`h-8 w-8 rounded-lg transition-colors ${editor.isActive("link") ? "bg-slate-200 text-slate-900" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"}`}
          onClick={handleLink}
          title="Insert Link"
        >
          <LinkIcon size={15} />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
          onClick={handleImage}
          title="Insert Image"
        >
          <ImageIcon size={15} />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          title="Clear Formatting"
        >
          <RemoveFormatting size={15} />
        </Button>
      </div>

      {/* Editor Content Area */}
      <div className="max-h-[300px] overflow-y-auto flex-1 bg-white">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default RichTextEditor;

