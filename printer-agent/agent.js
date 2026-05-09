import fs from 'fs';
import { exec } from 'child_process';
import path from 'path';
import 'dotenv/config';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

/**
 * PRINTER AGENT FOTO SEGUNDO v2.0 (WebSocket / IoT Realtime)
 * Conexão em tempo real sem sobrecarregar a rede com polling.
 */

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const EVENT_ID = process.env.EVENT_ID;
const PRINTER_NAME = process.env.PRINTER_NAME || 'EPSON_L3250';
const AGENT_TOKEN = process.env.AGENT_TOKEN;
const AGENT_ID = process.env.AGENT_ID || 'iot-agent-001';

// Opcional: Se fornecido, ativa o modo WebSocket. Se não, cai no modo Polling.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

async function sendHeartbeat() {
    try {
        await fetch(`${BACKEND_URL}/api/iot/heartbeat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agentId: AGENT_ID, name: `Printer Agent (${PRINTER_NAME})` })
        });
    } catch (err) {
        // Silencioso
    } finally {
        setTimeout(sendHeartbeat, 60000); // Heartbeat a cada minuto
    }
}
sendHeartbeat();

const tempDir = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

console.log('---');
console.log(`📡 Printer Agent v2.0 (IoT WebSocket) iniciado`);
console.log(`🎟️  Evento: ${EVENT_ID}`);
console.log(`🖨️  Impressora: ${PRINTER_NAME}`);
console.log(`🔌 Modo: ${SUPABASE_URL ? 'WebSocket Realtime' : 'Long Polling (Fallback)'}`);
console.log('---');

let isProcessing = false;
let pendingQueue = [];

async function processQueue() {
    if (isProcessing || pendingQueue.length === 0) return;
    
    isProcessing = true;
    console.log(`\n📸 Processando fila de ${pendingQueue.length} fotos...`);
    
    while (pendingQueue.length > 0) {
        const job = pendingQueue.shift();
        console.log(`🚀 Iniciando: ${job.referenceCode}`);
        await downloadAndPrint(job);
    }
    
    isProcessing = false;
    console.log(`\n✅ Fila zerada. Aguardando novos disparos do servidor...`);
}

async function fetchInitialQueue() {
    try {
        const res = await fetch(`${BACKEND_URL}/api/admin/phygital/queue?eventId=${EVENT_ID}`, {
            headers: { 'Authorization': `Bearer ${AGENT_TOKEN}` }
        });
        const data = await res.json();
        
        if (data.success && data.pendingPrints && data.pendingPrints.length > 0) {
            // Adiciona apenas os que não estão na fila ainda
            data.pendingPrints.forEach(p => {
                if (!pendingQueue.find(q => q.id === p.id)) {
                    pendingQueue.push(p);
                }
            });
            processQueue();
        }
    } catch (error) {
        console.error("⏳ Falha de rede ao buscar fila inicial...");
    }
}

// ── WEBSOCKET CONFIGURATION ──
if (SUPABASE_URL && SUPABASE_KEY) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    // Busca inicial
    fetchInitialQueue();

    // Inscreve no canal WebSocket do banco de dados (Realtime IoT)
    supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'PhygitalPrint',
          filter: `eventId=eq.${EVENT_ID}`,
        },
        (payload) => {
          const newJob = payload.new;
          if (newJob.status === 'PENDING_PRINT') {
              console.log(`\n⚡ [WEBSOCKET] Novo comando recebido: ${newJob.referenceCode}`);
              pendingQueue.push(newJob);
              processQueue();
          }
        }
      )
      .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
              console.log('🟢 Conexão WebSocket estabelecida com sucesso!');
          }
      });

} else {
    // FALLBACK POLLING
    setInterval(fetchInitialQueue, 5000);
}

// ── CORE LOGIC ──

async function downloadAndPrint(job) {
    const filePath = path.join(tempDir, `${job.referenceCode}.jpg`);

    try {
        const imageRes = await fetch(job.imageUrl);
        if (!imageRes.ok) throw new Error(`Falha no download: ${imageRes.statusText}`);
        
        const buffer = await imageRes.arrayBuffer();
        fs.writeFileSync(filePath, Buffer.from(buffer));
        console.log(`📥 Download: ${job.referenceCode} OK`);

        if (process.env.MOCK_MODE === 'true') {
            console.log(`🖨️ Simulando impressão física da foto ${job.referenceCode}...`);
            await new Promise(resolve => setTimeout(resolve, 4000));
            await confirmAndCleanup(job, filePath);
            return;
        }

        await runPrintCommand(job, filePath);
        await confirmAndCleanup(job, filePath);

    } catch (err) {
        console.error(`❌ Erro fatal no job ${job.referenceCode}:`, err.message);
    }
}

function runPrintCommand(job, filePath) {
    return new Promise((resolve, reject) => {
        let printCommand;
        if (process.platform === "win32") {
            printCommand = `powershell -Command "Start-Process -FilePath '${filePath}' -Verb Print"`;
        } else {
            printCommand = `lp -d ${PRINTER_NAME} -o fit-to-page ${filePath}`;
        }

        exec(printCommand, (error) => {
            if (error) {
                console.error(`❌ Erro de Spooler: ${error.message}`);
                reject(error);
                return;
            }
            console.log(`🖨️  Spooler: ${job.referenceCode} enviado.`);
            resolve();
        });
    });
}

async function confirmAndCleanup(job, filePath) {
    try {
        const res = await fetch(`${BACKEND_URL}/api/admin/phygital/confirm`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AGENT_TOKEN}`
            },
            body: JSON.stringify({ id: job.id, status: 'PRINTED' })
        });

        if (res.ok) {
            console.log(`✅ Servidor Notificado: ${job.referenceCode}`);
            setTimeout(() => {
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }, 10000);
        }
    } catch (err) {
        console.error(`⚠️  Erro de rede na confirmação:`, err.message);
    }
}
