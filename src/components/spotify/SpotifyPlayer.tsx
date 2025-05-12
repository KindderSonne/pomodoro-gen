
import React, { useState, useEffect } from 'react';
import { spotifyApi } from '@/lib/spotify';
import { SpotifyTrack } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipForward, SkipBack, Volume } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const SpotifyPlayer: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [recommendedTracks, setRecommendedTracks] = useState<SpotifyTrack[]>([]);
  const [volume, setVolume] = useState(80);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already authenticated with Spotify
    setIsAuthenticated(spotifyApi.isAuthenticated);
    if (spotifyApi.isAuthenticated) {
      fetchRecommendedTracks();
    }

    // In a real app, you would also check for an existing session or token
  }, []);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const success = await spotifyApi.login();
      setIsAuthenticated(success);
      if (success) {
        fetchRecommendedTracks();
        toast({
          title: "Spotify Connected",
          description: "You've successfully connected to Spotify.",
        });
      }
    } catch (error) {
      console.error('Failed to login to Spotify', error);
      toast({
        title: "Connection Failed",
        description: "Could not connect to Spotify. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecommendedTracks = async () => {
    try {
      const tracks = await spotifyApi.getRecommendedTracks();
      setRecommendedTracks(tracks);
      if (tracks.length > 0 && !currentTrack) {
        setCurrentTrack(tracks[0]);
      }
    } catch (error) {
      console.error('Failed to fetch tracks', error);
    }
  };

  const togglePlayPause = () => {
    if (!currentTrack) return;
    
    if (isPlaying) {
      spotifyApi.pause();
      setIsPlaying(false);
    } else {
      spotifyApi.play();
      setIsPlaying(true);
    }
  };

  const handleNext = () => {
    if (!currentTrack) return;
    
    const nextTrack = spotifyApi.nextTrack();
    setCurrentTrack(nextTrack);
  };

  const handlePrevious = () => {
    if (!currentTrack) return;
    
    const prevTrack = spotifyApi.previousTrack();
    setCurrentTrack(prevTrack);
  };

  const handleVolumeChange = (newVolume: number[]) => {
    const vol = newVolume[0];
    setVolume(vol);
    spotifyApi.setVolume(vol);
  };

  // Format time (for a real player that has duration)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spotify Music</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-8">
          <div className="text-center mb-4">
            <div className="mb-2 text-2xl">🎵</div>
            <p className="mb-4">Connect to Spotify to listen to music while you work</p>
          </div>
          <Button 
            onClick={handleLogin} 
            disabled={isLoading}
            className="bg-[#1DB954] hover:bg-[#1DB954]/90 text-white"
          >
            {isLoading ? "Connecting..." : "Connect Spotify"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spotify Music</CardTitle>
      </CardHeader>
      <CardContent>
        {currentTrack ? (
          <div className="flex flex-col items-center">
            <div className="relative mb-4 w-48 h-48 rounded-md overflow-hidden shadow-md">
              <img
                src={currentTrack.albumArt}
                alt={`${currentTrack.name} album art`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/10"></div>
            </div>
            
            <div className="w-full text-center mb-4">
              <h3 className="font-semibold text-lg truncate">{currentTrack.name}</h3>
              <p className="text-sm text-muted-foreground truncate">{currentTrack.artist}</p>
            </div>
            
            {/* Progress bar would go here in a real implementation */}
            <div className="w-full h-1 bg-secondary rounded-full mb-2">
              <div className="h-1 bg-primary rounded-full" style={{ width: `${isPlaying ? 45 : 0}%` }}></div>
            </div>
            
            <div className="w-full flex justify-between text-xs text-muted-foreground mb-4">
              <span>{formatTime(isPlaying ? 78 : 0)}</span>
              <span>{formatTime(174)}</span>
            </div>
            
            <div className="flex items-center justify-center space-x-3 mb-6 w-full">
              <Button
                onClick={handlePrevious}
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full"
              >
                <SkipBack className="h-6 w-6" />
              </Button>
              
              <Button
                onClick={togglePlayPause}
                variant="default"
                size="icon"
                className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90"
              >
                {isPlaying ? 
                  <Pause className="h-8 w-8" /> : 
                  <Play className="h-8 w-8 ml-1" />
                }
              </Button>
              
              <Button
                onClick={handleNext}
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full"
              >
                <SkipForward className="h-6 w-6" />
              </Button>
            </div>
            
            <div className="flex items-center space-x-2 w-full">
              <Volume className="h-4 w-4 text-muted-foreground" />
              <Slider
                value={[volume]}
                min={0}
                max={100}
                step={1}
                onValueChange={handleVolumeChange}
                className="w-full"
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SpotifyPlayer;
