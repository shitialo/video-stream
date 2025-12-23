# MP4 faststart Guide

## What is faststart?

MP4 files contain a "moov" atom with metadata (duration, codec info, index). 

**Without faststart**: The moov atom is at the END of the file. The browser must download the entire file before playback can begin.

**With faststart**: The moov atom is at the BEGINNING. Playback can start immediately.

## Checking Your Videos

```bash
# Check a single file
node scripts/check-faststart.js video.mp4

# Check all MP4s in a directory
node scripts/check-faststart.js ./videos

# Check and automatically fix
node scripts/check-faststart.js ./videos --fix
```

## Manually Fixing with ffmpeg

If you prefer to fix files manually:

```bash
# Single file
ffmpeg -i input.mp4 -c copy -movflags +faststart output.mp4

# Batch process directory (bash)
for f in *.mp4; do
  ffmpeg -i "$f" -c copy -movflags +faststart "faststart_$f"
done

# PowerShell
Get-ChildItem *.mp4 | ForEach-Object {
  ffmpeg -i $_.Name -c copy -movflags +faststart "faststart_$($_.Name)"
}
```

> **Note**: `-c copy` means no re-encoding. This is a remux operation that only takes a few seconds per file.

## Always Create with faststart

When encoding new videos, always add `-movflags +faststart`:

```bash
ffmpeg -i input.mkv -c:v libx264 -c:a aac -movflags +faststart output.mp4
```

## How to Tell if It's Working

After fixing, your videos should:
- Start playing almost instantly (no long initial buffer)
- Show the duration immediately (not "0:00" while loading)
- Allow seeking before the full download completes
