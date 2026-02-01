import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText, Upload, Plus, Trash2, Edit, Check, X, Folder,
  FolderPlus, Eye, Download, Search, Filter, ChevronDown,
  ArrowLeft, Image, FileUp, Loader2, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

interface Category {
  id: string;
  parent_id: string | null;
  name: string;
  name_fa: string;
  description: string | null;
  icon: string;
  sort_order: number;
  is_active: boolean;
}

interface Handout {
  id: string;
  title: string;
  description: string | null;
  pdf_url: string;
  thumbnail_url: string | null;
  file_size: number | null;
  page_count: number | null;
  author: string | null;
  grade: string | null;
  subject: string | null;
  tags: string[];
  downloads_count: number;
  is_featured: boolean;
  is_active: boolean;
  status: string;
  category_id: string | null;
  created_at: string;
}

const AdminHandouts = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [handouts, setHandouts] = useState<Handout[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Category form
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    name_fa: "",
    description: "",
    icon: "📁",
    parent_id: "",
    sort_order: 0,
  });

  // Handout form
  const [showHandoutDialog, setShowHandoutDialog] = useState(false);
  const [editingHandout, setEditingHandout] = useState<Handout | null>(null);
  const [handoutForm, setHandoutForm] = useState({
    title: "",
    description: "",
    author: "",
    grade: "",
    subject: "",
    tags: "",
    category_id: "",
    is_featured: false,
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  useEffect(() => {
    fetchCategories();
    fetchHandouts();
  }, [statusFilter]);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("handout_categories")
      .select("*")
      .order("sort_order");

    if (!error && data) {
      setCategories(data);
    }
  };

  const fetchHandouts = async () => {
    setLoading(true);
    let query = supabase
      .from("handouts")
      .select("*")
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;

    if (!error && data) {
      setHandouts(data);
    }
    setLoading(false);
  };

  const handleCategorySubmit = async () => {
    if (!categoryForm.name_fa) {
      toast({ title: "نام دسته‌بندی الزامی است", variant: "destructive" });
      return;
    }

    const categoryData = {
      name: categoryForm.name || categoryForm.name_fa,
      name_fa: categoryForm.name_fa,
      description: categoryForm.description || null,
      icon: categoryForm.icon,
      parent_id: categoryForm.parent_id || null,
      sort_order: categoryForm.sort_order,
    };

    let error;
    if (editingCategory) {
      ({ error } = await supabase
        .from("handout_categories")
        .update(categoryData)
        .eq("id", editingCategory.id));
    } else {
      ({ error } = await supabase.from("handout_categories").insert(categoryData));
    }

    if (error) {
      toast({ title: "خطا در ذخیره دسته‌بندی", variant: "destructive" });
    } else {
      toast({ title: editingCategory ? "دسته‌بندی ویرایش شد" : "دسته‌بندی ایجاد شد" });
      setShowCategoryDialog(false);
      resetCategoryForm();
      fetchCategories();
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("آیا مطمئن هستید؟")) return;

    const { error } = await supabase.from("handout_categories").delete().eq("id", id);

    if (error) {
      toast({ title: "خطا در حذف", variant: "destructive" });
    } else {
      toast({ title: "دسته‌بندی حذف شد" });
      fetchCategories();
    }
  };

  const handleHandoutSubmit = async () => {
    if (!handoutForm.title) {
      toast({ title: "عنوان جزوه الزامی است", variant: "destructive" });
      return;
    }

    if (!editingHandout && !pdfFile) {
      toast({ title: "فایل PDF الزامی است", variant: "destructive" });
      return;
    }

    setUploading(true);

    try {
      let pdfUrl = editingHandout?.pdf_url || "";
      let thumbnailUrl = editingHandout?.thumbnail_url || "";
      let fileSize = editingHandout?.file_size || 0;

      // Upload PDF
      if (pdfFile) {
        const fileName = `${Date.now()}-${pdfFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("handouts")
          .upload(`pdfs/${fileName}`, pdfFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("handouts")
          .getPublicUrl(`pdfs/${fileName}`);

        pdfUrl = urlData.publicUrl;
        fileSize = pdfFile.size;
      }

      // Upload thumbnail
      if (thumbnailFile) {
        const fileName = `${Date.now()}-${thumbnailFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("handouts")
          .upload(`thumbnails/${fileName}`, thumbnailFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("handouts")
          .getPublicUrl(`thumbnails/${fileName}`);

        thumbnailUrl = urlData.publicUrl;
      }

      const handoutData = {
        title: handoutForm.title,
        description: handoutForm.description || null,
        author: handoutForm.author || null,
        grade: handoutForm.grade || null,
        subject: handoutForm.subject || null,
        tags: handoutForm.tags ? handoutForm.tags.split(",").map(t => t.trim()) : [],
        category_id: handoutForm.category_id || null,
        is_featured: handoutForm.is_featured,
        pdf_url: pdfUrl,
        thumbnail_url: thumbnailUrl || null,
        file_size: fileSize,
        status: "approved", // Admin uploads are auto-approved
      };

      let error;
      if (editingHandout) {
        ({ error } = await supabase
          .from("handouts")
          .update(handoutData)
          .eq("id", editingHandout.id));
      } else {
        ({ error } = await supabase.from("handouts").insert(handoutData));
      }

      if (error) throw error;

      toast({ title: editingHandout ? "جزوه ویرایش شد" : "جزوه آپلود شد" });
      setShowHandoutDialog(false);
      resetHandoutForm();
      fetchHandouts();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({ title: "خطا در آپلود", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleStatusChange = async (handout: Handout, status: string) => {
    const { error } = await supabase
      .from("handouts")
      .update({ status, approved_at: status === "approved" ? new Date().toISOString() : null })
      .eq("id", handout.id);

    if (error) {
      toast({ title: "خطا در تغییر وضعیت", variant: "destructive" });
    } else {
      toast({ title: `وضعیت به ${status === "approved" ? "تایید شده" : "رد شده"} تغییر کرد` });
      fetchHandouts();
    }
  };

  const handleDeleteHandout = async (id: string) => {
    if (!confirm("آیا مطمئن هستید؟")) return;

    const { error } = await supabase.from("handouts").delete().eq("id", id);

    if (error) {
      toast({ title: "خطا در حذف", variant: "destructive" });
    } else {
      toast({ title: "جزوه حذف شد" });
      fetchHandouts();
    }
  };

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: "",
      name_fa: "",
      description: "",
      icon: "📁",
      parent_id: "",
      sort_order: 0,
    });
  };

  const resetHandoutForm = () => {
    setEditingHandout(null);
    setHandoutForm({
      title: "",
      description: "",
      author: "",
      grade: "",
      subject: "",
      tags: "",
      category_id: "",
      is_featured: false,
    });
    setPdfFile(null);
    setThumbnailFile(null);
  };

  const openEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      name_fa: category.name_fa,
      description: category.description || "",
      icon: category.icon,
      parent_id: category.parent_id || "",
      sort_order: category.sort_order,
    });
    setShowCategoryDialog(true);
  };

  const openEditHandout = (handout: Handout) => {
    setEditingHandout(handout);
    setHandoutForm({
      title: handout.title,
      description: handout.description || "",
      author: handout.author || "",
      grade: handout.grade || "",
      subject: handout.subject || "",
      tags: handout.tags?.join(", ") || "",
      category_id: handout.category_id || "",
      is_featured: handout.is_featured,
    });
    setShowHandoutDialog(true);
  };

  const getCategoryName = (id: string | null) => {
    if (!id) return "بدون دسته‌بندی";
    const cat = categories.find(c => c.id === id);
    return cat?.name_fa || "نامشخص";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500">تایید شده</Badge>;
      case "rejected":
        return <Badge variant="destructive">رد شده</Badge>;
      default:
        return <Badge variant="secondary">در انتظار</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate("/admin")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">بازگشت</span>
          </button>

          <h1 className="font-bold text-lg">مدیریت جزوات</h1>

          <div className="w-20" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <Tabs defaultValue="handouts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="handouts" className="gap-2">
              <FileText className="w-4 h-4" />
              جزوات
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2">
              <Folder className="w-4 h-4" />
              دسته‌بندی‌ها
            </TabsTrigger>
          </TabsList>

          {/* Handouts Tab */}
          <TabsContent value="handouts" className="space-y-4">
            {/* Actions */}
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="flex items-center gap-3">
                <Dialog open={showHandoutDialog} onOpenChange={setShowHandoutDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={resetHandoutForm} className="gap-2">
                      <Upload className="w-4 h-4" />
                      آپلود جزوه
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingHandout ? "ویرایش جزوه" : "آپلود جزوه جدید"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label>عنوان *</Label>
                        <Input
                          value={handoutForm.title}
                          onChange={(e) => setHandoutForm({ ...handoutForm, title: e.target.value })}
                          placeholder="عنوان جزوه"
                        />
                      </div>
                      <div>
                        <Label>توضیحات</Label>
                        <Textarea
                          value={handoutForm.description}
                          onChange={(e) => setHandoutForm({ ...handoutForm, description: e.target.value })}
                          placeholder="توضیحات جزوه"
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>نویسنده</Label>
                          <Input
                            value={handoutForm.author}
                            onChange={(e) => setHandoutForm({ ...handoutForm, author: e.target.value })}
                            placeholder="نام نویسنده"
                          />
                        </div>
                        <div>
                          <Label>دسته‌بندی</Label>
                          <Select
                            value={handoutForm.category_id}
                            onValueChange={(v) => setHandoutForm({ ...handoutForm, category_id: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="انتخاب دسته‌بندی" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">بدون دسته‌بندی</SelectItem>
                              {categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.icon} {cat.name_fa}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>پایه تحصیلی</Label>
                          <Input
                            value={handoutForm.grade}
                            onChange={(e) => setHandoutForm({ ...handoutForm, grade: e.target.value })}
                            placeholder="مثلا: دوازدهم"
                          />
                        </div>
                        <div>
                          <Label>درس</Label>
                          <Input
                            value={handoutForm.subject}
                            onChange={(e) => setHandoutForm({ ...handoutForm, subject: e.target.value })}
                            placeholder="مثلا: ریاضی"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>برچسب‌ها (با کاما جدا کنید)</Label>
                        <Input
                          value={handoutForm.tags}
                          onChange={(e) => setHandoutForm({ ...handoutForm, tags: e.target.value })}
                          placeholder="کنکور, نکات کلیدی, خلاصه"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>فایل PDF {!editingHandout && "*"}</Label>
                          <div className="mt-1">
                            <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                              <FileUp className="w-5 h-5 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {pdfFile ? pdfFile.name : "انتخاب PDF"}
                              </span>
                              <input
                                type="file"
                                accept=".pdf"
                                className="hidden"
                                onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                              />
                            </label>
                          </div>
                        </div>
                        <div>
                          <Label>تصویر جلد</Label>
                          <div className="mt-1">
                            <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                              <Image className="w-5 h-5 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {thumbnailFile ? thumbnailFile.name : "انتخاب تصویر"}
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={handoutForm.is_featured}
                          onCheckedChange={(v) => setHandoutForm({ ...handoutForm, is_featured: v })}
                        />
                        <Label>جزوه ویژه</Label>
                      </div>
                      <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setShowHandoutDialog(false)}>
                          انصراف
                        </Button>
                        <Button onClick={handleHandoutSubmit} disabled={uploading}>
                          {uploading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin ml-2" />
                              در حال آپلود...
                            </>
                          ) : editingHandout ? (
                            "ذخیره تغییرات"
                          ) : (
                            "آپلود جزوه"
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه</SelectItem>
                    <SelectItem value="pending">در انتظار</SelectItem>
                    <SelectItem value="approved">تایید شده</SelectItem>
                    <SelectItem value="rejected">رد شده</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="text-sm text-muted-foreground">
                {handouts.length} جزوه
              </div>
            </div>

            {/* Handouts List */}
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">در حال بارگذاری...</div>
              ) : handouts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">جزوه‌ای یافت نشد</div>
              ) : (
                handouts.map((handout) => (
                  <motion.div
                    key={handout.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 bg-card rounded-xl border border-border/50 p-4"
                  >
                    {handout.thumbnail_url ? (
                      <img
                        src={handout.thumbnail_url}
                        alt={handout.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                        <FileText className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-sm truncate">{handout.title}</h3>
                        {handout.is_featured && (
                          <Badge className="bg-amber-500 text-xs">ویژه</Badge>
                        )}
                        {getStatusBadge(handout.status)}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{getCategoryName(handout.category_id)}</span>
                        {handout.grade && <span>• {handout.grade}</span>}
                        <span>• {handout.downloads_count} دانلود</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {handout.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStatusChange(handout, "approved")}
                            className="text-green-500 hover:text-green-600 hover:bg-green-500/10"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStatusChange(handout, "rejected")}
                            className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(handout.pdf_url, "_blank")}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditHandout(handout)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteHandout(handout.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4">
            <div className="flex items-center justify-between">
              <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
                <DialogTrigger asChild>
                  <Button onClick={resetCategoryForm} className="gap-2">
                    <FolderPlus className="w-4 h-4" />
                    دسته‌بندی جدید
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingCategory ? "ویرایش دسته‌بندی" : "دسته‌بندی جدید"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label>نام فارسی *</Label>
                      <Input
                        value={categoryForm.name_fa}
                        onChange={(e) => setCategoryForm({ ...categoryForm, name_fa: e.target.value })}
                        placeholder="مثلا: پایه دوازدهم"
                      />
                    </div>
                    <div>
                      <Label>نام انگلیسی</Label>
                      <Input
                        value={categoryForm.name}
                        onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                        placeholder="مثلا: Grade 12"
                      />
                    </div>
                    <div>
                      <Label>توضیحات</Label>
                      <Textarea
                        value={categoryForm.description}
                        onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                        placeholder="توضیحات دسته‌بندی"
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>آیکون</Label>
                        <Input
                          value={categoryForm.icon}
                          onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                          placeholder="📁"
                        />
                      </div>
                      <div>
                        <Label>ترتیب نمایش</Label>
                        <Input
                          type="number"
                          value={categoryForm.sort_order}
                          onChange={(e) => setCategoryForm({ ...categoryForm, sort_order: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>دسته‌بندی والد</Label>
                      <Select
                        value={categoryForm.parent_id}
                        onValueChange={(v) => setCategoryForm({ ...categoryForm, parent_id: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="بدون والد (دسته اصلی)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">بدون والد</SelectItem>
                          {categories
                            .filter(c => c.id !== editingCategory?.id)
                            .map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.icon} {cat.name_fa}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>
                        انصراف
                      </Button>
                      <Button onClick={handleCategorySubmit}>
                        {editingCategory ? "ذخیره" : "ایجاد"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <span className="text-sm text-muted-foreground">{categories.length} دسته‌بندی</span>
            </div>

            {/* Categories List */}
            <div className="space-y-2">
              {categories.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">دسته‌بندی‌ای وجود ندارد</div>
              ) : (
                categories.map((category) => (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 bg-card rounded-xl border border-border/50 p-4"
                  >
                    <div className="text-2xl">{category.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-bold text-sm">{category.name_fa}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {category.parent_id && (
                          <span>زیردسته: {getCategoryName(category.parent_id)}</span>
                        )}
                        <span>ترتیب: {category.sort_order}</span>
                      </div>
                    </div>
                    <Badge variant={category.is_active ? "default" : "secondary"}>
                      {category.is_active ? "فعال" : "غیرفعال"}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => openEditCategory(category)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteCategory(category.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminHandouts;