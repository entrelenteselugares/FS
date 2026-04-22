INSERT INTO "fs_users" ("id", "email", "senha", "nome", "role", "createdAt", "updatedAt")
VALUES ('admin-01', 'entrelenteselugares@gmail.com', '$2b$12$UMTTjDvd4SLCQQtWYZzJSOt932Myxp8oFvMRtxTUscvBrePojr36q', 'Admin Foto Segundo', 'ADMIN', NOW(), NOW())
ON CONFLICT ("email") DO UPDATE SET "senha" = EXCLUDED."senha", "role" = 'ADMIN';

INSERT INTO "fs_events" ("id", "nomeNoivos", "dataEvento", "cartorio", "coverPhotoUrl", "createdAt", "updatedAt")
VALUES ('sample-01', 'Exemplo: Julia & Ricardo', '2026-12-31', '1º Cartório', 'https://images.unsplash.com/photo-1519741497674-611481863552', NOW(), NOW());
