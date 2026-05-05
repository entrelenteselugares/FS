import "dotenv/config";
import { driveService } from "./src/services/googleDrive.service";

async function testDriveConnection() {
  console.log("Teste de conexão com Google Drive Iniciado...");
  try {
    const folder = await driveService.createAlbumFolder("Teste Conexao Automatizada");
    console.log("Sucesso! Pasta criada com ID:", folder.id);
    
    // Clean up
    console.log("Limpando pasta de teste...");
    if (folder.id) {
       await driveService.deleteItem(folder.id);
       console.log("Pasta de teste removida.");
    }
  } catch (err: any) {
    console.error("Erro na conexão com o Google Drive:", err.message || err);
  }
}

testDriveConnection();
