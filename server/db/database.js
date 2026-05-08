const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL =
  process.env.SUPABASE_URL || 'https://lklmohwerjpczjhymqtc.supabase.co';
const SUPABASE_KEY =
  process.env.SUPABASE_KEY || 'sb_publishable_hf0x4Vc3hgW7VZCYLz9fZw_4wLJT-ja';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('✅ Database ready — connected to Supabase PostgreSQL');

module.exports = supabase;
