"use client";

import { type ChangeEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client";
import type { SiteSettings } from "../lib/settings/types";

type AssetFieldProps = {
  label: string;
  value: string;
  accept?: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onUpload: (file: File) => Promise<void>;
};

function AssetField({ label, value, accept = "image/*", disabled, onChange, onUpload }: AssetFieldProps) {
  return (
    <div className="admin-field wide admin-asset-field">
      <span>{label}</span>
      <div className="admin-asset-row">
        <input value={value} onChange={(event) => onChange(event.target.value)} />
        <label className="admin-upload-input">Upload<input disabled={disabled} type="file" accept={accept} onChange={(event) => { const file = event.target.files?.[0]; if (file) void onUpload(file); event.currentTarget.value = ""; }} /></label>
      </div>
      {value && accept.startsWith("image") && <div className="admin-setting-preview"><img src={value} alt="" /></div>}
    </div>
  );
}

export function SiteSettingsEditor({ initialSettings }: { initialSettings: SiteSettings }) {
  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [status, setStatus] = useState("Edit the fields below, then publish your changes.");

  function patch<K extends keyof SiteSettings>(section: K, values: Partial<SiteSettings[K]>) {
    setSettings((current) => ({ ...current, [section]: { ...current[section], ...values } }));
  }

  async function uploadAsset(file: File) {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new Error("Your session expired. Sign in again.");
    const extension = file.name.split(".").pop()?.toLowerCase() || "bin";
    const safeBase = file.name.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "asset";
    const path = `${auth.user.id}/${crypto.randomUUID()}-${safeBase}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("site-assets").upload(path, file, { cacheControl: "31536000", upsert: false });
    if (uploadError) throw uploadError;
    return supabase.storage.from("site-assets").getPublicUrl(path).data.publicUrl;
  }

  async function upload(file: File, onDone: (url: string) => void) {
    setBusy(true);
    setError(false);
    setStatus(`Uploading ${file.name}…`);
    try {
      onDone(await uploadAsset(file));
      setStatus("Upload complete. Publish site settings to make it live.");
    } catch (uploadError) {
      setError(true);
      setStatus(uploadError instanceof Error ? uploadError.message : "The asset could not be uploaded.");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    setBusy(true);
    setError(false);
    setStatus("Publishing site settings…");
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(settings),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "The site settings could not be saved.");
      setSettings(result.settings as SiteSettings);
      setStatus("Site settings published successfully.");
      router.refresh();
    } catch (saveError) {
      setError(true);
      setStatus(saveError instanceof Error ? saveError.message : "The site settings could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin-panel admin-settings" id="site-settings">
      <div className="admin-panel-header">
        <div><h1>Website content &amp; appearance</h1><p className="admin-help">Safe CMS controls for text, imagery, icons, colors, audio, and metadata. Layout and animations stay protected.</p></div>
        <button className="admin-primary" type="button" onClick={save} disabled={busy}>{busy ? "Working…" : "Publish settings"}</button>
      </div>
      <div className="admin-settings-body">
        <p className={`admin-status ${error ? "error" : ""}`} role="status" aria-live="polite">{status}</p>

        <details open>
          <summary>Branding &amp; intro screen</summary>
          <div className="admin-form-grid admin-settings-grid">
            <label className="admin-field wide"><span>Browser / search title</span><input value={settings.branding.siteTitle} onChange={(event) => patch("branding", { siteTitle: event.target.value })} /></label>
            <label className="admin-field wide"><span>Search description</span><textarea value={settings.branding.metaDescription} onChange={(event) => patch("branding", { metaDescription: event.target.value })} /></label>
            <AssetField label="Favicon / website icon" value={settings.branding.faviconUrl} disabled={busy} onChange={(faviconUrl) => patch("branding", { faviconUrl })} onUpload={(file) => upload(file, (faviconUrl) => patch("branding", { faviconUrl }))} />
            <AssetField label="Social sharing image" value={settings.branding.socialImageUrl} disabled={busy} onChange={(socialImageUrl) => patch("branding", { socialImageUrl })} onUpload={(file) => upload(file, (socialImageUrl) => patch("branding", { socialImageUrl }))} />
            <AssetField label="Intro arcade artwork" value={settings.homepage.arcadeImage} disabled={busy} onChange={(arcadeImage) => patch("homepage", { arcadeImage })} onUpload={(file) => upload(file, (arcadeImage) => patch("homepage", { arcadeImage }))} />
            <label className="admin-field wide"><span>Arcade image accessibility description</span><input value={settings.homepage.arcadeImageAlt} onChange={(event) => patch("homepage", { arcadeImageAlt: event.target.value })} /></label>
            <label className="admin-field"><span>Screen system label</span><input value={settings.homepage.systemLabel} onChange={(event) => patch("homepage", { systemLabel: event.target.value })} /></label>
            <label className="admin-field"><span>Screen status</span><input value={settings.homepage.screenPlayerLabel} onChange={(event) => patch("homepage", { screenPlayerLabel: event.target.value })} /></label>
            <label className="admin-field"><span>First start line</span><input value={settings.homepage.pressText} onChange={(event) => patch("homepage", { pressText: event.target.value })} /></label>
            <label className="admin-field"><span>Second start line</span><input value={settings.homepage.startText} onChange={(event) => patch("homepage", { startText: event.target.value })} /></label>
            <label className="admin-field"><span>Screen button label</span><input value={settings.homepage.screenCta} onChange={(event) => patch("homepage", { screenCta: event.target.value })} /></label>
            <label className="admin-field"><span>Bottom instruction</span><input value={settings.homepage.startHint} onChange={(event) => patch("homepage", { startHint: event.target.value })} /></label>
          </div>
        </details>

        <details>
          <summary>Profile, statistics &amp; skills</summary>
          <div className="admin-form-grid admin-settings-grid">
            <label className="admin-field"><span>Name</span><input value={settings.profile.name} onChange={(event) => patch("profile", { name: event.target.value })} /></label>
            <label className="admin-field"><span>Role</span><input value={settings.profile.role} onChange={(event) => patch("profile", { role: event.target.value })} /></label>
            <label className="admin-field"><span>Profile status label</span><input value={settings.profile.selectedLabel} onChange={(event) => patch("profile", { selectedLabel: event.target.value })} /></label>
            <label className="admin-field"><span>Work button label</span><input value={settings.profile.workButtonLabel} onChange={(event) => patch("profile", { workButtonLabel: event.target.value })} /></label>
            <label className="admin-field wide"><span>Biography</span><textarea value={settings.profile.about} onChange={(event) => patch("profile", { about: event.target.value })} /></label>
            <label className="admin-field wide"><span>Portrait caption</span><input value={settings.profile.profileCaption} onChange={(event) => patch("profile", { profileCaption: event.target.value })} /></label>
            <AssetField label="Profile image" value={settings.profile.profileImage} disabled={busy} onChange={(profileImage) => patch("profile", { profileImage })} onUpload={(file) => upload(file, (profileImage) => patch("profile", { profileImage }))} />
            <AssetField label="Brand mark / avatar icon" value={settings.profile.brandMark} disabled={busy} onChange={(brandMark) => patch("profile", { brandMark })} onUpload={(file) => upload(file, (brandMark) => patch("profile", { brandMark }))} />

            <div className="admin-repeater wide">
              <header><strong>Statistics</strong><button type="button" className="admin-secondary" onClick={() => patch("profile", { stats: [...settings.profile.stats, { icon: settings.profile.brandMark, value: "0+", label: "NEW STAT" }] })}>+ Add statistic</button></header>
              {settings.profile.stats.map((stat, index) => (
                <div className="admin-repeater-row" key={`${index}-${stat.label}`}>
                  <input aria-label={`Statistic ${index + 1} value`} value={stat.value} onChange={(event) => patch("profile", { stats: settings.profile.stats.map((item, itemIndex) => itemIndex === index ? { ...item, value: event.target.value } : item) })} />
                  <input aria-label={`Statistic ${index + 1} label`} value={stat.label} onChange={(event) => patch("profile", { stats: settings.profile.stats.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item) })} />
                  <input aria-label={`Statistic ${index + 1} icon URL`} value={stat.icon} onChange={(event) => patch("profile", { stats: settings.profile.stats.map((item, itemIndex) => itemIndex === index ? { ...item, icon: event.target.value } : item) })} />
                  <label className="admin-upload-input">Icon<input disabled={busy} type="file" accept="image/*" onChange={(event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (file) void upload(file, (icon) => patch("profile", { stats: settings.profile.stats.map((item, itemIndex) => itemIndex === index ? { ...item, icon } : item) })); }} /></label>
                  <button className="admin-danger" type="button" onClick={() => patch("profile", { stats: settings.profile.stats.filter((_, itemIndex) => itemIndex !== index) })}>Remove</button>
                </div>
              ))}
            </div>

            <div className="admin-repeater wide">
              <header><strong>Skills &amp; software icons</strong><button type="button" className="admin-secondary" onClick={() => patch("profile", { skills: [...settings.profile.skills, { icon: settings.profile.brandMark, name: "New skill" }] })}>+ Add skill</button></header>
              {settings.profile.skills.map((skill, index) => (
                <div className="admin-repeater-row compact" key={`${index}-${skill.name}`}>
                  <input aria-label={`Skill ${index + 1} name`} value={skill.name} onChange={(event) => patch("profile", { skills: settings.profile.skills.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item) })} />
                  <input aria-label={`Skill ${index + 1} icon URL`} value={skill.icon} onChange={(event) => patch("profile", { skills: settings.profile.skills.map((item, itemIndex) => itemIndex === index ? { ...item, icon: event.target.value } : item) })} />
                  <label className="admin-upload-input">Icon<input disabled={busy} type="file" accept="image/*,.svg" onChange={(event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (file) void upload(file, (icon) => patch("profile", { skills: settings.profile.skills.map((item, itemIndex) => itemIndex === index ? { ...item, icon } : item) })); }} /></label>
                  <button className="admin-danger" type="button" onClick={() => patch("profile", { skills: settings.profile.skills.filter((_, itemIndex) => itemIndex !== index) })}>Remove</button>
                </div>
              ))}
            </div>
          </div>
        </details>

        <details>
          <summary>Section headings &amp; navigation</summary>
          <div className="admin-form-grid admin-settings-grid">
            {settings.sections.navigation.map((label, index) => <label className="admin-field" key={index}><span>Navigation label {index + 1}</span><input value={label} onChange={(event) => patch("sections", { navigation: settings.sections.navigation.map((item, itemIndex) => itemIndex === index ? event.target.value : item) as SiteSettings["sections"]["navigation"] })} /></label>)}
            <label className="admin-field"><span>Profile level label</span><input value={settings.sections.profileLevelLabel} onChange={(event) => patch("sections", { profileLevelLabel: event.target.value })} /></label>
            <label className="admin-field"><span>Profile archive label</span><input value={settings.sections.profileArchiveLabel} onChange={(event) => patch("sections", { profileArchiveLabel: event.target.value })} /></label>
            {(["graphic", "motion", "contact"] as const).map((sectionName) => {
              const prefix = sectionName[0].toUpperCase() + sectionName.slice(1);
              const levelKey = `${sectionName}LevelLabel` as keyof SiteSettings["sections"];
              const archiveKey = `${sectionName}ArchiveLabel` as keyof SiteSettings["sections"];
              const eyebrowKey = `${sectionName}Eyebrow` as keyof SiteSettings["sections"];
              const accentKey = `${sectionName}HeadingAccent` as keyof SiteSettings["sections"];
              const restKey = `${sectionName}HeadingRest` as keyof SiteSettings["sections"];
              const introKey = `${sectionName}Intro` as keyof SiteSettings["sections"];
              return <div className="admin-section-group wide" key={sectionName}><h3>{prefix} section</h3><div className="admin-form-grid"><label className="admin-field"><span>Level label</span><input value={settings.sections[levelKey]} onChange={(event) => patch("sections", { [levelKey]: event.target.value })} /></label><label className="admin-field"><span>Archive label</span><input value={settings.sections[archiveKey]} onChange={(event) => patch("sections", { [archiveKey]: event.target.value })} /></label><label className="admin-field"><span>Eyebrow</span><input value={settings.sections[eyebrowKey]} onChange={(event) => patch("sections", { [eyebrowKey]: event.target.value })} /></label><label className="admin-field"><span>Highlighted heading</span><input value={settings.sections[accentKey]} onChange={(event) => patch("sections", { [accentKey]: event.target.value })} /></label><label className="admin-field"><span>Heading remainder</span><input value={settings.sections[restKey]} onChange={(event) => patch("sections", { [restKey]: event.target.value })} /></label><label className="admin-field wide"><span>Introduction</span><textarea value={settings.sections[introKey]} onChange={(event) => patch("sections", { [introKey]: event.target.value })} /></label></div></div>;
            })}
          </div>
        </details>

        <details>
          <summary>Contact &amp; footer</summary>
          <div className="admin-form-grid admin-settings-grid">
            <label className="admin-field"><span>Contact email</span><input type="email" value={settings.contact.email} onChange={(event) => patch("contact", { email: event.target.value })} /></label>
            <label className="admin-field"><span>Status label</span><input value={settings.contact.statusLabel} onChange={(event) => patch("contact", { statusLabel: event.target.value })} /></label>
            <label className="admin-field wide"><span>Availability heading</span><input value={settings.contact.availabilityHeading} onChange={(event) => patch("contact", { availabilityHeading: event.target.value })} /></label>
            {settings.contact.services.map((service, index) => <label className="admin-field" key={index}><span>Service {index + 1}</span><input value={service} onChange={(event) => patch("contact", { services: settings.contact.services.map((item, itemIndex) => itemIndex === index ? event.target.value : item) as SiteSettings["contact"]["services"] })} /></label>)}
            <label className="admin-field"><span>Response label</span><input value={settings.contact.responseLabel} onChange={(event) => patch("contact", { responseLabel: event.target.value })} /></label>
            <label className="admin-field"><span>Response value</span><input value={settings.contact.responseValue} onChange={(event) => patch("contact", { responseValue: event.target.value })} /></label>
            <label className="admin-field"><span>Send button</span><input value={settings.contact.sendButtonLabel} onChange={(event) => patch("contact", { sendButtonLabel: event.target.value })} /></label>
            <label className="admin-field"><span>Footer heading</span><input value={settings.footer.heading} onChange={(event) => patch("footer", { heading: event.target.value })} /></label>
            <label className="admin-field"><span>Footer subheading</span><input value={settings.footer.subheading} onChange={(event) => patch("footer", { subheading: event.target.value })} /></label>
            <label className="admin-field"><span>Copyright name</span><input value={settings.footer.copyright} onChange={(event) => patch("footer", { copyright: event.target.value })} /></label>
          </div>
        </details>

        <details>
          <summary>Colors &amp; music</summary>
          <div className="admin-form-grid admin-settings-grid">
            {(Object.entries(settings.theme) as [keyof SiteSettings["theme"], string][]).map(([key, value]) => <label className="admin-field admin-color-field" key={key}><span>{key.replace(/([A-Z])/g, " $1")}</span><div><input type="color" value={value} onChange={(event) => patch("theme", { [key]: event.target.value })} /><input value={value} onChange={(event) => patch("theme", { [key]: event.target.value })} pattern="#[0-9A-Fa-f]{6}" /></div></label>)}
            <div className="admin-checks"><label><input type="checkbox" checked={settings.audio.enabled} onChange={(event) => patch("audio", { enabled: event.target.checked })} /> Show music control</label></div>
            <label className="admin-field"><span>Music label</span><input value={settings.audio.label} onChange={(event) => patch("audio", { label: event.target.value })} /></label>
            <label className="admin-field"><span>Volume ({Math.round(settings.audio.volume * 100)}%)</span><input type="range" min="0" max="1" step="0.01" value={settings.audio.volume} onChange={(event) => patch("audio", { volume: Number(event.target.value) })} /></label>
            <AssetField label="Custom music file (leave empty for built-in arcade music)" value={settings.audio.audioUrl} accept="audio/*" disabled={busy} onChange={(audioUrl) => patch("audio", { audioUrl })} onUpload={(file) => upload(file, (audioUrl) => patch("audio", { audioUrl }))} />
          </div>
        </details>

        <div className="admin-settings-save"><p className={`admin-action-feedback ${error ? "error" : ""}`}>{status}</p><button className="admin-primary" type="button" onClick={save} disabled={busy}>{busy ? "Working…" : "Publish settings"}</button></div>
      </div>
    </section>
  );
}
