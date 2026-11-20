# TODO

Status as of 2.0.1 (November 2026).

## Tested (Edge 157, signed in, old.reddit.com)

- [x] Extension loads (Manifest V3)
- [x] SHINE starts on old.reddit.com; list and grid view scripts and shortcuts load in order
- [x] List view: reddit video plays with sound (hls.js; Edge's native HLS fails)
- [x] List view: reddit gallery opens as an album; comments load beside the media
- [x] Grid view: cards for images, reddit video, galleries, text posts and Imgur albums; sharper video posters load as cards come into view
- [x] Grid view: the overlay plays reddit video and shows galleries (thumbnail switching works)
- [x] Video that the browser won't autoplay with sound starts muted instead of staying paused
- [x] Embeds render: Twitch clips, Streamable, YouTube, SoundCloud (including `on.soundcloud.com` share links)
- [x] Imgur: images, `.gifv` as video, albums through Imgur's embed (including the newer slug-style links)
- [x] Gifs show as animated images, not black boxes
- [x] Gfycat links show the "shut down" message when reddit has no copy
- [x] Redirect: www → old works; `/media` and `/settings` stay on www; turning the setting off stops redirects
- [x] Keyboard shortcuts: off stops the arrow keys; on works; keys typed in text boxes are ignored
- [x] Two-column list: comment media links open in the post's media area (#14), including on text posts
- [x] YouTube ID parsing for Shorts, `/live/`, `m.`, `youtu.be` and `youtube-nocookie` links (offline check)

## Still to test

- [ ] With a real mouse click: comment media links in two-column mode don't also open a new tab (the scripted test confirmed `preventDefault` is called, but scripted events can't show the result)
- [ ] Share links (`/r/<sub>/s/<id>`) stay on www with the redirect on
- [ ] Twitch and Streamable cards in grid view
- [ ] Never-ending reddit (RES) and SHINE's own infinite loading with the new preview code
- [ ] Old design served on www.reddit.com (old-reddit preference with the redirect off), which goes through `shine-detect.js`
- [ ] Settings rows (Keyboard Shortcuts, Redirect to Old Reddit): layout in each theme
- [ ] Firefox 128+: loading, host permission prompt, `moz-extension://` icon font, `scripting.executeScript` in the MAIN world
- [ ] Chrome (stable)

## Open upstream issues not addressed yet

- [ ] #36 custom accent color (hex input)
- [ ] #9 font choice
- [ ] #10 icons sit slightly low in list view (needs a visual check)
- [ ] #24 /user/ pages aren't styled to match the theme
- [ ] #30 conflicts with Moderator Toolbox search on profile pages
- [ ] #19 blank expando on pages added by uAutoPagerize

## Cleanup and hardening

- [ ] Optional setting for your own Imgur Client ID (the shared one was rate limited on every album tested, so albums always use the embed)
- [ ] Much of the list/grid HTML is still built by string concatenation. URLs are sanitized where they enter, but titles and other values should move to `.text()` and `.attr()`
- [ ] `fonts.css` loads Open Sans from Google Fonts; consider bundling it
- [ ] Edge lists "'background.scripts' requires manifest version of 2 or lower" on the extensions page. It's harmless (the key is there for Firefox); a separate Firefox manifest would remove it
- [ ] Lint/format pass; the files mix tabs, spaces and CRLF/LF line endings
