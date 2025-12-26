import { supabase } from '@/integrations/supabase/client';

interface CachedWord {
  word: string;
  phonetic: string;
  translation: string;
  definitions: { partOfSpeech: string; definition: string }[];
  cachedAt: number;
}

const LOCAL_CACHE_KEY = 'word_cache';
const CACHE_EXPIRY_DAYS = 7;

// 本地缓存操作
export const getLocalCache = (): Record<string, CachedWord> => {
  try {
    const cached = localStorage.getItem(LOCAL_CACHE_KEY);
    if (!cached) return {};
    
    const data = JSON.parse(cached);
    const now = Date.now();
    const expiryMs = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    
    // 过滤过期条目
    const validEntries: Record<string, CachedWord> = {};
    for (const [key, value] of Object.entries(data)) {
      const entry = value as CachedWord;
      if (now - entry.cachedAt < expiryMs) {
        validEntries[key] = entry;
      }
    }
    
    // 清理过期条目
    if (Object.keys(validEntries).length !== Object.keys(data).length) {
      localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(validEntries));
    }
    
    return validEntries;
  } catch {
    return {};
  }
};

export const setLocalCache = (word: string, data: Omit<CachedWord, 'cachedAt'>) => {
  try {
    const cache = getLocalCache();
    cache[word.toLowerCase()] = { ...data, cachedAt: Date.now() };
    localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // 忽略存储错误
  }
};

export const getFromLocalCache = (word: string): CachedWord | null => {
  const cache = getLocalCache();
  return cache[word.toLowerCase()] || null;
};

// 数据库缓存操作
export const getFromDbCache = async (word: string) => {
  const { data, error } = await supabase
    .from('word_cache')
    .select('*')
    .eq('word', word.toLowerCase())
    .maybeSingle();
  
  if (error || !data) return null;
  
  return {
    word: data.word,
    phonetic: data.phonetic || '',
    translation: data.translation || '',
    definitions: (data.definitions as { partOfSpeech: string; definition: string }[]) || [],
  };
};

export const saveToDbCache = async (wordData: {
  word: string;
  phonetic: string;
  translation: string;
  definitions: { partOfSpeech: string; definition: string }[];
}) => {
  const { error } = await supabase.from('word_cache').upsert(
    {
      word: wordData.word.toLowerCase(),
      phonetic: wordData.phonetic,
      translation: wordData.translation,
      definitions: wordData.definitions,
    },
    { onConflict: 'word' }
  );
  
  return !error;
};

// 从 API 获取单词信息
export const fetchFromApi = async (word: string) => {
  let wordInfo = {
    word,
    phonetic: '',
    translation: '',
    definitions: [] as { partOfSpeech: string; definition: string }[],
  };

  try {
    // 尝试 Free Dictionary API
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`
    );

    if (response.ok) {
      const data = await response.json();
      const entry = data[0];
      wordInfo = {
        word: entry.word,
        phonetic: entry.phonetic || entry.phonetics?.[0]?.text || '',
        translation: '',
        definitions: entry.meanings?.slice(0, 3).map((m: any) => ({
          partOfSpeech: m.partOfSpeech,
          definition: m.definitions?.[0]?.definition || '',
        })) || [],
      };
    }

    // 获取中文翻译
    const { data: translationData } = await supabase.functions.invoke('translate', {
      body: { text: word.toLowerCase() },
    });

    if (translationData?.translation) {
      wordInfo.translation = translationData.translation;
    }

    return wordInfo;
  } catch (error) {
    console.error('Error fetching word info:', error);
    return null;
  }
};

// 主查询函数：本地缓存 -> 数据库缓存 -> API
export const lookupWord = async (word: string) => {
  const normalizedWord = word.toLowerCase();

  // 1. 先查本地缓存
  const localCached = getFromLocalCache(normalizedWord);
  if (localCached) {
    return { ...localCached, source: 'local' as const };
  }

  // 2. 查数据库缓存
  const dbCached = await getFromDbCache(normalizedWord);
  if (dbCached) {
    // 存入本地缓存
    setLocalCache(normalizedWord, dbCached);
    return { ...dbCached, source: 'database' as const };
  }

  // 3. 调用 API
  const apiResult = await fetchFromApi(normalizedWord);
  if (apiResult) {
    // 存入数据库和本地缓存
    await saveToDbCache(apiResult);
    setLocalCache(normalizedWord, apiResult);
    return { ...apiResult, source: 'api' as const };
  }

  return null;
};
