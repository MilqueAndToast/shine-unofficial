# <img src="icon-128.png" width="32"> SHINE for Reddit (unofficial), 2.0 fork

A fork of [dotvhs/shine-unofficial](https://github.com/dotvhs/shine-unofficial), updated so it loads in today's browsers and works with today's Reddit.

SHINE restyles **old reddit** (old.reddit.com) with modern list and grid views, inline media, themes and colors. Upstream stopped at 1.6.0 in 2018. Its `master` branch had unresolved merge conflicts, it used Manifest V2 (which Chrome and Edge no longer load), and several media services it relied on have shut down or changed.

## What changed in 2.0

**Runs in current browsers**
- Manifest V3 with a service worker. Loads in current Chrome and Edge. Firefox 128+ gets its own manifest from a small build script; it should work but hasn't been tested yet (see [TODO.md](TODO.md)).
- Starts from upstream's `develop` branch, which has the merge conflicts resolved (upstream issues #13, #29, #34, #40).
- The list and grid scripts run in the page through `chrome.scripting` instead of `$.getScript`, in a fixed order (upstream loaded them in parallel, which was a race).
- jQuery for the content script updated from 2.1.4 to 3.7.1.

**Works with today's Reddit**
- Optional redirect from www.reddit.com to old.reddit.com, on by default and switchable in SHINE settings. Reddit's image viewer (`/media`), share links (`/s/`), settings, chat and similar pages are not redirected (#41).
- The toolbar button opens old.reddit.com.
- Styles only apply to the old design, so the redesign isn't broken. Old design served on www (via the old-reddit preference) is detected and styled.
- Reddit video (v.redd.it) plays with sound, using hls.js where needed, in both list and grid views.
- Reddit galleries open as albums, with thumbnails.
- Grid view shows thumbnails for reddit video, galleries, Twitch clips and Streamable (#35).
- Media details come from the expando markup old reddit already includes in the page. When that isn't enough, the post's JSON is fetched one post at a time, only for cards near the screen.

**Fixed media**
- Gifs no longer show as a black box: Imgur gifs play as mp4 and other gifs show as images (#38).
- Gfycat shut down in 2023. Gfycat links use reddit's own copy of the clip if it has one, and otherwise say so.
- Twitch clips (including `twitch.tv/<channel>/clip/<slug>` links), Streamable and SoundCloud use their current embed URLs. SoundCloud share links (`on.soundcloud.com`) are resolved through SoundCloud's oEmbed service.
- YouTube Shorts and `/live/` links play inline.
- Imgur albums and galleries open in Imgur's own embed. (Upstream's shared Imgur API key was rate limited on every test, so the API and the key are gone.) Newer slug-style links (`imgur.com/gallery/some-title-ID`) are reduced to the ID, which is the only form the embed accepts.
- Wikipedia previews in grid view work, using Wikipedia's page-summary API (they never appeared before). Vimeo thumbnails use Vimeo's oEmbed endpoint.
- Vimeo links from channels, groups and showcases, and unlisted videos (`vimeo.com/<id>/<hash>`), play in list view. Before, everything after `vimeo.com/` was treated as the video ID.
- Comment media links open in the post's media area in the two-column list layout too (#14), and on text posts.
- Embedded players are allowed to autoplay and go fullscreen.

**Settings and fixes**
- Keyboard shortcuts can be turned off (#33, #37). Shortcuts also ignore keys typed into text fields, editable areas and video players.
- Custom accent color: pick any color in Theme Settings (#36). Spots that used to stay orange (settings links, the theme picker, the subreddit bar, album thumbnails, grid flair) follow the accent color too.
- Font choice: Open Sans (default), the system font, Verdana or Georgia (#9).
- Posts added after the page loads, by SHINE, RES, uAutoPagerize or anything else, get the same treatment as the first page (#19).
- Open Sans is bundled, so pages no longer request fonts from Google.
- Per-subreddit and per-multireddit grid/list defaults now match on any reddit hostname. Before, defaults were saved as `www.reddit.com/...` and never matched on old.reddit.com.
- Search uses the current site instead of always going to www.reddit.com.

**Security**
- Post and comment link URLs are percent-encoded before they go into HTML attributes or CSS.
- Media players, images and grid cards are built as elements with their values set through jQuery's `attr()` and `css()`, not pasted into HTML strings, so a quote or bracket in a link can't add markup.
- Imgur captions are inserted as text, not HTML.
- Upgrading jQuery removes the old behavior of running cross-domain script responses automatically.
- No third-party scripts run on reddit pages: the Wikipedia and Vimeo lookups used JSONP (a script from those sites injected into the page) and now use plain JSON requests.
- Upstream's Imgur API key was also being sent to Vimeo and Wikipedia with every request; it's removed entirely.
- Pages fetched for infinite scrolling and grid text previews are parsed in a detached document, so their images and scripts never load.

## Install (unpacked)

There's no store listing. Load it as an unpacked extension.

**Chrome or Edge**
1. Download or clone this repository.
2. Go to `chrome://extensions` (or `edge://extensions`) and turn on **Developer mode**.
3. Click **Load unpacked** and select the repository folder.
4. Open https://old.reddit.com/.

**Firefox (128 or newer, untested)**
1. Build the Firefox version (needs [Node.js](https://nodejs.org/) 18 or newer, no packages): `node tools/build-firefox.mjs`. It writes `dist/firefox/`.
2. Go to `about:debugging#/runtime/this-firefox` and click **Load Temporary Add-on…**, then pick `dist/firefox/manifest.json`.
3. Firefox treats host permissions as optional in Manifest V3. Open the extension's details and allow access to reddit.com.

The build copies the extension and swaps the service worker for a background script, which is what Firefox runs. Run it again after pulling changes.

Unpacked extensions don't update themselves. Pull the latest changes and click **Reload** on the extensions page.

## Notes

- After changing the redirect rules (`rules/`), use the **Reload** button on the extensions page. Turning the extension off and on again doesn't reload them.

- SHINE only works on the old design. With the redirect turned off, www.reddit.com usually serves the redesign, and SHINE stays out of the way there.
- Some reddit features need you to be signed in, and reddit may send signed-out visitors to old.reddit.com to a login page.
- Works alongside Reddit Enhancement Suite (RES), as upstream did.

## Remaining work

See [TODO.md](TODO.md) for what's untested and the upstream issues that are still open.

## License

Upstream doesn't include a license file. This fork keeps the original authors' credits below and doesn't add a license of its own.

Bundled third-party libraries and fonts keep their own licenses; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Authors

* **TheTyGoss** - *original author*
* **vhs** - *upstream maintainer* ([dotvhs/shine-unofficial](https://github.com/dotvhs/shine-unofficial))
* 2.0 modernization in this fork
