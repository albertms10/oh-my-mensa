import { z } from "zod";

export const menuEntriesSchema = z.array(
  z.object({
    locationId: z.string().min(1),
    locationName: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    mealGroup: z.string().default("Unknown"),
    dishes: z.array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        allergens: z.array(z.string()).default([]),
        image: z.string().optional(),
      }),
    ),
  }),
);
