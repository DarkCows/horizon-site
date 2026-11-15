"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import type { DesktopOs, LauncherBuild, LauncherTarget } from "@/components/github-releases";
import { desktopOs, launcherTarget, megabytes, type Arch } from "@/components/launcher-platform";
import { DOWNLOAD_URL } from "@/components/links";

function detect(): DesktopOs | null {
  return desktopOs(navigator.userAgent, navigator.maxTouchPoints);
}

// The processor, where the browser says (Chromium's client hints; the user agent string says Intel on every Mac and
// x64 on Windows on ARM). Read once, in the browser only; nothing leaves the page.
let arch: Arch = null;
let answer: Promise<Arch> | null = null;
const archListeners = new Set<() => void>();
type HintedNavigator = Navigator & {
  userAgentData?: { getHighEntropyValues(hints: string[]): Promise<{ architecture?: string }> };
};

// Settles once, with null when the browser doesn't say.
export function askArch(): Promise<Arch> {
  answer ??= ((navigator as HintedNavigator).userAgentData?.getHighEntropyValues(["architecture"]) ?? Promise.resolve({ architecture: undefined }))
    .then(({ architecture }): Arch => (architecture === "arm" ? "arm" : architecture === "x86" ? "x86" : null))
    .catch(() => null);
  return answer;
}

function subscribeArch(changed: () => void) {
  archListeners.add(changed);
  askArch().then((settled) => {
    if (settled === arch) return;
    arch = settled;
    archListeners.forEach((listener) => listener());
  });
  return () => {
    archListeners.delete(changed);
  };
}

const never = () => () => {};

function useDesktopOs() {
  return useSyncExternalStore(never, detect, () => null);
}

function useLauncherTarget(os: DesktopOs | null): LauncherTarget | null {
  const processor = useSyncExternalStore(subscribeArch, () => arch, () => null);
  return launcherTarget(os, processor);
}

export function LauncherLink({
  build,
  os,
  className,
  children,
}: {
  build: LauncherBuild | null;
  os?: DesktopOs;
  className?: string;
  children: ReactNode;
}) {
  const detected = useDesktopOs();
  // The processor is this computer's: a link to another system's launcher keeps that system's default build.
  const target = useLauncherTarget(os && os !== detected ? null : (os ?? detected));
  const href = (target && build?.files[target]?.url) ?? build?.files[os ?? detected ?? "windows"]?.url;
  return (
    <a href={(os || detected) && href ? href : DOWNLOAD_URL} className={className}>
      {children}
    </a>
  );
}

// `label` is "Launcher {version}" in the page's language.
export function LauncherMeta({ build, label, dot }: { build: LauncherBuild | null; label: string; dot: ReactNode }) {
  const detected = useDesktopOs();
  const target = useLauncherTarget(detected);
  if (!build) return null;
  const file = (target && build.files[target]) ?? build.files[detected ?? "windows"] ?? build.files.windows;
  return (
    <>
      {label.replace("{version}", build.version)}
      {file && (
        <>
          {dot}
          {megabytes(file.size)}
        </>
      )}
    </>
  );
}
