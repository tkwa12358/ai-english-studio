import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Volume2, BookPlus, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { lookupWord } from '@/lib/wordCache';

interface WordLookupProps {
  word: string;
  context: string;
  onClose: () => void;
}

interface WordInfo {
  word: string;
  phonetic: string;
  translation: string;
  definitions: { partOfSpeech: string; definition: string }[];
}

export const WordLookup = ({ word, context, onClose }: WordLookupProps) => {
  const [loading, setLoading] = useState(true);
  const [wordInfo, setWordInfo] = useState<WordInfo | null>(null);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchWordInfo = async () => {
      try {
        const result = await lookupWord(word);
        if (result) {
          setWordInfo({
            word: result.word,
            phonetic: result.phonetic,
            translation: result.translation,
            definitions: result.definitions,
          });
        } else {
          setWordInfo({
            word,
            phonetic: '',
            translation: '加载失败',
            definitions: [],
          });
        }
      } catch (error) {
        console.error('Error fetching word info:', error);
        setWordInfo({
          word,
          phonetic: '',
          translation: '加载失败',
          definitions: [],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWordInfo();
  }, [word]);

  const playPronunciation = () => {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    speechSynthesis.speak(utterance);
  };

  const addToWordbook = async () => {
    if (!user || !wordInfo) return;

    setSaving(true);
    try {
      const { error } = await supabase.from('word_book').insert({
        user_id: user.id,
        word: wordInfo.word,
        phonetic: wordInfo.phonetic,
        translation: wordInfo.translation,
        context,
      });

      if (error) throw error;

      toast({
        title: '已添加到单词本',
        description: wordInfo.word,
      });
      onClose();
    } catch (error) {
      console.error('Error saving word:', error);
      toast({
        variant: 'destructive',
        title: '保存失败',
        description: '请稍后重试',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
      <div className="w-full sm:max-w-md border-4 border-foreground bg-card p-6 shadow-lg animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 duration-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">{word}</h2>
            <Button variant="ghost" size="icon" onClick={playPronunciation}>
              <Volume2 className="w-5 h-5" />
            </Button>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : wordInfo ? (
          <div className="space-y-4">
            {wordInfo.phonetic && (
              <p className="text-muted-foreground font-mono">{wordInfo.phonetic}</p>
            )}

            {wordInfo.translation && (
              <div className="border-2 border-foreground p-3 bg-accent">
                <p className="font-medium">{wordInfo.translation}</p>
              </div>
            )}

            {wordInfo.definitions.length > 0 && (
              <div className="space-y-2">
                {wordInfo.definitions.map((def, idx) => (
                  <div key={idx} className="text-sm">
                    <span className="text-muted-foreground italic">{def.partOfSpeech}</span>
                    <p className="mt-1">{def.definition}</p>
                  </div>
                ))}
              </div>
            )}

            {context && (
              <div className="text-sm">
                <p className="text-muted-foreground mb-1">例句：</p>
                <p className="italic">{context}</p>
              </div>
            )}

            <Button 
              className="w-full" 
              onClick={addToWordbook}
              disabled={saving || !user}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <BookPlus className="w-4 h-4 mr-2" />
              )}
              添加到单词本
            </Button>
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">未找到单词信息</p>
        )}
      </div>
    </div>
  );
};
