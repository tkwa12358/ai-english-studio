import { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Play, Pause, SkipBack, SkipForward, 
  Volume2, VolumeX, RotateCcw, Settings,
  Repeat
} from 'lucide-react';
import { Subtitle } from '@/lib/supabase';

interface VideoPlayerProps {
  videoUrl: string;
  subtitles: Subtitle[];
  subtitlesCn?: Subtitle[];
  currentSubtitle: Subtitle | null;
  onTimeUpdate: (time: number) => void;
  onSubtitleClick: (subtitle: Subtitle) => void;
  showTranslation?: boolean;
}

export const VideoPlayer = ({
  videoUrl,
  subtitles,
  subtitlesCn,
  currentSubtitle,
  onTimeUpdate,
  onSubtitleClick,
  showTranslation = true
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  const [loopStart, setLoopStart] = useState<number | null>(null);
  const [loopEnd, setLoopEnd] = useState<number | null>(null);

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      onTimeUpdate(time);

      // Handle loop
      if (isLooping && loopStart !== null && loopEnd !== null) {
        if (time >= loopEnd) {
          videoRef.current.currentTime = loopStart;
        }
      }
    }
  }, [onTimeUpdate, isLooping, loopStart, loopEnd]);

  const seek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const skipBack = () => {
    if (currentSubtitle) {
      seek(currentSubtitle.start);
    } else {
      seek(Math.max(0, currentTime - 5));
    }
  };

  const skipForward = () => {
    const nextSub = subtitles.find(s => s.start > currentTime);
    if (nextSub) {
      seek(nextSub.start);
    } else {
      seek(Math.min(duration, currentTime + 5));
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const cyclePlaybackRate = () => {
    const rates = [0.5, 0.75, 1, 1.25, 1.5];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextRate;
    }
  };

  const setLoopForCurrentSubtitle = () => {
    if (currentSubtitle) {
      setLoopStart(currentSubtitle.start);
      setLoopEnd(currentSubtitle.end);
      setIsLooping(true);
    }
  };

  const clearLoop = () => {
    setIsLooping(false);
    setLoopStart(null);
    setLoopEnd(null);
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentTranslation = () => {
    if (!showTranslation || !subtitlesCn || !currentSubtitle) return null;
    return subtitlesCn.find(s => 
      Math.abs(s.start - currentSubtitle.start) < 0.5
    );
  };

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.addEventListener('loadedmetadata', () => setDuration(video.duration));
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('play', () => setIsPlaying(true));
      video.addEventListener('pause', () => setIsPlaying(false));
    }
    return () => {
      if (video) {
        video.removeEventListener('loadedmetadata', () => {});
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('play', () => {});
        video.removeEventListener('pause', () => {});
      }
    };
  }, [handleTimeUpdate]);

  return (
    <div className="w-full">
      {/* Video */}
      <div className="relative bg-foreground aspect-video">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full"
          onClick={togglePlay}
        />
        
        {/* Subtitle Overlay */}
        {currentSubtitle && (
          <div className="absolute bottom-16 left-0 right-0 text-center px-4">
            <div 
              className="inline-block bg-background/90 border-2 border-foreground px-4 py-2 cursor-pointer hover:bg-accent transition-colors"
              onClick={() => onSubtitleClick(currentSubtitle)}
            >
              <p className="text-lg md:text-xl font-medium">{currentSubtitle.text}</p>
              {showTranslation && getCurrentTranslation() && (
                <p className="text-sm md:text-base text-muted-foreground mt-1">
                  {getCurrentTranslation()?.text}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="border-2 border-t-0 border-foreground bg-card p-3">
        {/* Progress Bar */}
        <div className="mb-3">
          <Slider
            value={[currentTime]}
            max={duration}
            step={0.1}
            onValueChange={(value) => seek(value[0])}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={skipBack}>
              <SkipBack className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={togglePlay}>
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={skipForward}>
              <SkipForward className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => currentSubtitle && seek(currentSubtitle.start)}
            >
              <RotateCcw className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant={isLooping ? "default" : "ghost"} 
              size="sm"
              onClick={isLooping ? clearLoop : setLoopForCurrentSubtitle}
            >
              <Repeat className="w-4 h-4 mr-1" />
              {isLooping ? 'AB循环中' : 'AB循环'}
            </Button>
            
            <Button variant="outline" size="sm" onClick={cyclePlaybackRate}>
              {playbackRate}x
            </Button>

            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={toggleMute}>
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </Button>
              <div className="w-20 hidden sm:block">
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.1}
                  onValueChange={handleVolumeChange}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
