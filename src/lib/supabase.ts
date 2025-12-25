import { supabase } from "@/integrations/supabase/client";

export { supabase };

export type Profile = {
  id: string;
  user_id: string;
  phone: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: 'user' | 'admin';
  voice_credits: number;
  created_at: string;
  updated_at: string;
};

export type Video = {
  id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  duration: number | null;
  subtitles_en: string | null;
  subtitles_cn: string | null;
  is_published: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
};

export type VideoCategory = {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  created_at: string;
};

export type WordBookEntry = {
  id: string;
  user_id: string;
  word: string;
  phonetic: string | null;
  translation: string | null;
  context: string | null;
  mastery_level: number;
  created_at: string;
  reviewed_at: string | null;
};

export type VoiceAssessment = {
  id: string;
  user_id: string;
  video_id: string | null;
  original_text: string;
  user_audio_url: string | null;
  accuracy_score: number | null;
  fluency_score: number | null;
  completeness_score: number | null;
  overall_score: number | null;
  feedback: string | null;
  created_at: string;
};

export type AuthCode = {
  id: string;
  code: string;
  code_type: 'registration' | 'voice_credits';
  credits_amount: number | null;
  is_used: boolean;
  used_by: string | null;
  used_at: string | null;
  expires_at: string | null;
  created_at: string;
};

export type Subtitle = {
  id: number;
  start: number;
  end: number;
  text: string;
  translation?: string;
};

export const parseSRT = (srt: string): Subtitle[] => {
  const blocks = srt.trim().split(/\n\n+/);
  return blocks.map((block, index) => {
    const lines = block.split('\n');
    const timeMatch = lines[1]?.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
    if (!timeMatch) return null;
    
    const start = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseInt(timeMatch[3]) + parseInt(timeMatch[4]) / 1000;
    const end = parseInt(timeMatch[5]) * 3600 + parseInt(timeMatch[6]) * 60 + parseInt(timeMatch[7]) + parseInt(timeMatch[8]) / 1000;
    const text = lines.slice(2).join(' ');
    
    return { id: index, start, end, text };
  }).filter(Boolean) as Subtitle[];
};
