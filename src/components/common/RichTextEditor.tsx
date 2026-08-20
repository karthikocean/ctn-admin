import { useState, useRef, useEffect } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Link,
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
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Sync initial or external value changes without losing cursor position
  useEffect(() => {
    if (editorRef.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || "";
      }
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const executeCommand = (command: string, arg: string = "") => {
    document.execCommand(command, false, arg);
    handleInput();
  };

  const handleLink = () => {
    const url = prompt("Enter the URL:");
    if (url) {
      executeCommand("createLink", url);
    }
  };

  const handleImage = () => {
    const url = prompt("Enter the Image URL:");
    if (url) {
      executeCommand("insertImage", url);
    }
  };

  const handleHeadingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const format = e.target.value;
    executeCommand("formatBlock", format);
  };

  return (
    <div className={`w-full rounded-xl border ${isFocused ? "border-primary ring-2 ring-primary/10" : "border-slate-200"} bg-white transition-all overflow-hidden flex flex-col`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 border-b border-slate-200">
        <select
          onChange={handleHeadingChange}
          defaultValue="p"
          className="h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer hover:bg-slate-50 transition-colors mr-2"
        >
          <option value="p">Normal</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>

        <div className="h-6 w-[1px] bg-slate-200 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
          onClick={() => executeCommand("bold")}
          title="Bold"
        >
          <Bold size={15} />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
          onClick={() => executeCommand("italic")}
          title="Italic"
        >
          <Italic size={15} />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
          onClick={() => executeCommand("underline")}
          title="Underline"
        >
          <Underline size={15} />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
          onClick={() => executeCommand("strikeThrough")}
          title="Strikethrough"
        >
          <Strikethrough size={15} />
        </Button>

        <div className="h-6 w-[1px] bg-slate-200 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
          onClick={() => executeCommand("insertOrderedList")}
          title="Ordered List"
        >
          <ListOrdered size={15} />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
          onClick={() => executeCommand("insertUnorderedList")}
          title="Unordered List"
        >
          <List size={15} />
        </Button>

        <div className="h-6 w-[1px] bg-slate-200 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
          onClick={handleLink}
          title="Insert Link"
        >
          <Link size={15} />
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
          onClick={() => executeCommand("removeFormat")}
          title="Clear Formatting"
        >
          <RemoveFormatting size={15} />
        </Button>
      </div>

      {/* Editor Content Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`h-[200px] p-4 text-sm text-slate-700 focus:outline-none overflow-y-auto cursor-text prose prose-sm max-w-none rich-editor ${editorClassName}`}
        data-placeholder={placeholder}
        style={{ outline: "none" }}
      />
    </div>
  );
};

export default RichTextEditor;
