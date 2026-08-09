import type { Metadata } from "next";
import { ArcadePortfolio } from "./portfolio/ArcadePortfolio";

export const metadata: Metadata = {
  title: "Player 01 — Graphic & Motion Designer",
  description: "An interactive arcade-inspired graphic and motion design portfolio.",
};

export default function Home() {
  return <ArcadePortfolio />;
}
