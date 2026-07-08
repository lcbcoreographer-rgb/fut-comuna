-- Permite ao admin cadastrar jogadores sem conta de login (auth.users),
-- alinhando com o modelo single-login adotado em 1e3c3ef.
-- Rodar uma vez no Supabase SQL Editor.

alter table profiles drop constraint if exists profiles_id_fkey;
alter table profiles alter column id set default gen_random_uuid();

drop policy if exists "profiles_insert" on profiles;
create policy "profiles_insert" on profiles for insert with check (
  auth.uid() = id
  or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);
