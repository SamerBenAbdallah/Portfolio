export const portfolioData = {
  playerLabel: "PLAYER 01",
  title: "PORTFOLIO",
  role: "GRAPHIC & MOTION DESIGNER",
  aboutHeading: "ABOUT PLAYER 01",
  about:
    "I'm a Graphic & Motion Designer who loves turning ideas into visual stories with personality and purpose.",
  profileImage: "",
  stats: [
    { icon: "/assets/arcade/icons/star.png", label: "EXPERIENCE", value: "XX+" },
    { icon: "/assets/arcade/icons/lightning-bolt.png", label: "PROJECTS", value: "XX+" },
    { icon: "/assets/arcade/icons/heart.png", label: "CLIENTS", value: "XX+" },
    { icon: "/assets/arcade/icons/crown.png", label: "ACHIEVEMENTS", value: "XX+" },
  ],
  skills: [
    { short: "Ae", name: "After Effects", color: "purple" },
    { short: "Ai", name: "Illustrator", color: "orange" },
    { short: "Ps", name: "Photoshop", color: "cyan" },
    { short: "Pr", name: "Premiere Pro", color: "violet" },
    { short: "Fi", name: "Figma", color: "pink" },
  ],
  navigation: ["ABOUT", "WORK", "MOTION", "CONTACT"],
} as const;
