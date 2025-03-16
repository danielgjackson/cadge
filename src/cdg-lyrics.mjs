// .CDG Lyrics
// Dan Jackson, 2025

import fs from 'fs';

const defaultOptions = {
    lyricsDump: false,
}

export class CdgLyrics {

    constructor(analyzer, options = {}, filename = null) {
        this.analyzer = analyzer;
        this.options = Object.assign(defaultOptions, options);
        this.filename = filename;

        this.activeLines = {};
        this.lines = [];
        this.lastTime = null;
    }
    
    step(analyzerResult) {
        const lyricsResult = {};

        if (analyzerResult.stepResult.parseResult) {
            const time = analyzerResult.stepResult.parseResult.time;
            this.lastTime = time;

            // group-add(.start) group-del group-chg(.start) group-state(.state='writing'|'progress'|'erasing') group-text(.srcRect, .ocrResult) group-progress(.position)
            for (const change of analyzerResult.changes) {
                //if (this.options.lyricsDump) console.log(JSON.stringify(change));

                let updateTimingPosition = null;
                if (change.action == 'group-add') {
                    if (this.options.lyricsDump) console.log('LYRIC-LINE: @' + time.toFixed(3) + ' ADD #' + change.groupId + ' line:' + change.start);
                    const newLine = {
                        id: change.groupId,
                        line: change.start,
                        state: null,
                        timeAdded: time,
                        timeWriting: null,
                        timeProgress: null,
                        timeErasing: null,
                        timeDeleted: null,
                        words: null,
                        timings: null,
                        position: null,     // progress
                    };
                    this.lines.push(newLine);
                    this.activeLines[change.groupId] = newLine;

                } else if (change.action == 'group-del') {
                    if (this.options.lyricsDump) console.log('LYRIC-LINE: @' + time.toFixed(3) + ' DEL #' + change.groupId);
                    updateTimingPosition = -1;      // CdgParser.CDG_WIDTH

                } else if (change.action == 'group-chg') {
                    if (this.options.lyricsDump) console.log('LYRIC-LINE: @' + time.toFixed(3) + ' CHG #' + change.groupId + ' line:' + change.start);
                    this.activeLines[change.groupId].line = change.start;

                } else if (change.action == 'group-state') {
                    if (this.options.lyricsDump) console.log('LYRIC-LINE: @' + time.toFixed(3) + ' STA #' + change.groupId + ' state:' + change.state);
                    if (this.activeLines[change.groupId].state != 'writing' && change.state == 'writing') {
                        this.activeLines[change.groupId].timeWriting = time;
                    } else if (this.activeLines[change.groupId].state != 'progress' && change.state == 'progress') {
                        this.activeLines[change.groupId].timeProgress = time;
                    } else if (this.activeLines[change.groupId].state != 'erasing' && change.state == 'erasing') {
                        this.activeLines[change.groupId].timeErasing = time;
                        updateTimingPosition = -1;      // CdgParser.CDG_WIDTH
                    }
                    this.activeLines[change.groupId].state = change.state;

                } else if (change.action == 'group-text') {
                    if (this.options.lyricsDump) console.log('LYRIC-LINE: @' + time.toFixed(3) + ' TXT #' + change.groupId + ' text: ' + change.ocrResult.allText);
                    //if (this.options.lyricsDump) console.log(JSON.stringify(change.ocrResult));
                    const newWords = change.ocrResult.words.map(word => {
                        return {
                            text: word.rawValue,
                            left: word.boundingBox.x,
                            right: word.boundingBox.x + word.boundingBox.width,
                            confidence: word._confidence,
                        };
                    });
                    newWords.sort((a, b) => a.left - b.left);
                    if (this.options.lyricsDump) console.log(JSON.stringify(newWords));
                    this.activeLines[change.groupId].words = newWords;
                    this.activeLines[change.groupId].startTimings = [];
                    this.activeLines[change.groupId].endTimings = [];

                } else if (change.action == 'group-progress') {
                    if (this.options.lyricsDump) console.log('LYRIC-LINE: @' + time.toFixed(3) + ' PRG #' + change.groupId + ' position:' + change.position);
                    updateTimingPosition = change.position;
                } else if (change.action == 'clear') {
                    if (this.options.lyricsDump) console.log('LYRIC-CLEAR: @' + time.toFixed(3));
                } else if (change.action == 'screen-type') {
                    if (this.options.lyricsDump) console.log('LYRIC-SCREEN-TYPE: @' + time.toFixed(3) + ' data:' + change.data);
                } else if (change.action == 'warning') {
                    if (this.options.lyricsDump) console.log('LYRIC-LINE: @' + time.toFixed(3) + ' WARNING #' + change.groupId + ' description:' + change.description);
                } else {
                    if (this.options.lyricsDump) console.log('WARNING: Unhandled action: ' + JSON.stringify(change));
                    console.error('ERROR: Unhandled action: ' + JSON.stringify(change));
                }

                // Common handling of updated progress
                if (updateTimingPosition != null) {
                    if (this.activeLines[change.groupId].words) {
                        // Word starts - check left boundary
                        for (let i = this.activeLines[change.groupId].startTimings.length; i < this.activeLines[change.groupId].words.length; i++) {
                            const word = this.activeLines[change.groupId].words[i];
                            // The word has not started, do not add timestamp yet
                            if (updateTimingPosition < word.left - 1) {
                                break;
                            }
                            // The word has started, add timestamp
                            this.activeLines[change.groupId].startTimings.push(time);
                        }
                        // Word ends - check right boundary
                        for (let i = this.activeLines[change.groupId].endTimings.length; i < this.activeLines[change.groupId].words.length; i++) {
                            const word = this.activeLines[change.groupId].words[i];
                            // The word has not ended, do not add timestamp yet
                            if (updateTimingPosition < word.right - 1) {
                                break;
                            }
                            // The word has ended, add timestamp
                            this.activeLines[change.groupId].endTimings.push(time);
                        }
                        this.activeLines[change.groupId].position = change.position;
                    }
                }

                // Handle deletion last
                if (change.action == 'group-del') {
                    this.activeLines[change.groupId].timeDeleted = time;
                    delete this.activeLines[change.groupId];
                }
                

            }
        } else {
            // End of stream
            if (this.activeLines.length > 0) {
                if (this.options.lyricsDump) console.log('WARNING: Unexpected remaining active lines: ' + this.activeLines.length);
                console.error('ERROR: Unexpected remaining active lines: ' + this.activeLines.length);
            }
        }

        return lyricsResult;
    }

    static createMetadata(filename, options) {
        const metadata = {};
        if (filename) {
            let title = filename.trim();
            title = title.replace(/^[A-Z]{2,5}\d{3,5} - /, '');  // Remove initial track ID
            title = title.replaceAll(/- \d+ -/g, '-');           // Remove track number between artist and title
            let artist = null;
            const titleParts = title.split(' - ');
            if (titleParts.length > 1) {
                artist = titleParts.shift().trim();
                title = titleParts.join(' - ');
            }
            //metadata['#', 'filename:' + filename);
            if (artist != null) { 
                metadata['ar'] = artist;
            }
            metadata['ti'] = title;
        }
        metadata['re'] = 'cadge';
        if (options.lyricsVersion) {
            metadata['ve'] = options.lyricsVersion.toString();
        }
        return metadata;
    }

    static readMetadata(filename) {
        // Read all lines
        const lines = fs.readFileSync(filename, 'utf8').split('\n');
        const metadata = {};
        for (const line of lines) {
            const parts = line.trim().match(/^\[(\w+):(.*)\]$/);
            if (parts && isNaN(parts[1])) {
                metadata[parts[1]] = parts[2];
            }
        }
        return metadata;
    }

    static compareMetadata(existing, proposed) {
        let renew = false;
        if (existing.ar != proposed.ar) { renew = true; }   // Artist changed
        if (existing.ti != proposed.ti) { renew = true; }   // Title changed
        if (existing.re != proposed.re) { renew = true; }   // Software changed
        if (parseFloat(existing.ve) < parseFloat(proposed.ve) || !existing.ve && proposed.ve) { renew = true; }    // Newer version
        // console.log('EXISTING: ' + JSON.stringify(existing));
        // console.log('PROPOSED: ' + JSON.stringify(proposed));
        // console.log('==> ' + renew);
        return renew;
    }

    createLrc(options) {
        const lines = [];
        options = Object.assign({
            wordStarts: true,   // false=none, true=all, 1=first only
            wordEnds: true,     // false=none, true=all, 1=last only
            lyricsVersion: null,
        }, options);
        /*
            ti 	Title of the song
            ar 	Artist performing the song
            al 	Album the song is from
            au 	Author of the song
            lr 	Lyricist of the song
            length 	Length of the song (mm:ss)
            by 	Author of the LRC file (not the song)
            offset 	Specifies a global offset value for the lyric times, in milliseconds. The value is prefixed with either + or -, with + causing lyrics to appear sooner
            re/tool 	The player or editor that created the LRC file
            ve 	The version of the program
            # 	Comments 
        */
        // [COLOUR]0xFF66FF

        const formatTime = (time) => { // "mm:ss.xx"
            return (Math.sign(time) < 0 ? '-' : '') + Math.floor(Math.abs(time) / 60).toString().padStart(2, '0') + ':' + (Math.abs(time) - (Math.floor(Math.abs(time) / 60) * 60)).toFixed(2).padStart(5, '0');
        }

        const metadata = CdgLyrics.createMetadata(this.filename, options);
        if (metadata.ar) { lines.push('[ar:' + metadata.ar + ']') }
        if (metadata.ti) { lines.push('[ti:' + metadata.ti + ']') }
        if (metadata['#']) { lines.push('[#:' + metadata['#'] + ']') }
        lines.push('[length:' + (Math.floor(Math.round(this.lastTime) / 60)) + ':' + (Math.round(this.lastTime) % 60).toString().padStart(2, '0') + ']')
        if (metadata.re) { lines.push('[re:' + metadata.re + ']') }
        if (metadata.ve) { lines.push('[ve:' + metadata.ve + ']') }
        lines.push('')
        for (const line of this.lines) {
            const lineParts = [];
            if (line.words && line.words.length > 0) {
                for (let i = 0; i < line.words.length; i++) {
                    // Word start time
                    if (options.wordStarts === true || (options.wordStarts === 1 && i == 0)) {
                        if (i < line.startTimings.length) {
                            lineParts.push('<' + formatTime(line.startTimings[i]) + '>');
                        }
                    }
                    // Word text
                    if (i < line.words.length) {
                        lineParts.push(line.words[i].text);
                    }
                    // Word end time
                    if (options.wordEnds === true || (options.wordEnds === 1 && i >= line.words.length - 1)) {
                        if (i < line.endTimings.length) {
                            lineParts.push('<' + formatTime(line.endTimings[i]) + '>');
                        }
                    }
                }
                const lineText = lineParts.join(' ');
                lines.push('[' + formatTime(line.timeProgress) + '] ' + lineText);
            }
        }
        return lines.join('\n');
    }

}