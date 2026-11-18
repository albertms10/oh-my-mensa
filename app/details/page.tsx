import { Dashboard } from "@/components/dashboard/Dashboard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Details – Allergen Analytics" };

export default function DetailsPage() {
  return <Dashboard />;
}
