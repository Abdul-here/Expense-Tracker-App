const { createClient } = require('@supabase/supabase-js');

const defaultUrl = 'https://lklmohwerjpczjhymqtc.supabase.co';
const defaultKey = 'sb_publishable_hf0x4Vc3hgW7VZCYLz9fZw_4wLJT-ja';

const SUPABASE_URL = process.env.SUPABASE_URL || defaultUrl;
const SUPABASE_KEY =
  process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || defaultKey;

const usingEnvUrl = Boolean(process.env.SUPABASE_URL);
const usingEnvKey = Boolean(process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY);
const mask = (value = '') => `${value.slice(0, 6)}...${value.slice(-4)}`;

if (!usingEnvUrl || !usingEnvKey) {
  console.error('⚠️ Supabase env configuration warning:', {
    SUPABASE_URL: usingEnvUrl ? 'set from env' : 'missing, using fallback',
    SUPABASE_KEY: usingEnvKey ? 'set from env' : 'missing, using fallback',
  });
}

console.log('ℹ️ Supabase config source:', {
  urlSource: usingEnvUrl ? 'env' : 'fallback',
  keySource: usingEnvKey ? 'env' : 'fallback',
  urlHost: (() => {
    try {
      return new URL(SUPABASE_URL).host;
    } catch {
      return 'invalid-url';
    }
  })(),
  keyPreview: mask(SUPABASE_KEY),
});

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('✅ Database ready — connected to Supabase PostgreSQL');

module.exports = supabase;
