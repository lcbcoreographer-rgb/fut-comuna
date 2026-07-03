-- Conquistas seed - rodar APOS o supabase-schema.sql
-- Icones em texto, sem emojis (evita erro de encoding no SQL Editor)

insert into achievements (slug, name, description, icon, condition_type, condition_value)
values ('primeiro_gol', 'Primeiro Gol', 'Marcou seu primeiro gol', 'gol', 'goals', 1)
on conflict (slug) do nothing;

insert into achievements (slug, name, description, icon, condition_type, condition_value)
values ('hat_trick', 'Hat-trick', 'Marcou 3 gols em uma partida', 'chapeu', 'hat_trick', 3)
on conflict (slug) do nothing;

insert into achievements (slug, name, description, icon, condition_type, condition_value)
values ('gols_10', '10 Gols', 'Marcou 10 gols no total', 'fogo', 'goals', 10)
on conflict (slug) do nothing;

insert into achievements (slug, name, description, icon, condition_type, condition_value)
values ('gols_50', '50 Gols', 'Marcou 50 gols no total', 'explosao', 'goals', 50)
on conflict (slug) do nothing;

insert into achievements (slug, name, description, icon, condition_type, condition_value)
values ('gols_100', '100 Gols', 'Marcou 100 gols no total', 'coroa', 'goals', 100)
on conflict (slug) do nothing;

insert into achievements (slug, name, description, icon, condition_type, condition_value)
values ('assists_10', '10 Assistencias', 'Deu 10 assistencias no total', 'alvo', 'assists', 10)
on conflict (slug) do nothing;

insert into achievements (slug, name, description, icon, condition_type, condition_value)
values ('assists_50', '50 Assistencias', 'Deu 50 assistencias no total', 'magia', 'assists', 50)
on conflict (slug) do nothing;

insert into achievements (slug, name, description, icon, condition_type, condition_value)
values ('jogos_10', '10 Jogos', 'Participou de 10 partidas', 'medalha', 'games', 10)
on conflict (slug) do nothing;

insert into achievements (slug, name, description, icon, condition_type, condition_value)
values ('jogos_50', '50 Jogos', 'Participou de 50 partidas', 'ouro', 'games', 50)
on conflict (slug) do nothing;

insert into achievements (slug, name, description, icon, condition_type, condition_value)
values ('jogos_100', '100 Jogos', 'Participou de 100 partidas', 'trofeu', 'games', 100)
on conflict (slug) do nothing;

insert into achievements (slug, name, description, icon, condition_type, condition_value)
values ('vitorias_streak_5', '5 Vitorias Seguidas', 'Venceu 5 partidas consecutivas', 'raio', 'win_streak', 5)
on conflict (slug) do nothing;

insert into achievements (slug, name, description, icon, condition_type, condition_value)
values ('vitorias_streak_10', '10 Vitorias Seguidas', 'Venceu 10 partidas consecutivas', 'estrela', 'win_streak', 10)
on conflict (slug) do nothing;

insert into achievements (slug, name, description, icon, condition_type, condition_value)
values ('mvp_5', '5x MVP', 'Foi eleito MVP 5 vezes', 'leao', 'mvp', 5)
on conflict (slug) do nothing;

insert into achievements (slug, name, description, icon, condition_type, condition_value)
values ('mvp_10', '10x MVP', 'Foi eleito MVP 10 vezes', 'fantasma', 'mvp', 10)
on conflict (slug) do nothing;

insert into achievements (slug, name, description, icon, condition_type, condition_value)
values ('lenda', 'Lenda FutComuna', 'Participou de 100+ partidas com 50+ gols', 'estadio', 'lenda', 1)
on conflict (slug) do nothing;
