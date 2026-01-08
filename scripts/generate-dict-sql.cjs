const fs = require('fs');
const path = require('path');

const DICT_DIR = '/Volumes/aikaifa/claudekaifa/fuke/ai-english-club/json-full';
const OUT_FILE = path.join(__dirname, 'import_dict.sql');

function escapeSql(str) {
    if (!str) return 'NULL';
    // Escape single quotes
    return "'" + str.replace(/'/g, "''") + "'";
}

function escapeJson(obj) {
    if (!obj) return "'[]'::jsonb";
    const jsonStr = JSON.stringify(obj);
    return "'" + jsonStr.replace(/'/g, "''") + "'::jsonb";
}

if (fs.existsSync(OUT_FILE)) {
    fs.unlinkSync(OUT_FILE);
}

const outStream = fs.createWriteStream(OUT_FILE, { flags: 'a' });

async function generateSql() {
    if (!fs.existsSync(DICT_DIR)) {
        console.error(`Dictionary directory not found: ${DICT_DIR}`);
        return;
    }

    const files = fs.readdirSync(DICT_DIR).filter(f => f.endsWith('.json'));
    console.log(`Found ${files.length} dictionary files.`);

    let totalWords = 0;

    for (const file of files) {
        console.log(`Processing ${file}...`);
        try {
            const content = fs.readFileSync(path.join(DICT_DIR, file), 'utf-8');
            const json = JSON.parse(content);

            const values = [];

            for (const item of json) {
                if (!item.content || !item.content.word) continue;

                const wordData = item.content.word;
                const headWord = wordData.wordHead;
                if (!headWord) continue;

                const phonetic = wordData.content.usphone ||
                    wordData.content.ukphone ||
                    wordData.content.phone || '';

                const trans = wordData.content.trans || [];
                // Translation summary (first definition)
                let translation = trans.map(t => {
                    return `${t.pos ? t.pos + '. ' : ''}${t.tranCn}`;
                }).slice(0, 1).join('; ');

                if (!translation && trans.length > 0) translation = trans[0].tranCn || '';

                const definitions = trans.map(t => ({
                    partOfSpeech: t.pos || '',
                    definition: t.tranCn || t.tranOther || ''
                }));

                values.push(`(${escapeSql(headWord.toLowerCase())}, ${escapeSql(phonetic ? `/${phonetic}/` : '')}, ${escapeSql(translation)}, ${escapeJson(definitions)})`);
            }

            if (values.length === 0) continue;

            // Write in chunks
            const CHUNK_SIZE = 500;
            for (let i = 0; i < values.length; i += CHUNK_SIZE) {
                const chunk = values.slice(i, i + CHUNK_SIZE);
                const sql = `INSERT INTO public.word_cache (word, phonetic, translation, definitions) VALUES 
${chunk.join(',\n')}
ON CONFLICT (word) DO UPDATE SET
  phonetic = EXCLUDED.phonetic,
  translation = EXCLUDED.translation,
  definitions = EXCLUDED.definitions;
`;
                outStream.write(sql);
            }

            totalWords += values.length;

        } catch (err) {
            console.error(`Failed to process ${file}:`, err.message);
        }
    }

    outStream.end();
    console.log(`Unlocking DB... wait, just generated SQL locally.`);
    console.log(`Total words processed: ${totalWords}`);
    console.log(`SQL written to ${OUT_FILE}`);
}

generateSql();
