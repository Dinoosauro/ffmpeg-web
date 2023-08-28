# ffmpeg-web
A Web UI for ffmpeg-wasm: convert video, audio and images using the power of ffmpeg, directly from your browser

Try it: https://ffmpeg-web.netlify.app/ 

[![Netlify Status](https://api.netlify.com/api/v1/badges/54deaa95-e730-4007-8037-0d878109e6da/deploy-status)](https://app.netlify.com/sites/ffmpeg-web/deploys)


[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/Dinoosauro/ffmpeg-web)
## What you can do:
### Convert video and audio
You can convert video and audio files with lots of encoders. You can convert thanks to this tool basically every:
- Video content to: H264 (MP4), H265 (MP4), VP9 (WebM), VP8* (WebM), Theora* (OGG), Windows Media Video* (WMW)
- Audio content to: MP3, AAC (M4A), Vorbis (OGG), Opus (OGG), FLAC, ALAC, WAV, Windows Media Audio* (WMA)

Note: * You need to enable "Show less common codec" in Settings
#### Merge video and audio file
You can merge video and audio files by selecting the "Copy video" and "Copy audio" tag while encoding a media file. This will permit you to merge the video files (see "Selecting a file" for important notice)
#### Customize media size:
You can change the video/audio bitrate, and other essential settings of that media file (like FPS, orientation, channels etc.) directly from the interface.
#### Add filters
You can add both video and audio filters. The most common (I think) ones have a GUI, but you can pass any ffmpeg video filter configuration you want.
### Custom command
Do you have a ffmpeg command that you need to execute? Write that in the "Custom command" section, and ffmpeg-web will execute that.
### Merge media
If you have two or more videos/audios and you want to merge them, use this section. This will avoid re-encoding, so your media will be immediately ready.
### Edit metadata
If you need to quickly edit some metadata, there's a section dedicated to it. Choose from lots of default metadata keys, or create your own. Add the value and then click to "Add value". Select the files and, without any re-encoding, the metadata will be edited.
### Convert images
Just like videos and audios, ffmpeg-web can also convert images to lots of formats. You can also add some filters, the same as video's ones.
### Extract album art
ffmpeg-web can easily extract album arts. Just choose the "Extract album art" option and select the audio files.
## File selection
At the top right of the page, you can see a "File selection" tab. Before doing that, make sure you've set everything you want correctly. Then, if you are converting your media, you should look at all the ways you can manage multiple files by clicking on the select below the title:
- You can keep only the first file in the script
- Add all of the files in the output one (```ffmpeg -i file1 -i file2 ... output```)
- Keep the files that have the same name
  * You can choose if keeping only the files that have the same name as the first file or do the script for each combination of equal names
- Execute the same command for each selected file
## Trim content
ffmpeg-web permits you to trim content in lots of cases. You can choose to trim a video:
- Providing the start and the end of the new video
- Writing a lists of timestamps with a divider (ex: useful if you need to trim video by chapters)
## Settings
You can change some settings in ffmpeg-web:
- Show less popular encoders 
- Save the output files in a ZIP file (you'll be able to download it by pressing the "Download zip" button at the end of the page)
- Create and change themes
- Change the length of alerts
- See the open source licenses
## Privacy
Every video is elaborated locally, and nothing is sent to a server. ffmpeg-web connects to:
- Google Fonts: fetch fonts (no other data sent)
- JSDelivr & unpkg: fetch essential scripts that make ffmpeg-web work
- Netlify: hosting

Note that, if you are using Microsoft Edge, you should disable "Enhance security from this website" from the HTTPS secure symbol in the status bar. In this way, ffmpeg will encode the media faster than before.
After you've chosen the files, the conversion will start automatically. You'll be able to see the progress at the end of the page
## Offline use 
You can install ffmpeg-web as a Progressive Web App to use it offline.
