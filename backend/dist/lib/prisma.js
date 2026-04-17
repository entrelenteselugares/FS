"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
// MOCK PRISMA — Arquivo de desenvolvimento. Tipagem relaxada intencionalmente.
require("dotenv/config");
/**
 * MOCK PRISMA CLIENT — Ambiente de Desenvolvimento Local
 *
 * Substitui o Prisma real para que o sistema funcione sem DATABASE_URL.
 * Dados ficam em memória durante a sessão do servidor.
 *
 * Para banco real: trocar por `new PrismaClient()` de "@prisma/client".
 */
// In-memory stores
const users = [];
const events = [
    {
        id: "test-premium-event",
        nomeNoivos: "Ana & João — Premium",
        dataEvento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        cartorio: "Cartório Central",
        coverPhotoUrl: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200",
        lightroomUrl: "https://lightroom.adobe.com/gallery/test-album",
        driveUrl: "https://drive.google.com/drive/folders/test-videos",
        temFoto: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        pedidos: [],
    },
];
const orders = [];
const prisma = {
    user: {
        findUnique: async ({ where }) => users.find((u) => u.id === where.id || u.email === where.email) || null,
        create: async ({ data }) => {
            const user = { id: `user-${Date.now()}`, ...data, createdAt: new Date(), updatedAt: new Date() };
            users.push(user);
            return user;
        },
    },
    event: {
        findUnique: async ({ where }) => events.find((e) => e.id === where.id) || null,
        findMany: async ({ where, orderBy, include }) => {
            let result = [...events];
            if (where?.cartorio)
                result = result.filter((e) => e.cartorio === where.cartorio);
            if (include?.pedidos)
                result = result.map((e) => ({ ...e, pedidos: orders.filter((o) => o.eventId === e.id) }));
            return result;
        },
        create: async ({ data }) => {
            const event = { id: `evt-${Date.now()}`, ...data, pedidos: [], createdAt: new Date(), updatedAt: new Date() };
            events.push(event);
            return event;
        },
    },
    order: {
        findFirst: async ({ where }) => {
            return orders.find((o) => (!where.eventId || o.eventId === where.eventId) &&
                (!where.clienteId || o.clienteId === where.clienteId) &&
                (!where.status || o.status === where.status) &&
                (!where.paymentId || o.paymentId === where.paymentId)) || null;
        },
        findMany: async ({ where }) => {
            let result = [...orders];
            if (where?.status)
                result = result.filter((o) => o.status === where.status);
            result = result.map((o) => ({ ...o, event: events.find((e) => e.id === o.eventId) }));
            return result;
        },
        create: async ({ data }) => {
            const order = { id: `ord-${Date.now()}`, ...data, createdAt: new Date(), updatedAt: new Date() };
            orders.push(order);
            return order;
        },
        update: async ({ where, data }) => {
            const idx = orders.findIndex((o) => o.id === where.id);
            if (idx >= 0)
                Object.assign(orders[idx], data);
            return orders[idx];
        },
        updateMany: async ({ where, data }) => {
            orders.filter((o) => o.paymentId === where.paymentId).forEach((o) => Object.assign(o, data));
        },
    },
};
exports.default = prisma;
