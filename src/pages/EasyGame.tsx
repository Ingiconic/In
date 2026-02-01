import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Gamepad2, ArrowLeft, Play, Star, Users, Clock, 
  Monitor, Smartphone, Maximize2, X, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

interface Game {
  id: string;
  title: string;
  titleFa: string;
  thumbnail: string;
  embedUrl: string;
  category: string;
  players: string;
  rating: number;
  description: string;
  supports: ("mobile" | "desktop")[];
}

const games: Game[] = [
  {
    id: "gta-san-andreas",
    title: "GTA San Andreas",
    titleFa: "جی تی ای سن آندریاس",
    thumbnail: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=225&fit=crop",
    embedUrl: "https://www.retrogames.cc/embed/46878-grand-theft-auto-san-andreas.html",
    category: "اکشن",
    players: "1 نفره",
    rating: 4.8,
    description: "بازی افسانه‌ای جی تی ای با داستان CJ",
    supports: ["desktop", "mobile"],
  },
  {
    id: "minecraft",
    title: "Minecraft Classic",
    titleFa: "ماینکرفت کلاسیک",
    thumbnail: "https://images.unsplash.com/photo-1587573089734-09b64deb593c?w=400&h=225&fit=crop",
    embedUrl: "https://classic.minecraft.net/",
    category: "ماجراجویی",
    players: "چند نفره",
    rating: 4.9,
    description: "دنیای بلوکی معروف ماینکرفت",
    supports: ["desktop"],
  },
  {
    id: "subway-surfers",
    title: "Subway Surfers",
    titleFa: "سابوی سرفرز",
    thumbnail: "https://images.unsplash.com/photo-1493711662062-fa541f7f897a?w=400&h=225&fit=crop",
    embedUrl: "https://www.gamescrazy.net/games/2022/subway-surfers/",
    category: "دویدنی",
    players: "1 نفره",
    rating: 4.7,
    description: "فرار از پلیس در ایستگاه مترو",
    supports: ["desktop", "mobile"],
  },
  {
    id: "temple-run",
    title: "Temple Run 2",
    titleFa: "تمپل ران ۲",
    thumbnail: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=225&fit=crop",
    embedUrl: "https://www.crazygames.com/embed/temple-run-2",
    category: "دویدنی",
    players: "1 نفره",
    rating: 4.6,
    description: "فرار از معبد باستانی",
    supports: ["desktop", "mobile"],
  },
  {
    id: "hill-climb",
    title: "Hill Climb Racing",
    titleFa: "هیل کلایمب ریسینگ",
    thumbnail: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&h=225&fit=crop",
    embedUrl: "https://www.crazygames.com/embed/hill-climb-racing",
    category: "مسابقه‌ای",
    players: "1 نفره",
    rating: 4.5,
    description: "رانندگی در تپه‌های خطرناک",
    supports: ["desktop", "mobile"],
  },
  {
    id: "fruit-ninja",
    title: "Fruit Ninja",
    titleFa: "فروت نینجا",
    thumbnail: "https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=400&h=225&fit=crop",
    embedUrl: "https://www.crazygames.com/embed/fruit-ninja",
    category: "آرکید",
    players: "1 نفره",
    rating: 4.4,
    description: "بریدن میوه‌ها مثل یک نینجا",
    supports: ["desktop", "mobile"],
  },
  {
    id: "angry-birds",
    title: "Angry Birds",
    titleFa: "انگری بردز",
    thumbnail: "https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=400&h=225&fit=crop",
    embedUrl: "https://www.crazygames.com/embed/angry-birds",
    category: "پازل",
    players: "1 نفره",
    rating: 4.7,
    description: "پرتاب پرندگان عصبانی به خوک‌ها",
    supports: ["desktop", "mobile"],
  },
  {
    id: "crossy-road",
    title: "Crossy Road",
    titleFa: "کراسی رود",
    thumbnail: "https://images.unsplash.com/photo-1493238792000-8113da705763?w=400&h=225&fit=crop",
    embedUrl: "https://www.crazygames.com/embed/crossy-road",
    category: "آرکید",
    players: "1 نفره",
    rating: 4.5,
    description: "عبور از جاده بدون برخورد",
    supports: ["desktop", "mobile"],
  },
];

const categories = ["همه", "اکشن", "ماجراجویی", "دویدنی", "مسابقه‌ای", "پازل", "آرکید"];

const EasyGame = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("همه");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const filteredGames = selectedCategory === "همه" 
    ? games 
    : games.filter(g => g.category === selectedCategory);

  const playGame = (game: Game) => {
    if (isMobile && !game.supports.includes("mobile")) {
      return;
    }
    setSelectedGame(game);
  };

  const closeGame = () => {
    setSelectedGame(null);
    setIsFullscreen(false);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Game Player Modal
  if (selectedGame) {
    return (
      <div className={`fixed inset-0 z-50 bg-black ${isFullscreen ? '' : 'p-4'}`}>
        {/* Header */}
        {!isFullscreen && (
          <div className="flex items-center justify-between mb-2 px-2">
            <div className="flex items-center gap-2">
              <button
                onClick={closeGame}
                className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-white font-bold">{selectedGame.titleFa}</h2>
            </div>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Game iframe */}
        <iframe
          src={selectedGame.embedUrl}
          className={`w-full bg-black rounded-xl ${isFullscreen ? 'h-full' : 'h-[calc(100%-60px)]'}`}
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />

        {/* Fullscreen close button */}
        {isFullscreen && (
          <button
            onClick={closeGame}
            className="absolute top-4 right-4 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 z-10"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-purple-950/20 to-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">بازگشت</span>
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center shadow-lg">
              <Gamepad2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">ایزی گیم</h1>
              <p className="text-[10px] text-muted-foreground">بازی آنلاین</p>
            </div>
          </div>

          <div className="w-20" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-24">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">
            بازی‌های <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500">محبوب دنیا</span>
          </h2>
          <p className="text-muted-foreground text-sm">
            مستقیم در مرورگر، بدون نیاز به نصب 🎮
          </p>
        </motion.div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                  : "bg-card border border-border hover:border-primary/50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredGames.map((game, i) => {
            const canPlay = !isMobile || game.supports.includes("mobile");
            
            return (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`group relative bg-card rounded-2xl border border-border/50 overflow-hidden hover:border-primary/50 transition-all hover:shadow-xl ${
                  !canPlay ? 'opacity-60' : 'cursor-pointer'
                }`}
                onClick={() => canPlay && playGame(game)}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video">
                  <img
                    src={game.thumbnail}
                    alt={game.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  
                  {/* Play button overlay */}
                  {canPlay && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-xl">
                        <Play className="w-8 h-8 text-purple-600 mr-[-3px]" fill="currentColor" />
                      </div>
                    </div>
                  )}

                  {/* Device support badges */}
                  <div className="absolute top-2 left-2 flex gap-1">
                    {game.supports.includes("desktop") && (
                      <div className="p-1.5 rounded-lg bg-black/50 text-white">
                        <Monitor className="w-3.5 h-3.5" />
                      </div>
                    )}
                    {game.supports.includes("mobile") && (
                      <div className="p-1.5 rounded-lg bg-black/50 text-white">
                        <Smartphone className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>

                  {/* Rating */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/50 text-white text-xs">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span>{game.rating}</span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <h3 className="font-bold text-sm mb-1">{game.titleFa}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">{game.description}</p>
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px]">
                        {game.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {game.players}
                      </span>
                    </div>
                    
                    {canPlay ? (
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    ) : (
                      <span className="text-[10px] text-orange-500">فقط دسکتاپ</span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 border border-primary/20 text-center"
        >
          <Gamepad2 className="w-8 h-8 mx-auto mb-2 text-primary" />
          <p className="text-sm font-medium">بازی‌های بیشتری به زودی اضافه می‌شوند!</p>
          <p className="text-xs text-muted-foreground mt-1">
            پیشنهاد بازی دارید؟ از طریق صفحه تماس با ما اعلام کنید
          </p>
        </motion.div>
      </main>
    </div>
  );
};

export default EasyGame;
