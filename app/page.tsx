import { ArcadePortfolio } from "./portfolio/ArcadePortfolio";
import { getPublishedProjects } from "./lib/projects/repository";
import { toArcadeProject } from "./lib/projects/types";
import { getSiteSettings } from "./lib/settings/repository";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [{ projects }, settings] = await Promise.all([getPublishedProjects(), getSiteSettings()]);
  return <ArcadePortfolio projects={projects.map(toArcadeProject)} settings={settings} />;
}
