-- Corrige drift de schema: o sistema de 3 times (blue/black/red) usado por
-- app/(app)/rodadas/[id]/RoundManagerClient.tsx (unico fluxo de rodada acessivel
-- pela navegacao) depende de colunas que nunca existiram no banco. Por isso
-- "Confirmar Times" falhava silenciosamente e nenhuma partida/gol era criado.
-- Rodar uma vez no Supabase SQL Editor.

alter table rounds add column if not exists team_compositions jsonb;
alter table matches add column if not exists team_red_score int not null default 0;

alter table teams drop constraint if exists teams_color_check;
alter table teams add constraint teams_color_check check (color in ('blue', 'black', 'red'));

-- Fecha brecha de seguranca: a policy antiga de update em player_stats usava
-- "using (true)", ou seja, qualquer pessoa (mesmo sem login) podia sobrescrever
-- os stats de qualquer jogador via API publica do Supabase. Restringe a admin,
-- igual as demais tabelas de escrita administrativa.
drop policy if exists "player_stats_update" on player_stats;
create policy "player_stats_update" on player_stats for update using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
