// Fallback hardcoded porque a env var no EasyPanel nao estava sendo
// propagada de forma confiavel (nem em build nem em runtime). A anon
// key e publica por design (protegida por RLS, nao e segredo).
export const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://kixueanwqnwwdipdifpg.supabase.co'

export const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpeHVlYW53cW53d2RpcGRpZnBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMTYwMTksImV4cCI6MjA3NTc5MjAxOX0.PPvYVUtIFleue21TPKUFzt7sUyqwCzi1NXkKFBgB10E'
