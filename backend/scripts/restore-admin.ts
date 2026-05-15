import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const adminData = {
  "id": "20db6d27-d373-4083-8637-692be8afb0e7",
  "email": "contatofotosegundo@gmail.com",
  "senha": "$2b$12$DuTV62NCVkppUeZ7bHmYZ.XTx/xSxy7KUugdZ0E7Iu9t0MTUkP84e",
  "nome": "Administrador Master",
  "role": "ADMIN",
  "whatsapp": null,
  "address": null,
  "active": true,
  "mpUserId": null,
  "mpAccessToken": null,
  "mpPublicKey": null,
  "mpRefreshToken": null,
  "pixKey": null,
  "acceptedPrivacyAt": null,
  "acceptedTermsAt": null,
  "resetToken": null,
  "resetTokenExpires": null,
  "isVerified": true,
  "profileComplete": true,
  "verificationDocs": null,
  "verificationStatus": "APPROVED",
  "referralCode": null,
  "rewardCredits": 0,
  "tenantLogoUrl": null,
  "tenantBrandColor": null,
  "affiliatePayoutType": "CREDIT"
};

async function main() {
  await (prisma.user as any).create({
    data: adminData
  });
  console.log("Admin restored successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
