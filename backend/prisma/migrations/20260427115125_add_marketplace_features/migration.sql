-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'CARTORIO', 'PROFISSIONAL', 'CLIENTE');

-- CreateEnum
CREATE TYPE "AcceptanceStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('PENDING', 'APROVADO', 'REJECTED', 'CONVERTED', 'PRICED');

-- CreateEnum
CREATE TYPE "RedemptionStatus" AS ENUM ('PENDING', 'APROVADO', 'PRINTING', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ContestStatus" AS ENUM ('DRAFT', 'ACTIVE', 'FINISHED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('ALBUM_FULL', 'PHOTO_MARKETPLACE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CLIENTE',
    "whatsapp" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "mpUserId" TEXT,
    "mpAccessToken" TEXT,
    "mpPublicKey" TEXT,
    "mpRefreshToken" TEXT,
    "pixKey" TEXT,
    "acceptedPrivacyAt" TIMESTAMP(3),
    "acceptedTermsAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "nomeNoivos" TEXT NOT NULL,
    "dataEvento" TIMESTAMP(3) NOT NULL,
    "cartorio" TEXT,
    "coverPhotoUrl" TEXT,
    "lightroomUrl" TEXT,
    "driveUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cartorioUserId" TEXT,
    "priceBase" DECIMAL(10,2) NOT NULL DEFAULT 190,
    "priceEarly" DECIMAL(10,2) NOT NULL DEFAULT 190,
    "captacaoId" TEXT,
    "edicaoId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "city" TEXT,
    "description" TEXT,
    "location" TEXT,
    "slug" TEXT,
    "temFoto" BOOLEAN NOT NULL DEFAULT true,
    "temFotoImpressa" BOOLEAN NOT NULL DEFAULT false,
    "temReels" BOOLEAN NOT NULL DEFAULT false,
    "temVideo" BOOLEAN NOT NULL DEFAULT false,
    "priceAlbum" DECIMAL(10,2),
    "priceFoto" DECIMAL(10,2),
    "priceFotoEditada" DECIMAL(10,2),
    "priceReels" DECIMAL(10,2),
    "priceVideo" DECIMAL(10,2),
    "priceVideoEditado" DECIMAL(10,2),
    "temAlbumImpresso" BOOLEAN NOT NULL DEFAULT false,
    "temFotoEditada" BOOLEAN NOT NULL DEFAULT false,
    "temVideoEditado" BOOLEAN NOT NULL DEFAULT false,
    "eventHours" INTEGER DEFAULT 2,
    "eventDays" INTEGER DEFAULT 1,
    "collectedAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "isCrowdfund" BOOLEAN NOT NULL DEFAULT false,
    "targetAmount" DECIMAL(10,2),
    "clientEmail" TEXT,
    "clientName" TEXT,
    "isQuote" BOOLEAN NOT NULL DEFAULT false,
    "quoteStatus" "QuoteStatus",
    "usageType" TEXT,
    "captacaoStatus" "AcceptanceStatus" NOT NULL DEFAULT 'PENDING',
    "edicaoStatus" "AcceptanceStatus" NOT NULL DEFAULT 'PENDING',
    "previewPhotos" TEXT,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "isUnitSale" BOOLEAN NOT NULL DEFAULT false,
    "priceUnit" DECIMAL(10,2) NOT NULL DEFAULT 10,
    "type" "EventType" NOT NULL DEFAULT 'ALBUM_FULL',
    "pricePerPhoto" DECIMAL(10,2),
    "marketplaceConfigs" JSONB DEFAULT '{}',
    "rejectedBy" JSONB DEFAULT '[]',

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profissionais" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "services" TEXT[],
    "cameras" TEXT[],
    "lenses" TEXT[],
    "lighting" TEXT[],
    "captPct" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "editPct" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "otherHabilities" TEXT,
    "equipment" TEXT,

    CONSTRAINT "profissionais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cartorios" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "razaoSocial" TEXT NOT NULL,
    "cnpj" TEXT,
    "splitPct" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "address" TEXT,
    "coverUrl" TEXT,
    "description" TEXT,
    "phone" TEXT,
    "slug" TEXT,
    "cidade" TEXT,
    "priceFoto" DECIMAL(10,2),
    "priceImpresso" DECIMAL(10,2),
    "priceReels" DECIMAL(10,2),
    "priceVideo" DECIMAL(10,2),
    "servicePrices" JSONB,
    "fixedDuration" INTEGER DEFAULT 2,
    "fixedTime" BOOLEAN NOT NULL DEFAULT false,
    "hideDuration" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "cartorios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cartorio_profissionais" (
    "id" TEXT NOT NULL,
    "cartorioId" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'FIXO',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cartorio_profissionais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clienteId" TEXT,
    "eventId" TEXT NOT NULL,
    "buyerEmail" TEXT,
    "splitCaptacao" DECIMAL(10,2),
    "splitCartorio" DECIMAL(10,2),
    "splitEdicao" DECIMAL(10,2),
    "splitMatriz" DECIMAL(10,2),
    "accessChosenAt" TIMESTAMP(3),
    "accessExpiresAt" TIMESTAMP(3),
    "accessType" TEXT,
    "deletedAt" TIMESTAMP(3),
    "warningsSent" INTEGER NOT NULL DEFAULT 0,
    "contributorName" TEXT,
    "isContribution" BOOLEAN NOT NULL DEFAULT false,
    "hasPaid" BOOLEAN NOT NULL DEFAULT false,
    "tempPassword" TEXT,
    "showAlbum" BOOLEAN NOT NULL DEFAULT true,
    "showVideo" BOOLEAN NOT NULL DEFAULT true,
    "isManual" BOOLEAN NOT NULL DEFAULT false,
    "manualType" TEXT,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "photo_likes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "photo_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professional_services" (
    "id" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "professional_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_media" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "shortId" TEXT NOT NULL,
    "price" DECIMAL(10,2),
    "type" TEXT NOT NULL DEFAULT 'PHOTO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "mediaId" TEXT,
    "serviceId" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_points" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "total" INTEGER NOT NULL DEFAULT 0,
    "redeemed" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "print_redemptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pointsUsed" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "packageType" TEXT NOT NULL,
    "status" "RedemptionStatus" NOT NULL DEFAULT 'PENDING',
    "selectedPhotos" TEXT[],
    "deliveryType" TEXT NOT NULL,
    "addressJson" TEXT,
    "trackingCode" TEXT,
    "supplierId" TEXT,
    "unitCost" DECIMAL(10,2),
    "shippingCost" DECIMAL(10,2),
    "totalCost" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "print_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "print_suppliers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "printerModel" TEXT,
    "printerCost" DECIMAL(10,2),
    "costPer10x15" DECIMAL(10,4) NOT NULL,
    "costPer4x6" DECIMAL(10,4),
    "boxCost" DECIMAL(10,4),
    "labelCost" DECIMAL(10,4),
    "uberCost" DECIMAL(10,2),
    "baseCep" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "print_suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contests" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "ContestStatus" NOT NULL DEFAULT 'DRAFT',
    "prize1st" TEXT NOT NULL,
    "prize2nd" TEXT,
    "prize3rd" TEXT,
    "prize1stPts" INTEGER NOT NULL,
    "prize2ndPts" INTEGER,
    "prize3rdPts" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_configs" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "platform_configs_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "weekly_payouts" (
    "id" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "weekEnd" TIMESTAMP(3) NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "totalRevenue" DECIMAL(10,2) NOT NULL,
    "totalPayout" DECIMAL(10,2) NOT NULL,
    "notesAdmin" TEXT,

    CONSTRAINT "weekly_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_items" (
    "id" TEXT NOT NULL,
    "payoutId" TEXT NOT NULL,
    "recipientType" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "pixKey" TEXT,
    "orderCount" INTEGER NOT NULL,
    "grossRevenue" DECIMAL(10,2) NOT NULL,
    "splitPct" DECIMAL(5,2) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "pixTxId" TEXT,

    CONSTRAINT "payout_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT NOT NULL,
    "clientPhone" TEXT,
    "eventDate" TIMESTAMP(3),
    "location" TEXT,
    "services" TEXT[],
    "notes" TEXT,
    "status" "QuoteStatus" NOT NULL DEFAULT 'PENDING',
    "convertedEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "print_products" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "supplierCost" DECIMAL(10,2) NOT NULL,
    "supplier" TEXT NOT NULL DEFAULT 'CK',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "marginPct" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "sellingPrice" DECIMAL(10,2),
    "description" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'un',
    "minQty" INTEGER,
    "maxQty" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "print_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "events_slug_key" ON "events"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "profissionais_userId_key" ON "profissionais"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "cartorios_userId_key" ON "cartorios"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "cartorios_cnpj_key" ON "cartorios"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "cartorios_slug_key" ON "cartorios"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "cartorio_profissionais_cartorioId_profissionalId_key" ON "cartorio_profissionais"("cartorioId", "profissionalId");

-- CreateIndex
CREATE UNIQUE INDEX "orders_paymentId_key" ON "orders"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "photo_likes_userId_eventId_photoUrl_key" ON "photo_likes"("userId", "eventId", "photoUrl");

-- CreateIndex
CREATE UNIQUE INDEX "event_media_eventId_shortId_key" ON "event_media"("eventId", "shortId");

-- CreateIndex
CREATE UNIQUE INDEX "user_points_userId_key" ON "user_points"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "print_products_sku_key" ON "print_products"("sku");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_captacaoId_fkey" FOREIGN KEY ("captacaoId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_cartorioUserId_fkey" FOREIGN KEY ("cartorioUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_edicaoId_fkey" FOREIGN KEY ("edicaoId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profissionais" ADD CONSTRAINT "profissionais_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cartorios" ADD CONSTRAINT "cartorios_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cartorio_profissionais" ADD CONSTRAINT "cartorio_profissionais_cartorioId_fkey" FOREIGN KEY ("cartorioId") REFERENCES "cartorios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cartorio_profissionais" ADD CONSTRAINT "cartorio_profissionais_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "profissionais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo_likes" ADD CONSTRAINT "photo_likes_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo_likes" ADD CONSTRAINT "photo_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_services" ADD CONSTRAINT "professional_services_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "profissionais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_media" ADD CONSTRAINT "event_media_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "event_media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "professional_services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_points" ADD CONSTRAINT "user_points_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "print_redemptions" ADD CONSTRAINT "print_redemptions_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "print_suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "print_redemptions" ADD CONSTRAINT "print_redemptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_items" ADD CONSTRAINT "payout_items_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "weekly_payouts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
