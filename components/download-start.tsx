"use client";

import { useEffect, useState } from "react";
import type { LauncherBuild } from "@/components/github-releases";
import { askArch } from "@/components/launcher-download";
import { autoDownload, isMobile, megabytes, TARGET_LABELS } from "@/components/launcher-platform";
import { LINK } from "@/components/legal";

// Once per page load, even when React runs the effect twice or the visitor comes back to /download without reloading.
let started = false;

type State = { kind: "choose" } | { kind: "phone" } | { kind: "starting"; file: NonNullable<ReturnType<typeof autoDownload>>; archKnown: boolean };

// /download's status line. The server and browsers without JavaScript render the choices; in a desktop browser the
// matching launcher starts downloading by itself, and the page stays (GitHub sends the file as an attachment).
export function DownloadStart({ build }: { build: LauncherBuild | null }) {
  const [state, setState] = useState<State>({ kind: "choose" });

  useEffect(() => {
    let live = true;
    // Waits for the processor so Windows on ARM and Intel Macs don't get the other build.
    askArch().then((arch) => {
      if (!live) return;
      if (isMobile(navigator.userAgent, navigator.maxTouchPoints)) return setState({ kind: "phone" });
      const file = autoDownload(build, navigator.userAgent, navigator.maxTouchPoints, arch);
      if (!file || started) return;
      started = true;
      setState({ kind: "starting", file, archKnown: arch !== null });
      window.location.assign(file.url);
    });
    return () => {
      live = false;
    };
  }, [build]);

  if (state.kind === "starting") {
    const { file } = state;
    return (
      <div role="status" className="mt-8 rounded-2xl bg-white/[0.06] p-6 text-[15px] leading-relaxed text-white/70">
        <p className="text-lg font-medium text-white">Your download is starting</p>
        <p className="mt-2">
          Horizon launcher {build?.version} for {TARGET_LABELS[file.target]}, {megabytes(file.size)}. If it didn&apos;t start,{" "}
          <a href={file.url} className={LINK}>
            download it here
          </a>
          .
        </p>
        {file.target === "macos" && !state.archKnown && <p className="mt-2">On an Intel Mac, choose macOS (Intel) below instead.</p>}
      </div>
    );
  }

  return (
    <p className="mt-8 rounded-2xl bg-white/[0.06] p-6 text-[15px] leading-relaxed text-white/70">
      {state.kind === "phone"
        ? "Horizon runs on Windows, macOS and Linux computers. Open this page on one to download the launcher."
        : build
          ? "Choose the launcher for your computer."
          : "The launcher's files couldn't be loaded just now."}
    </p>
  );
}
