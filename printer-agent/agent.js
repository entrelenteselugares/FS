import fs from 'fs';
import { exec } from 'child_process';
import path from 'path';
import 'dotenv/config';

/**
 * PRINTER AGENT FOTO SEGUNDO v1.1 (Resilience Update)
 * Script para rodar no Raspberry Pi (IoT)
 */

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const EVENT_ID = process.env.EVENT_ID;
const PRINTER_NAME = process.env.PRINTER_NAME || 'EPSON_L3250';
const AGENT_TOKEN = process.env.AGENT_TOKEN;
const AGENT_ID = process.env.AGENT_ID || 'iot-agent-001';

async function sendHeartbeat() {
    try {
        await fetch(`${BACKEND_URL}/api/iot/heartbeat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agentId: AGENT_ID, name: `Printer Agent (${PRINTER_NAME})` })
        });
    } catch (err) {
        // Silencioso para não poluir o log da impressora se o servidor oscilar
    } finally {
        setTimeout(sendHeartbeat, 60000); // Heartbeat a cada minuto
    }
}
sendHeartbeat();

// Cria a pasta temporária para as fotos
const tempDir = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
}

console.log('---');
console.log(`📡 Printer Agent v1.1 iniciado`);
console.log(`🎟️  Evento: ${EVENT_ID}`);
console.log(`🖨️  Impressora: ${PRINTER_NAME}`);
console.log('---');

let isProcessing = false;

async function checkPrintQueue() {
    if (isProcessing) return; // Evita múltiplas instâncias rodando

    try {
        const res = await fetch(`${BACKEND_URL}/api/admin/phygital/queue?eventId=${EVENT_ID}`, {
            headers: { 'Authorization': `Bearer ${AGENT_TOKEN}` }
        });
        
        const data = await res.json();

        if (data.success && data.pendingPrints && data.pendingPrints.length > 0) {
            console.log(`\n📸 ${data.pendingPrints.length} fotos novas detectadas.`);
            isProcessing = true;
            
            // Processa SEQUENCIALMENTE para não engasgar a impressora
            for (const job of data.pendingPrints) {
                console.log(`🚀 Iniciando: ${job.referenceCode}`);
                await downloadAndPrint(job);
            }
            
            isProcessing = false;
            console.log(`\n✅ Lote concluído. Aguardando novos disparos...`);
        }
    } catch (error) {
        console.error("⏳ Sem conexão ou servidor offline...");
    } finally {
        setTimeout(checkPrintQueue, 5000);
    }
}

async function downloadAndPrint(job) {
    const filePath = path.join(tempDir, `${job.referenceCode}.jpg`);

    try {
        // 1. Download
        const imageRes = await fetch(job.imageUrl);
        if (!imageRes.ok) throw new Error(`Falha no download: ${imageRes.statusText}`);
        
        const buffer = await imageRes.arrayBuffer();
        fs.writeFileSync(filePath, Buffer.from(buffer));
        console.log(`📥 Download: ${job.referenceCode} OK`);

        // 2. Lógica de Simulação (MOCK_MODE)
        if (process.env.MOCK_MODE === 'true') {
            console.log(`🖨️ Simulando impressão física da foto ${job.referenceCode}...`);
            
            await new Promise((resolve) => {
                setTimeout(async () => {
                    console.log(`✅ Papel "impresso" com sucesso!`);
                    
                    // Avisa o servidor central para tirar da fila
                    try {
                        await fetch(`${BACKEND_URL}/api/admin/phygital/confirm`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${AGENT_TOKEN}`
                            },
                            body: JSON.stringify({ id: job.id, status: 'PRINTED' })
                        });
                        console.log(`✅ Status atualizado no banco de dados.`);
                    } catch (fetchErr) {
                        console.error(`⚠️ Erro ao confirmar no servidor:`, fetchErr.message);
                    }
                    
                    // Limpa a foto do seu PC
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath); 
                    resolve();
                }, 4000);
            });
            return; // Ciclo concluído no modo mock
        }

        // 3. Impressão Real
        await runPrintCommand(job, filePath);

        // 4. Confirmação e Limpeza Real
        await confirmAndCleanup(job, filePath);

    } catch (err) {
        console.error(`❌ Erro fatal no job ${job.referenceCode}:`, err.message);
    }
}

function runPrintCommand(job, filePath) {
    return new Promise((resolve, reject) => {
        if (process.env.MOCK_MODE === "true") {
            console.log(`✨ [MOCK] Imprimindo: ${job.referenceCode}`);
            setTimeout(() => {
                console.log(`✨ [MOCK] Saída concluída.`);
                resolve();
            }, 3000);
            return;
        }

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
            // Limpa o arquivo local após 10 segundos (segurança para o spooler)
            setTimeout(() => {
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }, 10000);
        } else {
            console.warn(`⚠️  Falha ao confirmar no servidor: ${job.referenceCode}`);
        }
    } catch (err) {
        console.error(`⚠️  Erro de rede na confirmação:`, err.message);
    }
}

checkPrintQueue();
