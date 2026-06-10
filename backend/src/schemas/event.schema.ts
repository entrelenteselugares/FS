import { z } from "zod";

export const updateEventSchema = z.object({
  temFotoImpressa: z.boolean().optional(),
  coverPhotoUrl: z.string().url().optional().nullable(),
  coverPosition: z.string().optional().nullable(),
  eventHours: z.number().nonnegative().optional(),
  isCrowdfund: z.boolean().optional(),
  targetAmount: z.number().nonnegative().optional().nullable(),
  isPrivate: z.boolean().optional(),
  isUnitSale: z.boolean().optional(),
  allowFreeDownload: z.boolean().optional(),
  priceUnit: z.number().nonnegative().optional(),
  type: z.string().optional(),
  pricePerPhoto: z.number().nonnegative().optional(),
  marketplaceConfigs: z.any().optional(), // Could be typed more strictly if needed
  clientEmail: z.string().email().optional().nullable(),
  clientName: z.string().optional().nullable(),
  retentionDays: z.number().nonnegative().optional(),
  preSaleEnabled: z.boolean().optional(),
});

