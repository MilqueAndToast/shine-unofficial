// Builds the Firefox version of SHINE in dist/firefox.
//
//   node tools/build-firefox.mjs
//
// manifest.json is written for Chrome and Edge, which run the background
// script as a service worker. Firefox runs it as a background script instead,
// and Chrome and Edge warn about the "background.scripts" key, so the Firefox
// manifest is generated here rather than kept in the main one. Everything else
// is copied as is. Needs Node 18 or newer; no packages.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "dist", "firefox");

// Not part of the extension (THIRD_PARTY_NOTICES.md and licenses/ are kept)
const skipNames = new Set([".git", ".github", ".gitignore", ".gitattributes", ".editorconfig", "_metadata", "dist", "tools", "node_modules", "README.md", "TODO.md"]);
const skipFile = (name) => /\.scss$/i.test(name);

function copyDir(from, to) {
	fs.mkdirSync(to, { recursive: true });
	for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
		if (skipNames.has(entry.name)) {
			continue;
		}
		const src = path.join(from, entry.name);
		const dest = path.join(to, entry.name);
		if (entry.isDirectory()) {
			if (entry.name === "base" && path.basename(from) === "colors") {
				continue; // SCSS partials
			}
			copyDir(src, dest);
		} else if (entry.isFile() && !skipFile(entry.name)) {
			fs.copyFileSync(src, dest);
		}
	}
}

fs.rmSync(out, { recursive: true, force: true });
copyDir(root, out);

const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));

// Firefox: background script (event page) instead of a service worker
manifest.background = { scripts: [manifest.background.service_worker] };

manifest.browser_specific_settings = {
	gecko: {
		id: "shine-unofficial@fork.local",
		strict_min_version: "128.0"
	}
};

fs.writeFileSync(path.join(out, "manifest.json"), JSON.stringify(manifest, null, "\t") + "\n");

console.log("Built " + path.relative(root, out) + " (version " + manifest.version + ")");
console.log("Load it in Firefox from about:debugging#/runtime/this-firefox > Load Temporary Add-on > dist/firefox/manifest.json");
