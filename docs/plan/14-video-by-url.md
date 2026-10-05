# 14: Videos by YouTube link, auto-filled (D7, V3 §9)

Read `00-overview.md` and V3 §9.

The video library already exists (`video_page`, `/admin/content/videos/**`, `/videos/**`). This task changes how a video is entered.

The new flow:
1. Leonard pastes a YouTube link.
2. The server auto-fills everything except the transcript.
3. Leonard drops in the captions file.
4. Leonard publishes.

**No OAuth, no uploads through the API.** One API key only.

**Verify first:** check the current `videos.list` docs (https://developers.google.com/youtube/v3/docs/videos/list). With env `YOUTUBE_API_KEY`, call it on one real **unlisted** video ID and confirm the item is returned. If it isn't, use the oEmbed fallback in §2 as the primary path and report it.

## 1. Parse the link: `src/lib/content/youtube.ts`
- `parseYouTubeId(input)` → an 11-character `[A-Za-z0-9_-]` ID, or null. It accepts:
  - `watch?v=`
  - `youtu.be/`
  - `/shorts/`
  - `/embed/`
  - `youtube-nocookie.com/embed/`
  - a bare ID
- The editor field label becomes "YouTube link". Store only the ID in `youtube_id`.

## 2. Fetch metadata (server only): `src/lib/server/content/youtubeMeta.ts`
- `fetchYouTubeMeta(id)` → `{ title, description, durationSeconds, uploadedOn, thumbnailUrl, privacyStatus } | null`.
- Primary call: `GET https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,status&id={id}&key={YOUTUBE_API_KEY}`.
  - `durationSeconds` comes from the ISO 8601 `contentDetails.duration` via `parseIsoDuration` (for example `PT1H2M3S` → 3723).
  - `uploadedOn` = `snippet.publishedAt` (date part).
  - `thumbnailUrl`: the best of `maxres`, `standard`, `high`.
  - `privacyStatus` comes from `status`.
- Fallback when the key is missing, the call fails, or there are no items: `GET https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={id}&format=json`.
  - That returns the title and thumbnail only.
  - `durationSeconds` is null; `uploadedOn` is null, so the first publish date is used.
- 4-second timeout. Nothing in here ever runs in the visitor's browser.
- Add `YOUTUBE_API_KEY` to `.env.example`.

## 3. Wire the editor
- On save, when `youtube_id` is new or changed, call `fetchYouTubeMeta`.
  - Fill **empty** fields only: title, description, duration, upload date. Never overwrite Leonard's edits.
  - Add a "Refresh from YouTube" button that overwrites them deliberately.
- Thumbnail: if it was not uploaded by hand, download `thumbnailUrl` on the server and upload it to UploadThing (`UTApi`). Create a `media_asset` with alt text = the title (editable) and its width and height, and link it. Visitors never request `ytimg.com`.
- Show `privacyStatus` in the editor:
  - `private` → **block publish** with: "This video is private on YouTube and will not play. Set it to Unlisted or Public in YouTube Studio."
  - `unlisted` → a non-blocking note: "Unlisted on YouTube — set it to Public in YouTube Studio when you're ready."
- Remove the manual duration input. The `duration_seconds` column stays (nullable).
- `VideoObject` JSON-LD:
  - Always: `name`, `thumbnailUrl` (our copy), `uploadDate` (`uploaded_on`, else `published_at`), `embedUrl` (`youtube-nocookie`).
  - `duration` only when it is known.

## 4. Transcript from a captions file
- The transcript stays required to publish (V3 9.2).
- Add a file drop zone and an "Upload captions (.srt or .vtt)" control next to the transcript textarea.
  - `captionsToText(fileText)` in `src/lib/content/captions.ts` strips the `WEBVTT` header, cue numbers, timestamps, `<…>` tags and duplicated consecutive lines, then joins the cues into paragraphs.
  - The result fills the textarea, and Leonard can still edit it.
- Helper text: "Download from YouTube Studio → Subtitles → ⋮ → Download (.srt or .vtt)."

## 5. Publishing
- Publish and Unpublish affect only our page, sitemap and schema. Nothing calls YouTube to change anything.
- Keep the testimonial `release_on_file` gate (V3 9.5).
- Confirm the facade uses our thumbnail plus `youtube-nocookie.com/embed/{id}`, loaded only on click. Fix it if not.

## 6. Hand-off doc: `docs/video-handoff.md`
A 10-line internal how-to:
- Leonard adds each editor in YouTube Studio → Settings → Permissions, with the role **Editor**.
- The editor uploads as **Unlisted** and sends the link.
- Leonard pastes the link, drops in the captions file, publishes on the site, then sets the video to Public in YouTube Studio.

## Done when
- Pasting a link fills the title, description, duration, date and thumbnail.
- A captions file fills the transcript.
- A private video can't be published.
- The page plays through the click-to-load facade.
