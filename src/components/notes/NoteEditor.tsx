import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, X, Bold, Italic, List, Code } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { InlineMath, BlockMath } from "react-katex";
import "katex/dist/katex.min.css";

interface NoteEditorProps {
  noteId: string | null;
  onClose: () => void;
}

export default function NoteEditor({ noteId, onClose }: NoteEditorProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("academic");
  const [tags, setTags] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const queryClient = useQueryClient();

  const { data: note } = useQuery({
    queryKey: ["note", noteId],
    queryFn: async () => {
      if (!noteId) return null;
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("id", noteId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!noteId,
  });

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setCategory(note.category || "academic");
      setTags(note.tags?.join(", ") || "");
    }
  }, [note]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const noteData = {
        title,
        content,
        category,
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        user_id: user.id,
      };

      if (noteId) {
        const { error } = await supabase
          .from("notes")
          .update(noteData)
          .eq("id", noteId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("notes").insert(noteData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      toast.success(noteId ? "یادداشت ذخیره شد" : "یادداشت ایجاد شد");
      onClose();
    },
  });

  const insertFormatting = (before: string, after: string = before) => {
    const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newContent = content.substring(0, start) + before + selectedText + after + content.substring(end);
    setContent(newContent);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{noteId ? "ویرایش یادداشت" : "یادداشت جدید"}</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid gap-4">
        <Input
          placeholder="عنوان یادداشت..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-xl font-semibold"
        />

        <div className="flex gap-2">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="academic">درسی</SelectItem>
              <SelectItem value="personal">شخصی</SelectItem>
              <SelectItem value="project">پروژه</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="تگ‌ها (با کاما جدا کنید)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="flex-1"
          />
        </div>

        <div className="flex gap-2 border-b pb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertFormatting("**")}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertFormatting("*")}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertFormatting("\n- ")}
            title="List"
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertFormatting("`")}
            title="Code"
          >
            <Code className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertFormatting("$$\n", "\n$$")}
            title="Math (LaTeX)"
          >
            𝑓(𝑥)
          </Button>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? "ویرایش" : "پیش‌نمایش"}
          </Button>
        </div>

        {showPreview ? (
          <div className="border rounded-lg p-4 min-h-[400px] prose prose-sm max-w-none">
            <ReactMarkdown
              components={{
                code: ({ children }) => {
                  const content = String(children);
                  if (content.startsWith("$$") && content.endsWith("$$")) {
                    return <BlockMath math={content.slice(2, -2)} />;
                  }
                  if (content.startsWith("$") && content.endsWith("$")) {
                    return <InlineMath math={content.slice(1, -1)} />;
                  }
                  return <code>{children}</code>;
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        ) : (
          <Textarea
            placeholder="محتوای یادداشت... (پشتیبانی از Markdown و LaTeX با $$ فرمول $$)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[400px] font-mono"
          />
        )}

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            انصراف
          </Button>
          <Button onClick={() => saveMutation.mutate()} disabled={!title || !content}>
            <Save className="w-4 h-4 ml-2" />
            ذخیره
          </Button>
        </div>
      </div>
    </div>
  );
}
