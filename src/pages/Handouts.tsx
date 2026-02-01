import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, Download, Eye, Search, Filter, ChevronRight, 
  ArrowLeft, BookOpen, Folder, FolderOpen, Star, Clock,
  Grid, List, SortAsc, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Category {
  id: string;
  parent_id: string | null;
  name: string;
  name_fa: string;
  description: string | null;
  icon: string;
  children?: Category[];
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
  views_count: number;
  is_featured: boolean;
  category_id: string | null;
  created_at: string;
}

const Handouts = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [handouts, setHandouts] = useState<Handout[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Category[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchHandouts();
  }, [selectedCategory]);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("handout_categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");

    if (!error && data) {
      // Build tree structure
      const buildTree = (items: Category[], parentId: string | null = null): Category[] => {
        return items
          .filter(item => item.parent_id === parentId)
          .map(item => ({
            ...item,
            children: buildTree(items, item.id)
          }));
      };

      if (selectedCategory) {
        // Show only subcategories of selected
        const subcats = data.filter(c => c.parent_id === selectedCategory);
        setCategories(subcats);
      } else {
        // Show root categories
        const rootCats = data.filter(c => !c.parent_id);
        setCategories(rootCats);
      }
    }
  };

  const fetchHandouts = async () => {
    setLoading(true);
    let query = supabase
      .from("handouts")
      .select("*")
      .eq("status", "approved")
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });

    if (selectedCategory) {
      query = query.eq("category_id", selectedCategory);
    }

    if (searchQuery) {
      query = query.ilike("title", `%${searchQuery}%`);
    }

    const { data, error } = await query;

    if (!error && data) {
      setHandouts(data);
    }
    setLoading(false);
  };

  const handleCategoryClick = async (category: Category) => {
    setSelectedCategory(category.id);
    setBreadcrumbs([...breadcrumbs, category]);
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      setSelectedCategory(null);
      setBreadcrumbs([]);
    } else {
      const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
      setBreadcrumbs(newBreadcrumbs);
      setSelectedCategory(newBreadcrumbs[newBreadcrumbs.length - 1].id);
    }
  };

  const handleDownload = async (handout: Handout) => {
    // Increment download count
    await supabase.rpc("increment_handout_downloads", { handout_id_param: handout.id });
    
    // Open PDF in new tab
    window.open(handout.pdf_url, "_blank");
    
    toast({
      title: "دانلود شروع شد",
      description: handout.title,
    });
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "نامشخص";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const featuredHandouts = handouts.filter(h => h.is_featured);
  const regularHandouts = handouts.filter(h => !h.is_featured);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium hidden sm:inline">بازگشت</span>
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">جزوات</h1>
              <p className="text-[10px] text-muted-foreground">کتابخانه PDF</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            >
              {viewMode === "grid" ? <List className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchHandouts()}
              placeholder="جستجوی جزوه..."
              className="pr-12 h-12 text-base rounded-2xl bg-card border-border/50"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  fetchHandouts();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            )}
          </div>
        </motion.div>

        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 mb-4 overflow-x-auto pb-2"
          >
            <button
              onClick={() => handleBreadcrumbClick(-1)}
              className="text-sm text-primary hover:underline whitespace-nowrap"
            >
              همه دسته‌ها
            </button>
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.id} className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                <button
                  onClick={() => handleBreadcrumbClick(index)}
                  className={`text-sm whitespace-nowrap ${
                    index === breadcrumbs.length - 1
                      ? "text-foreground font-medium"
                      : "text-primary hover:underline"
                  }`}
                >
                  {crumb.name_fa}
                </button>
              </div>
            ))}
          </motion.div>
        )}

        {/* Categories */}
        {categories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Folder className="w-5 h-5 text-amber-500" />
              دسته‌بندی‌ها
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {categories.map((category, i) => (
                <motion.button
                  key={category.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => handleCategoryClick(category)}
                  className="group p-4 bg-card rounded-2xl border border-border/50 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10 transition-all text-center"
                >
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                    {category.icon}
                  </div>
                  <p className="font-medium text-sm">{category.name_fa}</p>
                  {category.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {category.description}
                    </p>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Featured Handouts */}
        {featuredHandouts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              جزوات ویژه
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredHandouts.map((handout, i) => (
                <motion.div
                  key={handout.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="group relative bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl border border-amber-500/30 overflow-hidden hover:shadow-xl hover:shadow-amber-500/20 transition-all"
                >
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-amber-500 text-white">
                      <Star className="w-3 h-3 ml-1" />
                      ویژه
                    </Badge>
                  </div>
                  <div className="p-5">
                    {handout.thumbnail_url ? (
                      <img
                        src={handout.thumbnail_url}
                        alt={handout.title}
                        className="w-full h-40 object-cover rounded-xl mb-4"
                      />
                    ) : (
                      <div className="w-full h-40 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl mb-4 flex items-center justify-center">
                        <FileText className="w-16 h-16 text-amber-500/50" />
                      </div>
                    )}
                    <h3 className="font-bold text-base mb-2 line-clamp-2">{handout.title}</h3>
                    {handout.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {handout.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                      {handout.grade && (
                        <span className="px-2 py-1 bg-muted rounded-lg">{handout.grade}</span>
                      )}
                      {handout.subject && (
                        <span className="px-2 py-1 bg-muted rounded-lg">{handout.subject}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {handout.downloads_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {handout.views_count}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleDownload(handout)}
                        className="bg-amber-500 hover:bg-amber-600"
                      >
                        <Download className="w-4 h-4 ml-1" />
                        دانلود
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Regular Handouts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            همه جزوات
            <span className="text-sm font-normal text-muted-foreground">
              ({regularHandouts.length} جزوه)
            </span>
          </h2>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-card rounded-2xl border border-border/50 p-4 animate-pulse">
                  <div className="w-full h-32 bg-muted rounded-xl mb-3" />
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : regularHandouts.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-3xl border border-border/50">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">جزوه‌ای یافت نشد</h3>
              <p className="text-muted-foreground text-sm">
                جزوات جدید به زودی اضافه می‌شوند
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {regularHandouts.map((handout, i) => (
                <motion.div
                  key={handout.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group bg-card rounded-2xl border border-border/50 overflow-hidden hover:border-primary/50 hover:shadow-lg transition-all"
                >
                  {handout.thumbnail_url ? (
                    <img
                      src={handout.thumbnail_url}
                      alt={handout.title}
                      className="w-full h-32 object-cover"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                      <FileText className="w-12 h-12 text-primary/30" />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-bold text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                      {handout.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                      {handout.page_count && <span>{handout.page_count} صفحه</span>}
                      <span>•</span>
                      <span>{formatFileSize(handout.file_size)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Download className="w-3 h-3" />
                        {handout.downloads_count}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownload(handout)}
                        className="text-primary hover:bg-primary/10"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {regularHandouts.map((handout, i) => (
                <motion.div
                  key={handout.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group flex items-center gap-4 bg-card rounded-xl border border-border/50 p-4 hover:border-primary/50 hover:shadow-lg transition-all"
                >
                  {handout.thumbnail_url ? (
                    <img
                      src={handout.thumbnail_url}
                      alt={handout.title}
                      className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-8 h-8 text-primary/30" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm mb-1 truncate group-hover:text-primary transition-colors">
                      {handout.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {handout.grade && <span>{handout.grade}</span>}
                      {handout.page_count && <span>{handout.page_count} صفحه</span>}
                      <span>{formatFileSize(handout.file_size)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-sm font-bold">{handout.downloads_count}</p>
                      <p className="text-[10px] text-muted-foreground">دانلود</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleDownload(handout)}
                      className="bg-primary"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Handouts;