const projectToolIcons: Record<string, string> = {
  "after effects": "/assets/arcade/v3/adobe/after-effects.svg",
  illustrator: "/assets/arcade/v3/adobe/illustrator.svg",
  photoshop: "/assets/arcade/v3/adobe/photoshop.svg",
  "premiere pro": "/assets/arcade/v3/adobe/premiere-pro.svg",
};

export function ProjectToolIcons({ tools }: { tools: string[] }) {
  return (
    <span className="project-tool-icons" aria-label={`Tools: ${tools.join(", ")}`}>
      {tools.map((tool) => {
        const icon = projectToolIcons[tool.trim().toLowerCase()];
        return icon ? (
          <img className="project-tool-icon" src={icon} alt={tool} title={tool} key={tool} />
        ) : (
          <span className="project-tool-fallback" title={tool} aria-label={tool} key={tool}>{tool.slice(0, 2).toUpperCase()}</span>
        );
      })}
    </span>
  );
}
