import { supabase } from "@/integrations/supabase/client";

export { supabase };

export type Profile = {
  id: string;
  user_id: string;
  phone: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: 'user' | 'admin';
  voice_minutes: number;
  professional_voice_minutes: number;
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

export type AuthCode = {
  id: string;
  code: string;
  code_type: 'pro_10min' | 'pro_30min' | 'pro_60min' | 'registration';
  minutes_amount: number | null;
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

/**
 * 解析双语 SRT 文件
 * 格式：第一行英文，第二行中文（如果存在）
 * 自动检测是否为双语格式
 */
export const parseBilingualSRT = (srt: string): { en: Subtitle[]; cn: Subtitle[] } => {
  const blocks = srt.trim().split(/\n\n+/);
  const enSubtitles: Subtitle[] = [];
  const cnSubtitles: Subtitle[] = [];

  blocks.forEach((block, index) => {
    const lines = block.split('\n');
    const timeMatch = lines[1]?.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
    if (!timeMatch) return;

    const start = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseInt(timeMatch[3]) + parseInt(timeMatch[4]) / 1000;
    const end = parseInt(timeMatch[5]) * 3600 + parseInt(timeMatch[6]) * 60 + parseInt(timeMatch[7]) + parseInt(timeMatch[8]) / 1000;

    // 获取时间戳后的所有文本行
    const textLines = lines.slice(2).filter(line => line.trim().length > 0);

    if (textLines.length === 0) return;

    // 检测是否包含中文字符
    const containsChinese = (text: string): boolean => /[\u4e00-\u9fa5]/.test(text);

    let enText = '';
    let cnText = '';

    if (textLines.length >= 2) {
      // 两行或更多：第一行英文，第二行中文
      enText = textLines[0].trim();
      cnText = textLines.slice(1).join(' ').trim();

      // 如果第一行包含中文，可能是纯中文字幕或格式反转
      if (containsChinese(enText) && !containsChinese(cnText)) {
        // 交换：第一行是中文，第二行是英文
        [enText, cnText] = [cnText, enText];
      }
    } else {
      // 只有一行：判断是中文还是英文
      const singleLine = textLines[0].trim();
      if (containsChinese(singleLine)) {
        cnText = singleLine;
      } else {
        enText = singleLine;
      }
    }

    if (enText) {
      enSubtitles.push({ id: index, start, end, text: enText });
    }
    if (cnText) {
      cnSubtitles.push({ id: index, start, end, text: cnText });
    }
  });

  return { en: enSubtitles, cn: cnSubtitles };
};