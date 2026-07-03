-- Adiciona games_with_goals (partidas em que o jogador marcou >= 1 gol).
-- Rodar uma vez no Supabase SQL Editor.
-- Depois, clicar em "recalcular" em /admin/jogadores para cada jogador
-- (ou chamar POST /api/stats/recalculate com todos os playerIds) para
-- preencher o valor e atualizar o overall com a nova fórmula.

alter table player_stats add column if not exists games_with_goals int not null default 0;
