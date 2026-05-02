import fs from 'fs';
import { exec } from 'child_process';
import path from 'path';
import 'dotenv/config';

/**
 * PRINTER AGENT FOTO SEGUNDO v1.0
 * Script para rodar no Raspberry Pi (IoT)
 */

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const EVENT_ID = process.env.EVENT_ID;
const PRINTER_NAME = process.env.PRINTER_NAME || 'EPSON_L3250';
const AGENT_TOKEN = process.env.AGENT_TOKEN;

// Cria a pasta temporária para as fotos
const tempDir = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
}

console.log('---');
console.log(`📡 Printer Agent iniciado para o evento: ${EVENT_ID}`);
console.log(`🖨️  Conectado à impressora: ${PRINTER_NAME}`);
console.log('---');

async function checkPrintQueue() {
    try {
        // 1. Pergunta ao backend se tem foto nova
        const res = await fetch(`${BACKEND_URL}/api/admin/phygital/queue?eventId=${EVENT_ID}`, {
            headers: { 'Authorization': `Bearer ${AGENT_TOKEN}` }
        });
        
        const data = await res.json();

        // 2. Se tiver foto pendente, inicia o processo
        if (data.success && data.pendingPrints && data.pendingPrints.length > 0) {
            console.log(`\n📸 ${data.pendingPrints.length} fotos detectadas na fila.`);
            
            for (const job of data.pendingPrints) {
                console.log(`🚀 Processando: ${job.referenceCode}`);
                await downloadAndPrint(job);
            }
        }
    } catch (error) {
        console.error("⏳ Aguardando conexão com o servidor ou verificando fila...");
    } finally {
        // Loop de 5 segundos
        setTimeout(checkPrintQueue, 5000);
    }
}

async function downloadAndPrint(job) {
    const filePath = path.join(tempDir, `${job.referenceCode}.jpg`);

    try {
        // Baixa a imagem carimbada do Supabase
        const imageRes = await fetch(job.imageUrl);
        const buffer = await imageRes.arrayBuffer();
        fs.writeFileSync(filePath, Buffer.from(buffer));
        console.log(`📥 Download concluído: ${job.referenceCode}`);

        // COMANDO DE IMPRESSÃO (Multi-plataforma com Modo Simulado)
        if (process.env.MOCK_MODE === "true") {
            console.log(`✨ [MOCK] Simulando impressão da foto: ${job.referenceCode}`);
            console.log(`✨ [MOCK] Aguardando 3 segundos para simular a saída do papel...`);
            
            setTimeout(async () => {
                console.log(`✅ [MOCK] ${job.referenceCode} "impresso" com sucesso!`);
                await confirmAndCleanup(job, filePath);
            }, 3000);
            return;
        }

        let printCommand;
        if (process.platform === "win32") {
            printCommand = `powershell -Command "Start-Process -FilePath '${filePath}' -Verb Print"`;
        } else {
            printCommand = `lp -d ${PRINTER_NAME} -o fit-to-page ${filePath}`;
        }

        exec(printCommand, async (error) => {
            if (error) {
                console.error(`❌ Erro na impressora: ${error.message}`);
                return;
            }
            await confirmAndCleanup(job, filePath);
        });
    } catch (err) {
        console.error(`Erro ao processar a foto ${job.referenceCode}:`, err);
    }
}

async function confirmAndCleanup(job, filePath) {
    console.log(`✅ Enviado para a fila de impressão!`);

    // Avisa o servidor que já imprimiu
    await fetch(`${BACKEND_URL}/api/admin/phygital/confirm`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AGENT_TOKEN}`
        },
        body: JSON.stringify({ id: job.id, status: 'PRINTED' })
    });
    console.log(`✅ Status atualizado no sistema central.`);
    
    // Limpa o arquivo local
    setTimeout(() => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }, 5000);
}

// Inicia o ciclo
checkPrintQueue();
