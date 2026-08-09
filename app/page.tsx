import type { Metadata } from "next";
import { ArcadePortfolio } from "./portfolio/ArcadePortfolio";

export const metadata: Metadata = {
  title: "Samer Ben Abdallah — Graphic & Motion Designer",
  description: "Samer Ben Abdallah's interactive arcade-inspired graphic and motion design portfolio.",
};

export default function Home() {
  return <ArcadePortfolio />;
}
