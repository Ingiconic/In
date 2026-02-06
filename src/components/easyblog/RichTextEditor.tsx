import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Youtube from "@tiptap/extension-youtube";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, Quote, Code, Heading1, Heading2, Heading3,
  AlignLeft, AlignCenter, AlignRight, Link as LinkIcon, Image as ImageIcon,
  Table as TableIcon, Youtube as YoutubeIcon, Highlighter,
  Undo, Redo, Minus, Code2
} from "lucide-react";
import { cn } from "@/lib/utils";

const lowlight = createLowlight(common);

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

const MenuButton = ({ 
  onClick, 
  isActive = false, 
  children, 
  title 
}: { 
  onClick: () => void; 
  isActive?: boolean; 
  children: React.ReactNode; 
  title: string;
}) => (
  <Button
    type="button"
    variant="ghost"
    size="sm"
    onClick={onClick}
    title={title}
    className={cn(
      "h-8 w-8 p-0",
      isActive && "bg-primary/20 text-primary"
    )}
  >
    {children}
  </Button>
);

const RichTextEditor = ({ content, onChange, placeholder = "محتوای مقاله را بنویسید...", className }: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Underline,
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false }),
      Image.configure({ inline: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Youtube.configure({ width: 640, height: 360 }),
      CodeBlockLowlight.configure({ lowlight }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose dark:prose-invert max-w-none min-h-[300px] p-4 focus:outline-none",
        dir: "rtl",
      },
    },
  });

  useEffect(() => {
    if (editor && content && editor.getHTML() !== content) {
      editor.commands.setContent(content);
    }
  }, []);

  const addImage = useCallback(() => {
    const url = prompt("آدرس تصویر را وارد کنید:");
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const addLink = useCallback(() => {
    const url = prompt("آدرس لینک:");
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  const addYoutube = useCallback(() => {
    const url = prompt("آدرس ویدیو یوتیوب:");
    if (url && editor) {
      editor.commands.setYoutubeVideo({ src: url });
    }
  }, [editor]);

  const addTable = useCallback(() => {
    if (editor) {
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <div className={cn("border border-border rounded-xl overflow-hidden bg-card", className)}>
      {/* Toolbar */}
      <div className="border-b border-border bg-muted/30 p-2 flex flex-wrap gap-0.5">
        {/* Undo/Redo */}
        <MenuButton onClick={() => editor.chain().focus().undo().run()} title="بازگشت">
          <Undo className="w-4 h-4" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().redo().run()} title="تکرار">
          <Redo className="w-4 h-4" />
        </MenuButton>

        <div className="w-px h-8 bg-border mx-1" />

        {/* Headings */}
        <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive("heading", { level: 1 })} title="عنوان ۱">
          <Heading1 className="w-4 h-4" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive("heading", { level: 2 })} title="عنوان ۲">
          <Heading2 className="w-4 h-4" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive("heading", { level: 3 })} title="عنوان ۳">
          <Heading3 className="w-4 h-4" />
        </MenuButton>

        <div className="w-px h-8 bg-border mx-1" />

        {/* Text formatting */}
        <MenuButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive("bold")} title="بولد">
          <Bold className="w-4 h-4" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive("italic")} title="ایتالیک">
          <Italic className="w-4 h-4" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive("underline")} title="زیرخط">
          <UnderlineIcon className="w-4 h-4" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive("strike")} title="خط‌روی‌متن">
          <Strikethrough className="w-4 h-4" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleHighlight().run()} isActive={editor.isActive("highlight")} title="هایلایت">
          <Highlighter className="w-4 h-4" />
        </MenuButton>

        <div className="w-px h-8 bg-border mx-1" />

        {/* Alignment */}
        <MenuButton onClick={() => editor.chain().focus().setTextAlign("right").run()} isActive={editor.isActive({ textAlign: "right" })} title="راست‌چین">
          <AlignRight className="w-4 h-4" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().setTextAlign("center").run()} isActive={editor.isActive({ textAlign: "center" })} title="وسط‌چین">
          <AlignCenter className="w-4 h-4" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().setTextAlign("left").run()} isActive={editor.isActive({ textAlign: "left" })} title="چپ‌چین">
          <AlignLeft className="w-4 h-4" />
        </MenuButton>

        <div className="w-px h-8 bg-border mx-1" />

        {/* Lists */}
        <MenuButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive("bulletList")} title="لیست">
          <List className="w-4 h-4" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive("orderedList")} title="لیست شماره‌دار">
          <ListOrdered className="w-4 h-4" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive("blockquote")} title="نقل قول">
          <Quote className="w-4 h-4" />
        </MenuButton>

        <div className="w-px h-8 bg-border mx-1" />

        {/* Code */}
        <MenuButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive("code")} title="کد خطی">
          <Code className="w-4 h-4" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive("codeBlock")} title="بلاک کد">
          <Code2 className="w-4 h-4" />
        </MenuButton>

        <div className="w-px h-8 bg-border mx-1" />

        {/* Insert */}
        <MenuButton onClick={addLink} isActive={editor.isActive("link")} title="لینک">
          <LinkIcon className="w-4 h-4" />
        </MenuButton>
        <MenuButton onClick={addImage} title="تصویر">
          <ImageIcon className="w-4 h-4" />
        </MenuButton>
        <MenuButton onClick={addYoutube} title="ویدیو یوتیوب">
          <YoutubeIcon className="w-4 h-4" />
        </MenuButton>
        <MenuButton onClick={addTable} title="جدول">
          <TableIcon className="w-4 h-4" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="خط افقی">
          <Minus className="w-4 h-4" />
        </MenuButton>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />

      {/* Footer Stats */}
      <div className="border-t border-border bg-muted/20 px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{editor.storage.characterCount?.characters?.() || editor.getText().length} کاراکتر</span>
        <span>{editor.getText().split(/\s+/).filter(Boolean).length} کلمه</span>
      </div>
    </div>
  );
};

export default RichTextEditor;
