import { z } from "zod";

const dishSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    allergens: z.array(z.string()).optional(),
    allergensKnown: z.boolean().optional(),
    image: z.string().optional(),
  })
  .transform((d) => ({
    id: d.id,
    name: d.name,
    allergens: d.allergens ?? [],
    // A missing allergens field is "unknown", never "none".
    ...(d.allergensKnown === false || d.allergens === undefined ? { allergensKnown: false } : {}),
    ...(d.image ? { image: d.image } : {}),
  }));

export const menuEntriesSchema = z.array(
  z.object({
    locationId: z.string().min(1),
    locationName: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    mealGroup: z.string().default("Unknown"),
    dishes: z.array(dishSchema),
  }),
);

export const locationsSchema = z.array(z.object({ id: z.string().min(1), name: z.string().min(1) }));
