import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';
nextEnv.loadEnvConfig(process.cwd());
for (const role of ['anon', 'admin']) {
  try {
    const key = process.env[role === 'anon' ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY' : 'SUPABASE_SERVICE_ROLE_KEY'];
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/galleries?select=id&limit=0`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(10000),
    });
    console.log(`${role}: REST HTTP ${response.status}`);
  } catch { console.log(`${role}: rede indisponível`); }
}
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const buckets = await admin.storage.listBuckets();
console.log('Storage:', buckets.error ? buckets.error.code || 'erro' : buckets.data.map(bucket => ({ name: bucket.name, public: bucket.public, file_size_limit: bucket.file_size_limit, allowed_mime_types: bucket.allowed_mime_types })));
for (const table of ['galleries','gallery_access','favorites','photos']) {
  const probe = await admin.from(table).select('id', { count: 'exact', head: true });
  console.log(`${table}: ${probe.error ? probe.error.code : `${probe.count} registros`}`);
}
