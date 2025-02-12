# CaDGe - *.CDG file Parser and Lyric Extractor*

*CD+Graphics* (CD+G) is an extension to audio CDs that adds a low resolution graphical layer, with the information embedded in otherwise unused bits of the data stream.  This has typically been used for Karaoke music to embed the lyrics as a low-resolution image of the rendered text.

This project contains a library that to decode the data stream (separated from the music into .CDG files) into images over time.  

The aim is to provide additional layers that to try to understand when lines of lyrics are added, any progress given, and to recognize the text of the lyrics and extract them to other, [timed text](https://en.wikipedia.org/wiki/Timed_text), formats.


## Notes

* .CDG files:
  * https://en.wikipedia.org/wiki/CD%2BG
  * https://goughlui.com/2019/03/31/tech-flashback-the-cdgraphics-format-cdg/
  * https://jbum.com/cdg_revealed.html

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

Test:

```
npm start _local/data/test.cdg > test.log
```

-->
