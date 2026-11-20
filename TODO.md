# TODO

Status as of 2.0.2 (November 2026).

## Tested (Edge 157, signed in, old.reddit.com)

- [x] Extension loads (Manifest V3)
- [x] SHINE starts on old.reddit.com; list and grid view scripts and shortcuts load in order
- [x] List view: reddit video plays with sound (hls.js; Edge's native HLS fails)
- [x] List view: reddit gallery opens as an album; comments load beside the media
- [x] Grid view: cards for images, reddit video, galleries, text posts and Imgur albums; sharper video posters load as cards come into view
- [x] Grid view: the overlay plays reddit video and shows galleries (thumbnail switching works)
- [x] Grid view: Wikipedia lead images (77 of 100 posts) and Vimeo thumbnails, with no third-party scripts on the page
- [x] Video that the browser won't autoplay with sound starts muted instead of staying paused
- [x] Embeds render: Twitch clips, Streamable, YouTube, SoundCloud (including `on.soundcloud.com` share links)
- [x] Imgur: images, `.gifv` as video, albums and galleries straight to Imgur's embed (no API calls)
- [x] Gifs show as animated images, not black boxes
- [x] Gfycat links show the "shut down" message when reddit has no copy
- [x] Redirect: www → old works; `/media` and `/settings` stay on www; turning the setting off stops redirects
- [x] Keyboard shortcuts: off stops the arrow keys; on works; keys typed in text boxes are ignored
- [x] Two-column list: comment media links open in the post's media area (#14), including on text posts
- [x] Posts added after load (#19): a simulated uAutoPagerize insert (100 posts beside the listing) gets moved into the listing, prepared, numbered from 101, and expands with media and comments
- [x] SHINE's own infinite scroll (list view) with off-page parsing: 100 more posts, prepared and numbered
- [x] Font choice (#9): all four fonts apply; code stays monospace
- [x] Custom accent color (#36): picker, swatch, saved color, accent and darker shade applied
- [x] Settings panels: new rows (Keyboard Shortcuts, Redirect, Custom Color, Font) lay out with the existing controls
- [x] Bundled Open Sans loads; no requests to Google Fonts
- [x] #10 icon alignment: no longer reproduces (glyphs centered in both the card and flat layouts, Pure Black + Linear icons)
- [x] #24 profile pages: follow the selected theme (checked with Pure Black)
- [x] YouTube ID parsing for Shorts, `/live/`, `m.`, `youtu.be` and `youtube-nocookie` links (offline check)

## Still to test

- [ ] With a real mouse click: comment media links in two-column mode don't also open a new tab (the scripted test confirmed `preventDefault` is called, but scripted events can't show the result)
- [ ] Share links (`/r/<sub>/s/<id>`) stay on www with the redirect on
- [ ] Twitch and Streamable cards in grid view
- [ ] Infinite scroll in grid view, and with RES's never-ending reddit
- [ ] Old design served on www.reddit.com (old-reddit preference with the redirect off), which goes through `shine-detect.js`
- [ ] Settings rows in dark themes
- [ ] Firefox 128+: loading, host permission prompt, `moz-extension://` fonts (icon font and Open Sans), `scripting.executeScript` in the MAIN world
- [ ] Chrome (stable)

## Open upstream issues

- [ ] #30 conflicts with Moderator Toolbox search on profile pages (needs Toolbox installed to reproduce)
- [ ] #24 polish: profile pages use the theme but keep reddit's plain layout (no list/grid cards, since they mix comments and posts)

## Cleanup and hardening

- [ ] A few spots hard-code SHINE's original orange (`rgb(255,103,0)`: settings-panel links, the Legacy White theme picker border, front-page flair in grid view), so they stay orange under every accent color
- [ ] Much of the list/grid HTML is still built by string concatenation. URLs are sanitized where they enter, and the riskier spots (third-party HTML, remote scripts) are fixed, but titles and other values could move to `.text()` and `.attr()`
- [ ] List view's Vimeo embed uses everything after `vimeo.com/` as the ID, so `vimeo.com/channels/<name>/<id>` links don't play (grid view resolves these through oEmbed)
- [ ] Edge lists "'background.scripts' requires manifest version of 2 or lower" on the extensions page. It's harmless (the key is there for Firefox); a separate Firefox manifest would remove it
- [ ] Lint/format pass; the files mix tabs, spaces and CRLF/LF line endings
