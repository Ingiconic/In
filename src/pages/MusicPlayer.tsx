import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Music } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

const defaultPlaylists = [
  {
    id: "lofi",
    name: "Lo-Fi Beats",
    name_fa: "لو فای",
    genre: "lofi",
    thumbnail_url: "https://images.unsplash.com/photo-1511379938547-c1f69419868d",
    tracks: [
      { title: "Chill Study", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
      { title: "Deep Focus", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
    ],
  },
  {
    id: "classical",
    name: "Classical Focus",
    name_fa: "کلاسیک",
    genre: "classical",
    thumbnail_url: "https://images.unsplash.com/photo-1507838153414-b4b713384a76",
    tracks: [
      { title: "Piano Concentration", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
      { title: "Orchestral Calm", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
    ],
  },
  {
    id: "ambient",
    name: "Ambient Nature",
    name_fa: "محیطی",
    genre: "ambient",
    thumbnail_url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e",
    tracks: [
      { title: "Soft Ambience", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
    ],
  },
];

export default function MusicPlayer() {
  const [playlists] = useState(defaultPlaylists);
  const [currentPlaylist, setCurrentPlaylist] = useState<any>(null);
  const [currentTrack, setCurrentTrack] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const selectPlaylist = (playlist: any) => {
    setCurrentPlaylist(playlist);
    setCurrentTrack(0);
  };

  const nextTrack = () => {
    if (currentPlaylist) {
      setCurrentTrack((prev) => (prev + 1) % currentPlaylist.tracks.length);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-4xl">
        <h1 className="text-4xl font-bold mb-6 text-center bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          موزیک مطالعه 🎵
        </h1>

        {/* Playlists */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {playlists.map((playlist) => (
            <Card
              key={playlist.id}
              className={`p-6 cursor-pointer transition-all hover:shadow-lg ${
                currentPlaylist?.id === playlist.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => selectPlaylist(playlist)}
            >
              <img
                src={playlist.thumbnail_url}
                alt={playlist.name_fa}
                className="w-full h-40 object-cover rounded-lg mb-4"
              />
              <h3 className="text-xl font-bold mb-2">{playlist.name_fa}</h3>
              <p className="text-sm text-muted-foreground">
                {playlist.tracks.length} آهنگ
              </p>
            </Card>
          ))}
        </div>

        {/* Player */}
        {currentPlaylist && (
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <Music className="w-16 h-16 text-primary" />
              <div>
                <h2 className="text-2xl font-bold">
                  {currentPlaylist.tracks[currentTrack]?.title}
                </h2>
                <p className="text-muted-foreground">{currentPlaylist.name_fa}</p>
              </div>
            </div>

            <audio
              ref={audioRef}
              src={currentPlaylist.tracks[currentTrack]?.url}
              onEnded={nextTrack}
              controls
              preload="auto"
              className="w-full"
            />
          </Card>
        )}

        {!currentPlaylist && (
          <Card className="p-8 text-center text-muted-foreground">
            <Music className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>یک پلی‌لیست را برای شروع انتخاب کنید!</p>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}