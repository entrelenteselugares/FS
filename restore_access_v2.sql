-- Limpa qualquer resquício e garante o usuário mestre na tabela CORRETA
DELETE FROM "fs_users" WHERE email = 'entrelenteselugares@gmail.com';

INSERT INTO "fs_users" ("id", "email", "senha", "nome", "role", "createdAt", "updatedAt")
VALUES (
  'admin-final', 
  'entrelenteselugares@gmail.com', 
  '$2b$12$UMTTjDvd4SLCQQtWYZzJSOt932Myxp8oFvMRtxTUscvBrePojr36q', -- Correspondente a 'foto2025'
  'Admin', 
  'ADMIN', 
  NOW(), 
  NOW()
);

-- Garante que o evento de exemplo exista para a "Visão de Cliente"
DELETE FROM "fs_events" WHERE id = 'sample-01';

INSERT INTO "fs_events" ("id", "nomeNoivos", "dataEvento", "cartorio", "coverPhotoUrl", "createdAt", "updatedAt")
VALUES (
  'sample-01', 
  'Exemplo: Julia & Ricardo', 
  '2026-12-31', 
  '1º Cartório', 
  'https://images.unsplash.com/photo-1519741497674-611481863552', 
  NOW(), 
  NOW()
);
