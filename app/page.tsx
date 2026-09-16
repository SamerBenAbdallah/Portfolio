import type { Metadata } from "next";
import { ArcadePortfolio } from "./portfolio/ArcadePortfolio";
import { getPublishedProjects } from "./lib/projects/repository";
import { toArcadeProject } from "./lib/projects/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Samer Ben Abdallah — Graphic & Motion Designer",
  description: "Samer Ben Abdallah's interactive arcade-inspired graphic and motion design portfolio.",
};

export default async function Home() {
  const { projects } = await getPublishedProjects();
  return <ArcadePortfolio projects={projects.map(toArcadeProject)} />;
}
