// Translation Service - Easy to swap APIs by changing the adapter
// Currently using LibreTranslate (free), can switch to DeepL, Google, or OpenAI

export type SupportedLanguage = 
    | 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ja' | 'ko' | 'zh' 
    | 'ar' | 'ru' | 'hi' | 'nl' | 'sv' | 'pl' | 'tr' | 'vi' | 'th';

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
    en: 'English', es: 'Spanish', fr: 'French', de: 'German',
    it: 'Italian', pt: 'Portuguese', ja: 'Japanese', ko: 'Korean',
    zh: 'Chinese', ar: 'Arabic', ru: 'Russian', hi: 'Hindi',
    nl: 'Dutch', sv: 'Swedish', pl: 'Polish', tr: 'Turkish',
    vi: 'Vietnamese', th: 'Thai',
};

interface TranslationAdapter {
    translate(text: string, from: SupportedLanguage, to: SupportedLanguage): Promise<string>;
    name: string;
}

const libreTranslateAdapter: TranslationAdapter = {
    name: 'LibreTranslate',
    async translate(text: string, from: SupportedLanguage, to: SupportedLanguage): Promise<string> {
        try {
            const response = await fetch('https://libretranslate.com/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ q: text, source: from, target: to, format: 'text' }),
            });
            if (!response.ok) throw new Error('LibreTranslate API error');
            const data = await response.json();
            return data.translatedText;
        } catch (error) {
            console.error('LibreTranslate error:', error);
            throw error;
        }
    },
};

const myMemoryAdapter: TranslationAdapter = {
    name: 'MyMemory',
    async translate(text: string, from: SupportedLanguage, to: SupportedLanguage): Promise<string> {
        try {
            const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('MyMemory API error');
            const data = await response.json();
            return data.responseData.translatedText;
        } catch (error) {
            console.error('MyMemory error:', error);
            throw error;
        }
    },
};

const PRIMARY_ADAPTER = libreTranslateAdapter;
const FALLBACK_ADAPTER = myMemoryAdapter;

const translationCache = new Map<string, string>();

function getCacheKey(text: string, from: string, to: string): string {
    return `${from}:${to}:${text}`;
}

export async function translateText(
    text: string,
    from: SupportedLanguage,
    to: SupportedLanguage
): Promise<string> {
    if (from === to) return text;
    const cacheKey = getCacheKey(text, from, to);
    if (translationCache.has(cacheKey)) {
        return translationCache.get(cacheKey)!;
    }
    try {
        const translated = await PRIMARY_ADAPTER.translate(text, from, to);
        translationCache.set(cacheKey, translated);
        return translated;
    } catch (primaryError) {
        console.warn(`${PRIMARY_ADAPTER.name} failed, trying fallback...`);
        try {
            const translated = await FALLBACK_ADAPTER.translate(text, from, to);
            translationCache.set(cacheKey, translated);
            return translated;
        } catch (fallbackError) {
            console.error('All translation adapters failed');
            return text;
        }
    }
}

export async function formatBilingualMessage(
    originalText: string,
    originalLang: SupportedLanguage,
    targetLang: SupportedLanguage
): Promise<string> {
    if (originalLang === targetLang) return originalText;
    try {
        const translated = await translateText(originalText, originalLang, targetLang);
        return `${translated} (${originalText})`;
    } catch {
        return originalText;
    }
}

export async function preloadTranslations(
    messages: string[],
    from: SupportedLanguage,
    to: SupportedLanguage
): Promise<void> {
    await Promise.all(messages.map(msg => translateText(msg, from, to)));
}
