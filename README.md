# CaDGe - *.CDG file Parser and Lyric Extractor*

*CD+Graphics* (CD+G) is an extension to audio CDs that adds a low resolution graphical layer, with the information embedded in otherwise unused bits of the data stream.  This has typically been used for Karaoke music to embed the lyrics as a low-resolution image of the rendered text.

This project contains a library that to decode the data stream (separated from the music into .CDG files) into images over time.  

The aim is to provide additional layers that to try to understand when lines of lyrics are added, any progress given, and to recognize the text of the lyrics and extract them to other, [timed text](https://en.wikipedia.org/wiki/Timed_text), formats.


## Lyric Analysis

Rough design for lyric analysis:

* [x] Track last clear index as the background index.

* [x] On clear and palette change, flag colour indices as "background" colour (luminance similarity to the last cleared index), and determine which indices are equivalent to one another (almost identical colours).

* [ ] On row changes (tile writes and clear):
  * Record the total number of foreground pixels, and the min and max of any foreground pixels.
  * Count the number of pixel changes: "del": foreground to background, "add": background to foreground, "change": foreground to another (non-equivalent) foreground colour. For each category, remember the minimum and maximum X value for the change.

* [ ] Calculate current row groups:
  * Each row with non-zero foreground pixels is a group.
  * Dilate (e.g. 1-3 pixels) either side to expand the rows
  * Adjacent rows are part of the same group
  * Find overlapping groups from the previous frame and assign as the same.
  * Previous groups that no longer exist, or now have more than one matching current group (split) are treated as "removed" (and any current groups unmatched) - removing a group puts it into the "removed" state to force a transition out of any current state, before being deleted.
  * Unmatched groups are treated as new, "added" groups

* [ ] Each group tracks its current state with start/end timestamps for each state enter/leave, and horizontal positions for when the state changed, and the time of the last relevant operation for that state: "writing" for any "add" operations, "erasing" for any "del" operations, "progress" for any "change" operations. To help lyric analysis: each group's min/max rows are recorded, and the total number of clear operations performed before the group was created.

* [ ] On group exit from "writing" state, the rows are captured in monochrome as background/non-background, and the min/max foreground X positions calculated. If the minimum width/height is too small, or (optionally) if the span does not cover the centre line, the group is ignored. OCR is performed on the text, and the horizontal start/end of each word is recorded.

* [ ] On entering, updates to, and exit from, the "progress" state: the horizontal progress is increased monotonically and timestamps tracked between each word (exiting gives a timestamp for the final word).

* [ ] On stream end, any existing groups are "removed", and lyric analysis can be performed.
  * Detect initial lead-in/progress markers (e.g. '>'/'»' or similar to '|||||') and mark as a progress element.
  * Possibly: detect instructions (e.g. in parentheses, or initial "M:"/"F:"/"D:") and treat appropriately.
  * Lyrics are analysed to decide which rows could be merged (previous line recent, placed above, and no ending punctuation; and current line doesn't begin with a capital letter), or split (at ending punctuation).

* [ ] Lyrics output to e.g. an .LRC file.



## Misc. Notes

* .CDG files:
  * https://en.wikipedia.org/wiki/CD%2BG
  * https://goughlui.com/2019/03/31/tech-flashback-the-cdgraphics-format-cdg/
  * https://jbum.com/cdg_revealed.html
  * https://www.cdgfix.com/help/3.x/Technical_information/The_CDG_graphics_format.htm

* Timed text formats: https://en.wikipedia.org/wiki/Timed_text
  * .LRC: 
    * https://en.wikipedia.org/wiki/LRC_(file_format)
    * https://github.com/tranxuanthang/lrcget
  * .SRT:
    * https://en.wikipedia.org/wiki/SubRip#Format
  * WebVTT
    * https://en.wikipedia.org/wiki/WebVTT

* CD+EG Extended Graphics, from: https://extended.graphics/#tech
  * Adds an extra video buffer, doubling the video memory
  * This can be used for full 8 bit (256 color) graphics, or the two buffers can be used for independent 4 bit (16 color) images. 
  * When used independently, one buffer can written while the other is displaying, then they can be instantly switched. 
  * There is also a mode that allows the two buffers to be blended together, this can produce a dissolve effect, or one layer can be scrolled on a stationary background.
  * "Line graphics mode"?


<!--

Tesseract installation:
  * https://github.com/tesseract-ocr/tessdoc/blob/main/Installation.md
  * Windows: "%LOCALAPPDATA%\Programs\Tesseract-OCR\tesseract.exe"

```cmd
@rem --psm single_line
type test.bmp | "%LOCALAPPDATA%\Programs\Tesseract-OCR\tesseract.exe" %* - - quiet hocr > test.txt
type test.txt
```

Test:

```
node src/main.mjs --term --rate 5 _local/data/test.cdg
node src/main.mjs --analyseDump --analyseAfter 12 --analyseBefore -13.5 _local/data/test.cdg
node src/main.mjs --analyseDump _local/data/test.cdg --verbose --maxDuration 2.2
```

-->
