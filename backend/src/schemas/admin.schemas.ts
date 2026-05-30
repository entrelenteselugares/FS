import { z } from "zod";

export const updateConfigsSchema = z.object({
  body: z.object({
    configs: z.array(
      z.object({
        key: z.string().min(1, "Key cannot be empty"),
        value: z.string(),
      })
    ).min(1, "At least one config must be provided"),
  })
});

export const serviceCatalogSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string(),
    basePrice: z.number().nonnegative(),
    priceProfessional: z.number().nonnegative().optional().default(0),
    priceMobile: z.number().nonnegative().optional().default(0),
    allowProfessional: z.boolean().optional().default(true),
    allowMobile: z.boolean().optional().default(false),
    category: z.string().min(1, "Category is required"),
  })
});
