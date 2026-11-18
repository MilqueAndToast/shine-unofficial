# TODO

Status as of 2.0.0 (November 2026).

## Tested so far (Edge 157, signed in, old.reddit.com)

- [x] Extension loads (Manifest V3, no errors)
- [x] SHINE starts on old.reddit.com; list and grid view scripts and shortcuts load in order
- [x] List view: reddit video expands and plays with sound (hls.js; Edge's native HLS fails)
- [x] List view: reddit gallery expands as an album (10 thumbnails, full-size images)
- [x] List view: comments load beside the media
- [x] Grid view: image cards render (100/100 on r/EarthPorn)

## Still to test

- [ ] Grid view: reddit video and gallery cards (`preview-reddit`), the overlay player and album, and the sharper-poster upgrade as you scroll
- [ ] Twitch clip, Streamable, SoundCloud, YouTube Shorts/live and Vimeo embeds (list and grid)
- [ ] Imgur: single images, gifs (mp4 path), albums, and the embed fallback when the API returns 429
- [ ] Gfycat/redgifs links: reddit's copy is used, and the "shut down" message shows when there's none
- [ ] Redirect: www → old works; `/media`, `/s/` share links and settings are left alone; the setting turns it off
- [ ] New settings rows (Keyboard Shortcuts, Redirect to Old Reddit): layout in each theme, and that they save
- [ ] Keyboard shortcuts off: arrows, Shift and album keys stop; Esc still closes
- [ ] Comment-page navigation (left/right arrows, prev/next buttons)
- [ ] Never-ending reddit (RES) and SHINE's own infinite loading with the new preview code
- [ ] Old design served on www.reddit.com (old-reddit preference with the redirect off), which goes through `shine-detect.js`
- [ ] Firefox 128+: loading, host permission prompt, `moz-extension://` icon font, `scripting.executeScript` in the MAIN world
- [ ] Chrome (stable)

## Open upstream issues not addressed yet

- [ ] #36 custom accent color (hex input)
- [ ] #9 font choice
- [ ] #10 icons sit slightly low in list view (needs a visual check)
- [ ] #24 /user/ pages aren't styled to match the theme
- [ ] #30 conflicts with Moderator Toolbox search on profile pages
- [ ] #19 blank expando on pages added by uAutoPagerize
- [ ] #14 clicking an image link in a comment (two-column list) opens a new tab instead of the expando

## Cleanup and hardening

- [ ] Remove the remaining unreachable Gfycat code (grid `createPreviews` branch, `preview-gfycat` and `comment-gfycat` handlers, `replaceExpand("gfycat")`)
- [ ] Optional setting for your own Imgur Client ID (the shared one is often rate limited)
- [ ] Much of the list/grid HTML is still built by string concatenation. URLs are sanitized where they enter, but titles and other values should move to `.text()` and `.attr()`
- [ ] `fonts.css` loads Open Sans from Google Fonts; consider bundling it
- [ ] Version-update banner and changelog: check it reads well for 2.0.0
- [ ] Lint/format pass; the files mix tabs, spaces and CRLF line endings
