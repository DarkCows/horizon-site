import Link from "next/link";
import { DownloadStart } from "@/components/download-start";
import { getReleases, launcherBuild, RELEASES_URL, type LauncherTarget } from "@/components/github-releases";
import { AppleIcon, DownloadIcon, LinuxIcon, WindowsIcon } from "@/components/icons";
import { megabytes, TARGET_LABELS } from "@/components/launcher-platform";
import { LINK, NOT_OFFICIAL, Out } from "@/components/legal";
import { DOWNLOAD_URL } from "@/components/links";
import { pageMetadata } from "@/components/site";

export const metadata = pageMetadata({
  title: "Download · Horizon",
  description: "Download the Horizon launcher for Windows, macOS or Linux. It starts by itself for your computer.",
  path: "/download",
});

const TARGETS: { target: LauncherTarget; icon: typeof WindowsIcon }[] = [
  { target: "windows", icon: WindowsIcon },
  { target: "windows-arm64", icon: WindowsIcon },
  { target: "macos", icon: AppleIcon },
  { target: "macos-x64", icon: AppleIcon },
  { target: "linux", icon: LinuxIcon },
];

const fileName = (url: string) => decodeURIComponent(url.slice(url.lastIndexOf("/") + 1));

export default async function DownloadPage() {
  const launcher = launcherBuild(await getReleases());
  return (
    <main>
      <article className="mx-auto w-full max-w-3xl px-6 pt-32 pb-20 text-[16px] leading-relaxed text-pretty text-white/70 sm:pt-40 sm:pb-28 lg:px-10">
        <p className="text-sm font-medium text-white/60">{launcher ? `Launcher ${launcher.version}` : "Launcher"}</p>
        <h1 className="mt-4 font-display text-[clamp(2.25rem,6vw,4rem)] leading-[1.04] font-semibold tracking-[-0.035em] text-white">
          <span className="block">Download</span>
          <span className="text-accent block pb-1">Horizon</span>
        </h1>

        <DownloadStart build={launcher} />

        <section aria-labelledby="systems" className="mt-12">
          <h2 id="systems" className="font-display text-[1.6rem] leading-tight font-semibold tracking-[-0.02em] text-white">
            Every system
          </h2>
          {launcher ? (
            <ul className="mt-4 divide-y divide-white/[0.08] rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.08]">
              {TARGETS.map(({ target, icon: Icon }) => {
                const file = launcher.files[target];
                if (!file) return null;
                return (
                  <li key={target}>
                    <a href={file.url} className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-white/[0.04]">
                      <Icon className="size-4 shrink-0 text-white/75" />
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium text-white">{TARGET_LABELS[target]}</span>
                        <span className="block truncate text-sm text-white/50">{fileName(file.url)}</span>
                      </span>
                      <span className="shrink-0 text-sm text-white/50 tabular-nums">{megabytes(file.size)}</span>
                      <DownloadIcon className="size-4 shrink-0 text-white/75" />
                    </a>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4">They are all on GitHub, linked below.</p>
          )}
          <p className="mt-4">
            ZIP and AppImage builds, checksums and older versions:{" "}
            <Out href={`${RELEASES_URL}?q=launcher&expanded=true`}>the launcher releases on GitHub</Out>.
          </p>
        </section>

        <section aria-labelledby="next" className="mt-12">
          <h2 id="next" className="font-display text-[1.6rem] leading-tight font-semibold tracking-[-0.02em] text-white">
            Then
          </h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5">
            <li>Open the file and install the launcher.</li>
            <li>Sign in with the Microsoft account that owns Minecraft: Java Edition.</li>
            <li>Install a version, choose Prepare once, then Play.</li>
          </ol>
          <p className="mt-4">
            Each system&apos;s steps, what you need and the macOS security prompt are in the{" "}
            <Link href={DOWNLOAD_URL} className={LINK}>
              install guide
            </Link>
            .
          </p>
        </section>

        <p className="mt-12 text-sm font-medium text-white/80">{NOT_OFFICIAL}</p>
      </article>
    </main>
  );
}
