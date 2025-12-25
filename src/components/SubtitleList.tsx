import { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Subtitle } from '@/lib/supabase';
import { Play, Mic, BookPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubtitleListProps {
  subtitles: Subtitle[];
  subtitlesCn?: Subtitle[];
  currentSubtitle: Subtitle | null;
  onSubtitleClick: (subtitle: Subtitle) => void;
  onPractice: (subtitle: Subtitle) => void;
  onAddWord: (word: string, context: string) => void;
  showTranslation?: boolean;
}

export const SubtitleList = ({
  subtitles,
  subtitlesCn,
  currentSubtitle,
  onSubtitleClick,
  onPractice,
  onAddWord,
  showTranslation = true
}: SubtitleListProps) => {
  const activeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentSubtitle]);

  const getTranslation = (subtitle: Subtitle) => {
    if (!subtitlesCn) return null;
    return subtitlesCn.find(s => Math.abs(s.start - subtitle.start) < 0.5);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleWordClick = (word: string, context: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Clean the word (remove punctuation)
    const cleanWord = word.replace(/[^a-zA-Z'-]/g, '');
    if (cleanWord) {
      onAddWord(cleanWord, context);
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-1">
        {subtitles.map((subtitle) => {
          const isActive = currentSubtitle?.id === subtitle.id;
          const translation = getTranslation(subtitle);
          
          return (
            <div
              key={subtitle.id}
              ref={isActive ? activeRef : null}
              className={cn(
                "p-3 border-2 transition-all cursor-pointer",
                isActive 
                  ? "border-primary bg-accent shadow-sm" 
                  : "border-transparent hover:border-muted-foreground/30 hover:bg-muted/50"
              )}
              onClick={() => onSubtitleClick(subtitle)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground font-mono">
                      {formatTime(subtitle.start)}
                    </span>
                  </div>
                  <p className="text-sm md:text-base leading-relaxed">
                    {subtitle.text.split(' ').map((word, idx) => (
                      <span
                        key={idx}
                        className="hover:bg-primary hover:text-primary-foreground px-0.5 cursor-pointer transition-colors"
                        onClick={(e) => handleWordClick(word, subtitle.text, e)}
                      >
                        {word}{' '}
                      </span>
                    ))}
                  </p>
                  {showTranslation && translation && (
                    <p className="text-xs md:text-sm text-muted-foreground mt-1">
                      {translation.text}
                    </p>
                  )}
                </div>
                
                <div className="flex flex-col gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSubtitleClick(subtitle);
                    }}
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPractice(subtitle);
                    }}
                  >
                    <Mic className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};
