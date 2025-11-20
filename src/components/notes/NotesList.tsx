import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Pin } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Note {
  id: string;
  title: string;
  content: string;
  category: string | null;
  tags: string[] | null;
  is_pinned: boolean;
  created_at: string;
}

interface NotesListProps {
  notes: Note[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function NotesList({ notes, onEdit, onDelete }: NotesListProps) {
  const queryClient = useQueryClient();

  const togglePinMutation = useMutation({
    mutationFn: async ({ id, isPinned }: { id: string; isPinned: boolean }) => {
      const { error } = await supabase
        .from("notes")
        .update({ is_pinned: !isPinned })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      toast.success("تغییرات ذخیره شد");
    },
  });

  if (notes.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        یادداشتی یافت نشد
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {notes.map((note) => (
        <Card key={note.id} className="relative group hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <CardTitle className="text-lg line-clamp-1">{note.title}</CardTitle>
                <CardDescription className="text-sm">
                  {new Date(note.created_at).toLocaleDateString("fa-IR")}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => togglePinMutation.mutate({ id: note.id, isPinned: note.is_pinned })}
              >
                <Pin className={`w-4 h-4 ${note.is_pinned ? "fill-current text-primary" : ""}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
              {note.content.substring(0, 150)}...
            </p>
            <div className="flex items-center gap-2 mb-3">
              {note.category && (
                <Badge variant="secondary">{note.category}</Badge>
              )}
              {note.tags?.slice(0, 2).map((tag, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(note.id)}
                className="flex-1"
              >
                <Pencil className="w-3 h-3 ml-1" />
                ویرایش
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(note.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
