import assert from "node:assert/strict";
import { test } from "node:test";
import type { LauncherBuild } from "./github-releases.ts";
import { autoDownload, type Arch } from "./launcher-platform.ts";

const release = "https://github.com/horizon-rust/horizon/releases/download/launcher%400.2.67";
const build: LauncherBuild = {
  version: "0.2.67",
  files: {
    windows: { url: `${release}/horizon-launcher-setup.exe`, size: 9_000_000 },
    "windows-arm64": { url: `${release}/horizon-launcher-setup-arm64.exe`, size: 8_000_000 },
    macos: { url: `${release}/horizon-launcher-macos-arm64.dmg`, size: 12_000_000 },
    "macos-x64": { url: `${release}/horizon-launcher-macos-x64.dmg`, size: 13_000_000 },
    linux: { url: `${release}/horizon-launcher-linux-x86_64.tar.gz`, size: 10_000_000 },
  },
};

const UA = {
  windows: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
  windowsFirefox: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:145.0) Gecko/20100101 Firefox/145.0",
  mac: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
  macSafari: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.1 Safari/605.1.15",
  linux: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
  linuxArm: "Mozilla/5.0 (X11; Linux aarch64; rv:145.0) Gecko/20100101 Firefox/145.0",
  chromeOs: "Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
  android: "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36",
  iphone: "Mozilla/5.0 (iPhone; CPU iPhone OS 26_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.1 Mobile/15E148 Safari/604.1",
  googlebot: "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  bingbot: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0 (compatible; bingbot/2.0)",
  headless: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/142.0.0.0 Safari/537.36",
  unknown: "Mozilla/5.0 (PlayStation; PlayStation 5/6.00) AppleWebKit/605.1.15 (KHTML, like Gecko)",
};

const file = (ua: string, arch: Arch = null, touch = 0) => autoDownload(build, ua, touch, arch)?.url.split("/").at(-1) ?? null;

test("a desktop gets its own launcher", () => {
  assert.equal(file(UA.windows, "x86"), "horizon-launcher-setup.exe");
  assert.equal(file(UA.windows, "arm"), "horizon-launcher-setup-arm64.exe");
  assert.equal(file(UA.mac, "arm"), "horizon-launcher-macos-arm64.dmg");
  assert.equal(file(UA.mac, "x86"), "horizon-launcher-macos-x64.dmg");
  assert.equal(file(UA.linux, "x86"), "horizon-launcher-linux-x86_64.tar.gz");
});

test("without the processor, Windows gets x64 and a Mac Apple Silicon", () => {
  assert.equal(file(UA.windowsFirefox), "horizon-launcher-setup.exe");
  assert.equal(file(UA.macSafari), "horizon-launcher-macos-arm64.dmg");
  assert.equal(file(UA.linux), "horizon-launcher-linux-x86_64.tar.gz");
});

test("the target and size come with the file", () => {
  assert.deepEqual(autoDownload(build, UA.windows, 0, "arm"), { target: "windows-arm64", ...build.files["windows-arm64"] });
});

test("phones, tablets and crawlers download nothing by themselves", () => {
  assert.equal(file(UA.android), null);
  assert.equal(file(UA.iphone), null);
  assert.equal(file(UA.macSafari, null, 5), null, "an iPad asking for the desktop site");
  assert.equal(file(UA.googlebot), null);
  assert.equal(file(UA.bingbot, "x86"), null);
  assert.equal(file(UA.headless, "x86"), null);
});

test("systems without a launcher download nothing by themselves", () => {
  assert.equal(file(UA.unknown), null);
  assert.equal(file(""), null);
  assert.equal(file(UA.linuxArm), null);
  assert.equal(file(UA.linux, "arm"), null);
  assert.equal(file(UA.chromeOs, "x86"), null);
});

test("nothing starts without a release, or without this system's file in it", () => {
  assert.equal(autoDownload(null, UA.windows, 0, "x86"), null);
  assert.equal(autoDownload({ version: "0.2.67", files: { windows: build.files.windows } }, UA.mac, 0, "arm"), null);
});
