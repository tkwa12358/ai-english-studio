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
    // 1. 尝试 Free Dictionary API (English Definitions & Phonetic)
    try {
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`
      );

      if (response.ok) {
        const data = await response.json();
        const entry = data[0];
        wordInfo.word = entry.word; // Use lemma if redirected (e.g. apples -> apple)
        wordInfo.phonetic = entry.phonetic || entry.phonetics?.[0]?.text || '';
        wordInfo.definitions = entry.meanings?.slice(0, 3).map((m: any) => ({
          partOfSpeech: m.partOfSpeech,
          definition: m.definitions?.[0]?.definition || '',
        })) || [];
      }
    } catch (e) {
      console.warn('Free Dictionary API failed:', e);
    }

    // 2. 获取中文翻译 / 补全信息 (AI / Edge Function)
    const { data: translationData, error: translationError } = await supabase.functions.invoke('translate', {
      body: { text: word.toLowerCase() },
    });

    if (!translationError && translationData) {
      // 优先使用 AI 返回的中文翻译
      if (translationData.translation) {
        wordInfo.translation = translationData.translation;
      }
      // 如果缺少音标，使用 AI 返回的
      if (!wordInfo.phonetic && translationData.phonetic) {
        wordInfo.phonetic = translationData.phonetic;
      }
      // 如果缺少定义，或者想要补充中文定义，这里我们可以合并或优先展示中文
      if (translationData.definitions && Array.isArray(translationData.definitions)) {
        const aiDefs = translationData.definitions.map((def: string) => ({
          partOfSpeech: translationData.partOfSpeech || 'unknown',
          definition: def // Chinese definitions from AI
        }));
        // Add to top if English defs exist, or replace?
        // User wants Chinese. Let's prepend.
        wordInfo.definitions = [...aiDefs, ...wordInfo.definitions];
      }
    } else {
      // 3. Fallback: MyMemory API (Free, no key) if AI fails
      try {
        const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|zh-CN`);
        const data = await res.json();
        if (data.responseData?.translatedText) {
          wordInfo.translation = data.responseData.translatedText;
          if (wordInfo.definitions.length === 0) {
            wordInfo.definitions.push({
              partOfSpeech: 'unknown',
              definition: data.responseData.translatedText
            });
          }
        }
      } catch (e) {
        console.warn('MyMemory Fallback failed:', e);
      }
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

  // 辅助函数：检查是否包含中文
  const hasChinese = (text: string | null | undefined): boolean => {
    if (!text) return false;
    return /[\u4e00-\u9fa5]/.test(text);
  };

  // 1. 先查本地缓存
  const localCached = getFromLocalCache(normalizedWord);
  if (localCached && localCached.translation && hasChinese(localCached.translation)) {
    return { ...localCached, source: 'local' as const };
  }

  // 2. 查数据库缓存
  const dbCached = await getFromDbCache(normalizedWord);
  if (dbCached && dbCached.translation && hasChinese(dbCached.translation)) {
    // 存入本地缓存
    setLocalCache(normalizedWord, dbCached);
    return { ...dbCached, source: 'database' as const };
  }

  // 3. 调用 API (Fallback or Enrichment)
  // 当缓存无效或缺少中文翻译时执行
  console.log(`Searching API for ${normalizedWord} (Translation missing or valid cache not found)...`);
  const apiResult = await fetchFromApi(normalizedWord);
  if (apiResult) {
    // 如果数据库有音标但 API 没返回，保留数据库的音标
    if (dbCached && !apiResult.phonetic && dbCached.phonetic) {
      apiResult.phonetic = dbCached.phonetic;
    }

    // 存入数据库和本地缓存
    await saveToDbCache(apiResult);
    setLocalCache(normalizedWord, apiResult);
    return { ...apiResult, source: 'api' as const };
  }

  // If API failed but we had DB record (even without translation), return it as last resort
  if (dbCached) {
    return { ...dbCached, source: 'database' as const };
  }

  return null;
};
