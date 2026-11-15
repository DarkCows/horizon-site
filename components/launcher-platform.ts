import type { DesktopOs, LauncherBuild, LauncherTarget } from "@/components/github-releases";

// Which launcher a browser's computer runs, from what the browser says. Pure, so the Download buttons and /download
// choose the same file, and the tests can feed it user agents.

// The processor, from Chromium's client hints; other browsers don't say (null).
export type Arch = "arm" | "x86" | null;

export const TARGET_LABELS: Record<LauncherTarget, string> = {
  windows: "Windows (x64)",
  "windows-arm64": "Windows on ARM",
  macos: "macOS (Apple Silicon)",
  "macos-x64": "macOS (Intel)",
  linux: "Linux (x86-64)",
};

// iPads ask for the desktop site as a Mac; only their touch screen tells them apart.
export function isMobile(userAgent: string, maxTouchPoints: number): boolean {
  return /Android|iPhone|iPad|iPod/i.test(userAgent) || (/Macintosh|Mac OS X/i.test(userAgent) && maxTouchPoints > 1);
}

export function desktopOs(userAgent: string, maxTouchPoints: number): DesktopOs | null {
  if (isMobile(userAgent, maxTouchPoints)) return null;
  if (/Windows/i.test(userAgent)) return "windows";
  if (/Macintosh|Mac OS X/i.test(userAgent)) return "macos";
  if (/Linux|X11|CrOS/i.test(userAgent)) return "linux";
  return null;
}

// An Intel Mac gets the x64 disk image and Windows on ARM the ARM64 setup when the browser names the processor.
// Otherwise a Mac gets Apple Silicon's and Windows x64's, which Windows on ARM also runs.
export function launcherTarget(os: DesktopOs | null, arch: Arch): LauncherTarget | null {
  if (os === "macos" && arch === "x86") return "macos-x64";
  if (os === "windows" && arch === "arm") return "windows-arm64";
  return os;
}

export const megabytes = (bytes: number) => `${(bytes / 1e6).toFixed(1)} MB`;

const CRAWLER = /bot|crawl|spider|slurp|headless|lighthouse/i;

// The file /download starts by itself, or null when it should only offer the choices: crawlers, phones and tablets,
// systems without a launcher (ARM Linux, ChromeOS) and anything unrecognised.
export function autoDownload(
  build: LauncherBuild | null,
  userAgent: string,
  maxTouchPoints: number,
  arch: Arch,
): { target: LauncherTarget; url: string; size: number } | null {
  if (!build || CRAWLER.test(userAgent)) return null;
  const os = desktopOs(userAgent, maxTouchPoints);
  if (os === "linux" && (arch === "arm" || /aarch64|arm/i.test(userAgent) || /CrOS/.test(userAgent))) return null;
  const target = launcherTarget(os, arch);
  const file = target && build.files[target];
  return target && file ? { target, ...file } : null;
}
