import { driveService } from './src/services/googleDrive.service';

async function testResumable() {
    // Access the drive client inside driveService
    const drive = (driveService as any).drive;
    if (!drive) {
        console.log("Drive mock mode active, can't test.");
        return;
    }

    try {
        const authClient = drive._options.auth;
        const token = await authClient.getAccessToken();
        console.log("Token:", token.token ? "Exists" : "Null");
    } catch (e) {
        console.error("Error:", e);
    }
}

testResumable();
