import { portfolioData } from "../../data/portfolio";

export type SiteStat = { icon: string; label: string; value: string };
export type SiteSkill = { name: string; icon: string };

export type SiteSettings = {
  branding: {
    siteTitle: string;
    metaDescription: string;
    faviconUrl: string;
    socialImageUrl: string;
  };
  homepage: {
    arcadeImage: string;
    arcadeImageAlt: string;
    systemLabel: string;
    screenPlayerLabel: string;
    pressText: string;
    startText: string;
    screenCta: string;
    startHint: string;
  };
  profile: {
    name: string;
    role: string;
    selectedLabel: string;
    about: string;
    profileImage: string;
    brandMark: string;
    profileCaption: string;
    workButtonLabel: string;
    stats: SiteStat[];
    skills: SiteSkill[];
  };
  sections: {
    navigation: [string, string, string, string];
    profileLevelLabel: string;
    profileArchiveLabel: string;
    graphicLevelLabel: string;
    graphicArchiveLabel: string;
    graphicEyebrow: string;
    graphicHeadingAccent: string;
    graphicHeadingRest: string;
    graphicIntro: string;
    motionLevelLabel: string;
    motionArchiveLabel: string;
    motionEyebrow: string;
    motionHeadingAccent: string;
    motionHeadingRest: string;
    motionIntro: string;
    contactLevelLabel: string;
    contactArchiveLabel: string;
    contactEyebrow: string;
    contactHeadingAccent: string;
    contactHeadingRest: string;
    contactIntro: string;
  };
  contact: {
    email: string;
    statusLabel: string;
    availabilityHeading: string;
    services: [string, string, string];
    responseLabel: string;
    responseValue: string;
    sendButtonLabel: string;
  };
  footer: {
    heading: string;
    subheading: string;
    copyright: string;
  };
  theme: {
    ink: string;
    blue: string;
    cyan: string;
    pink: string;
    yellow: string;
    shellYellow: string;
    shellPink: string;
    shellBlue: string;
  };
  audio: {
    enabled: boolean;
    label: string;
    audioUrl: string;
    volume: number;
  };
};

export const defaultSiteSettings: SiteSettings = {
  branding: {
    siteTitle: "Samer Ben Abdallah — Graphic & Motion Designer",
    metaDescription: "Samer Ben Abdallah's interactive arcade-inspired graphic and motion design portfolio.",
    faviconUrl: portfolioData.brandMark,
    socialImageUrl: "/og-v3.png",
  },
  homepage: {
    arcadeImage: "/assets/arcade/v2/arcade-room-v2.png",
    arcadeImageAlt: "A glowing red Pac-Man-inspired arcade cabinet surrounded by colorful pixel ghosts",
    systemLabel: "PLAYER 1 // INSERT COIN",
    screenPlayerLabel: "READY!",
    pressText: "PRESS",
    startText: "START",
    screenCta: "CLICK TO PLAY",
    startHint: "INSERT COIN · CLICK THE SCREEN",
  },
  profile: {
    name: portfolioData.playerLabel,
    role: portfolioData.role,
    selectedLabel: "CHARACTER SELECTED",
    about: portfolioData.about,
    profileImage: portfolioData.profileImage,
    brandMark: portfolioData.brandMark,
    profileCaption: `${portfolioData.playerLabel} // ${portfolioData.role}`,
    workButtonLabel: "VIEW MY WORK",
    stats: portfolioData.stats.map((stat) => ({ ...stat })),
    skills: portfolioData.skills.map((skill) => ({ ...skill })),
  },
  sections: {
    navigation: ["ABOUT", "WORK", "MOTION", "CONTACT"],
    profileLevelLabel: "LEVEL 01",
    profileArchiveLabel: "PLAYER PROFILE",
    graphicLevelLabel: "LEVEL 02",
    graphicArchiveLabel: "DESIGN ARCHIVE",
    graphicEyebrow: "SELECT A CASE FILE",
    graphicHeadingAccent: "GRAPHIC",
    graphicHeadingRest: "DESIGN",
    graphicIntro: "Identity systems, campaigns, and visual tools built to make ideas recognizable at every size.",
    motionLevelLabel: "LEVEL 03",
    motionArchiveLabel: "MOTION LAB",
    motionEyebrow: "PRESS PLAY",
    motionHeadingAccent: "MOTION",
    motionHeadingRest: "DESIGN",
    motionIntro: "Motion systems where timing, type, sound, and transitions turn static ideas into memorable stories.",
    contactLevelLabel: "LEVEL 04",
    contactArchiveLabel: "PLAYER TWO WANTED",
    contactEyebrow: "NEW MISSION AVAILABLE",
    contactHeadingAccent: "LET'S CREATE",
    contactHeadingRest: "SOMETHING",
    contactIntro: "Have a brand, campaign, or motion idea in mind? Send the mission brief and let's build the next level together.",
  },
  contact: {
    email: portfolioData.contactEmail,
    statusLabel: "PLAYER 01 STATUS",
    availabilityHeading: "AVAILABLE FOR SELECT FREELANCE PROJECTS",
    services: ["Brand identity & campaigns", "Motion graphics & editing", "Social content systems"],
    responseLabel: "TYPICAL RESPONSE",
    responseValue: "WITHIN 1–2 DAYS",
    sendButtonLabel: "SEND MESSAGE",
  },
  footer: {
    heading: "THANKS FOR PLAYING",
    subheading: "INSERT COIN TO CONTINUE",
    copyright: "SAMER BEN ABDALLAH",
  },
  theme: {
    ink: "#01020d",
    blue: "#123cc5",
    cyan: "#1fe7ff",
    pink: "#ff2f95",
    yellow: "#ffd21c",
    shellYellow: "#ffd21c",
    shellPink: "#ff2f95",
    shellBlue: "#1957f2",
  },
  audio: {
    enabled: true,
    label: "ARCADE RUN",
    audioUrl: "",
    volume: 0.38,
  },
};

type UnknownRecord = Record<string, unknown>;

function record(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as UnknownRecord : {};
}

function text(value: unknown, fallback: string, max = 500) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : fallback;
}

function color(value: unknown, fallback: string) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

function tuple(values: unknown, fallback: [string, string, string]): [string, string, string] {
  const list = Array.isArray(values) ? values : [];
  return fallback.map((item, index) => text(list[index], item, 120)) as [string, string, string];
}

export function normalizeSiteSettings(value: unknown): SiteSettings {
  const source = record(value);
  const branding = record(source.branding);
  const homepage = record(source.homepage);
  const profile = record(source.profile);
  const sections = record(source.sections);
  const contact = record(source.contact);
  const footer = record(source.footer);
  const theme = record(source.theme);
  const audio = record(source.audio);
  const defaults = defaultSiteSettings;
  const stats = Array.isArray(profile.stats) ? profile.stats.slice(0, 8).map(record) : [];
  const skills = Array.isArray(profile.skills) ? profile.skills.slice(0, 16).map(record) : [];
  const nav = Array.isArray(sections.navigation) ? sections.navigation : [];
  const savedAudioUrl = typeof audio.audioUrl === "string" ? audio.audioUrl.trim().slice(0, 1200) : defaults.audio.audioUrl;
  const retiredSoundtrack = /toru-always-with-me-ghibli\.mp3(?:$|\?)/i.test(savedAudioUrl);

  return {
    branding: {
      siteTitle: text(branding.siteTitle, defaults.branding.siteTitle, 160),
      metaDescription: text(branding.metaDescription, defaults.branding.metaDescription, 320),
      faviconUrl: text(branding.faviconUrl, defaults.branding.faviconUrl, 1200),
      socialImageUrl: text(branding.socialImageUrl, defaults.branding.socialImageUrl, 1200),
    },
    homepage: {
      arcadeImage: text(homepage.arcadeImage, defaults.homepage.arcadeImage, 1200),
      arcadeImageAlt: text(homepage.arcadeImageAlt, defaults.homepage.arcadeImageAlt, 240),
      systemLabel: text(homepage.systemLabel, defaults.homepage.systemLabel, 100),
      screenPlayerLabel: text(homepage.screenPlayerLabel, defaults.homepage.screenPlayerLabel, 60),
      pressText: text(homepage.pressText, defaults.homepage.pressText, 40),
      startText: text(homepage.startText, defaults.homepage.startText, 40),
      screenCta: text(homepage.screenCta, defaults.homepage.screenCta, 80),
      startHint: text(homepage.startHint, defaults.homepage.startHint, 100),
    },
    profile: {
      name: text(profile.name, defaults.profile.name, 120),
      role: text(profile.role, defaults.profile.role, 160),
      selectedLabel: text(profile.selectedLabel, defaults.profile.selectedLabel, 100),
      about: text(profile.about, defaults.profile.about, 1200),
      profileImage: text(profile.profileImage, defaults.profile.profileImage, 1200),
      brandMark: text(profile.brandMark, defaults.profile.brandMark, 1200),
      profileCaption: text(profile.profileCaption, defaults.profile.profileCaption, 200),
      workButtonLabel: text(profile.workButtonLabel, defaults.profile.workButtonLabel, 80),
      stats: stats.length ? stats.map((item, index) => ({
        icon: text(item.icon, defaults.profile.stats[index]?.icon ?? defaults.profile.brandMark, 1200),
        label: text(item.label, defaults.profile.stats[index]?.label ?? "STAT", 100),
        value: text(item.value, defaults.profile.stats[index]?.value ?? "0", 40),
      })) : defaults.profile.stats.map((item) => ({ ...item })),
      skills: skills.length ? skills.map((item, index) => ({
        name: text(item.name, defaults.profile.skills[index]?.name ?? "Skill", 100),
        icon: text(item.icon, defaults.profile.skills[index]?.icon ?? defaults.profile.brandMark, 1200),
      })) : defaults.profile.skills.map((item) => ({ ...item })),
    },
    sections: {
      navigation: defaults.sections.navigation.map((item, index) => text(nav[index], item, 30)) as [string, string, string, string],
      profileLevelLabel: text(sections.profileLevelLabel, defaults.sections.profileLevelLabel, 40),
      profileArchiveLabel: text(sections.profileArchiveLabel, defaults.sections.profileArchiveLabel, 80),
      graphicLevelLabel: text(sections.graphicLevelLabel, defaults.sections.graphicLevelLabel, 40),
      graphicArchiveLabel: text(sections.graphicArchiveLabel, defaults.sections.graphicArchiveLabel, 80),
      graphicEyebrow: text(sections.graphicEyebrow, defaults.sections.graphicEyebrow, 100),
      graphicHeadingAccent: text(sections.graphicHeadingAccent, defaults.sections.graphicHeadingAccent, 80),
      graphicHeadingRest: text(sections.graphicHeadingRest, defaults.sections.graphicHeadingRest, 80),
      graphicIntro: text(sections.graphicIntro, defaults.sections.graphicIntro, 500),
      motionLevelLabel: text(sections.motionLevelLabel, defaults.sections.motionLevelLabel, 40),
      motionArchiveLabel: text(sections.motionArchiveLabel, defaults.sections.motionArchiveLabel, 80),
      motionEyebrow: text(sections.motionEyebrow, defaults.sections.motionEyebrow, 100),
      motionHeadingAccent: text(sections.motionHeadingAccent, defaults.sections.motionHeadingAccent, 80),
      motionHeadingRest: text(sections.motionHeadingRest, defaults.sections.motionHeadingRest, 80),
      motionIntro: text(sections.motionIntro, defaults.sections.motionIntro, 500),
      contactLevelLabel: text(sections.contactLevelLabel, defaults.sections.contactLevelLabel, 40),
      contactArchiveLabel: text(sections.contactArchiveLabel, defaults.sections.contactArchiveLabel, 80),
      contactEyebrow: text(sections.contactEyebrow, defaults.sections.contactEyebrow, 100),
      contactHeadingAccent: text(sections.contactHeadingAccent, defaults.sections.contactHeadingAccent, 80),
      contactHeadingRest: text(sections.contactHeadingRest, defaults.sections.contactHeadingRest, 80),
      contactIntro: text(sections.contactIntro, defaults.sections.contactIntro, 500),
    },
    contact: {
      email: text(contact.email, defaults.contact.email, 200),
      statusLabel: text(contact.statusLabel, defaults.contact.statusLabel, 80),
      availabilityHeading: text(contact.availabilityHeading, defaults.contact.availabilityHeading, 200),
      services: tuple(contact.services, defaults.contact.services),
      responseLabel: text(contact.responseLabel, defaults.contact.responseLabel, 80),
      responseValue: text(contact.responseValue, defaults.contact.responseValue, 100),
      sendButtonLabel: text(contact.sendButtonLabel, defaults.contact.sendButtonLabel, 80),
    },
    footer: {
      heading: text(footer.heading, defaults.footer.heading, 100),
      subheading: text(footer.subheading, defaults.footer.subheading, 120),
      copyright: text(footer.copyright, defaults.footer.copyright, 120),
    },
    theme: {
      ink: color(theme.ink, defaults.theme.ink),
      blue: color(theme.blue, defaults.theme.blue),
      cyan: color(theme.cyan, defaults.theme.cyan),
      pink: color(theme.pink, defaults.theme.pink),
      yellow: color(theme.yellow, defaults.theme.yellow),
      shellYellow: color(theme.shellYellow, defaults.theme.shellYellow),
      shellPink: color(theme.shellPink, defaults.theme.shellPink),
      shellBlue: color(theme.shellBlue, defaults.theme.shellBlue),
    },
    audio: {
      enabled: typeof audio.enabled === "boolean" ? audio.enabled : defaults.audio.enabled,
      label: retiredSoundtrack ? defaults.audio.label : text(audio.label, defaults.audio.label, 80),
      audioUrl: retiredSoundtrack ? "" : savedAudioUrl,
      volume: Math.min(1, Math.max(0, typeof audio.volume === "number" ? audio.volume : defaults.audio.volume)),
    },
  };
}
