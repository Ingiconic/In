import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipForward, SkipBack, Music, Volume2 } from "lucide-react";
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([70]);
  const audioRef = useRef<HTMLAudioElement>(null);

  const selectPlaylist = (playlist: any) => {
    setCurrentPlaylist(playlist);
    setCurrentTrack(0);
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.error("Audio play error", err);
            setIsPlaying(false);
          });
      }
    }
  };

  const nextTrack = () => {
    if (currentPlaylist) {
      setCurrentTrack((prev) => (prev + 1) % currentPlaylist.tracks.length);
    }
  };

  const prevTrack = () => {
    if (currentPlaylist) {
      setCurrentTrack((prev) => 
        prev === 0 ? currentPlaylist.tracks.length - 1 : prev - 1
      );
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume[0] / 100;
    }
  }, [volume]);

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

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <Button variant="outline" size="icon" onClick={prevTrack}>
                <SkipBack className="w-5 h-5" />
              </Button>
              <Button size="icon" className="w-16 h-16" onClick={togglePlay}>
                {isPlaying ? (
                  <Pause className="w-8 h-8" />
                ) : (
                  <Play className="w-8 h-8" />
                )}
              </Button>
              <Button variant="outline" size="icon" onClick={nextTrack}>
                <SkipForward className="w-5 h-5" />
              </Button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5" />
              <Slider
                value={volume}
                onValueChange={setVolume}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-sm w-12 text-center">{volume[0]}%</span>
            </div>

            <audio
              ref={audioRef}
              src={currentPlaylist.tracks[currentTrack]?.url}
              onEnded={nextTrack}
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