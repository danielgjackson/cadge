// Node.js CLI wrapper for CaDGe

import fs from 'node:fs';
import Path from 'path';
import { CdgParser } from './cdg-parser.mjs';
import { CdgAnalyzer } from './cdg-analyzer.mjs';
import { CdgLyrics } from './cdg-lyrics.mjs';
import { BitmapGenerate } from './bmp.mjs';
import { renderAnsiImage } from './cli-image.mjs';
import { wordCorrections, letterCorrections } from './corrections.mjs';
import { detectSilence } from './detect-silence.mjs';

async function runOnce(inputFile, options) {
    //console.log('Processing: ' + inputFile + ' -- ' + JSON.stringify(options));
    const baseFilename = Path.parse(inputFile).name;    // path.basename(inputFile, '.cdg');

    let lrcFile = null;
    if (options.writeLrc) {
        const pathNoExt = inputFile.replace(/\.cdg$/i, '');
        const testFile = pathNoExt + '.lrc';
        const lrcExists = fs.existsSync(testFile);
        let overwrite = options.overwrite;

        if (lrcExists && !overwrite && options.overwriteOutdated) {
            const proposedMetadata = CdgLyrics.createMetadata(baseFilename, options.lrcOptions);
            const existingMetadata = CdgLyrics.readMetadata(testFile);
            const renew = CdgLyrics.compareMetadata(existingMetadata, proposedMetadata);
            if (renew) {
                overwrite = true;
            }
        }

        if (testFile.toLowerCase() == inputFile.toLowerCase) {
            console.error('ERROR: Cannot overwrite input file, skipping: ' + testFile);
            return 1;
        }

        if (lrcExists && overwrite && !options.overwrite) {
            console.error('NOTE: Overwriting outdated existing file (--overwrite-outdated): ' + testFile);
        }
        if (!overwrite && lrcExists) {
            if (options.overwriteOutdated) {
                console.error('ERROR: Not overwriting existing file that is not outdated (--overwrite-outdated), skipping: ' + testFile);
            } else {
                console.error('ERROR: Cannot overwrite existing file without option --overwrite (or --overwrite-outdated), skipping: ' + testFile);
            }
            return 1;
        }

        lrcFile = testFile;
    }

    const data = fs.readFileSync(inputFile);
    const parser = new CdgParser(data, options.parserOptions);
    const analyzer = new CdgAnalyzer(parser, options.analyzerOptions);
    const lyrics = new CdgLyrics(analyzer, options.lyricsOptions, baseFilename);
   
    // Negative times are relative to the end of the stream
    if (options.analyzeAfter != null && options.analyzeAfter < 0) { options.analyzeAfter += parser.getDuration(); }
    if (options.analyzeBefore != null && options.analyzeBefore < 0) { options.analyzeBefore += parser.getDuration(); }

    const reportInterval = 0;
    //let lastReported = null;
    let changeTrackCli = {};
    const considerPackets = 30;
    const startTime = Date.now();
    while (true) {
        const stepResult = analyzer.step([changeTrackCli]);

        let analyzerResult = null;
        if (options.analyzeAfter == null || (stepResult && stepResult.parseResult && stepResult.parseResult.time >= options.analyzeAfter)) {
            if (options.analyzeBefore == null || (stepResult && stepResult.parseResult && stepResult.parseResult.time < options.analyzeBefore)) {

                // HACK: Turn on verbosity only during analysis
                if (options.analyzeVerbose) {
                    options.parserOptions.verbose = true;
                    parser.options.verbose = options.parserOptions.verbose;
                }

                analyzerResult = await analyzer.applyChanges(stepResult);
            }
        }

        /*
        if (reportInterval && changed && (lastReported === null || Math.floor(time) >= Math.floor(lastReported + reportInterval))) {
            lastReported = Math.floor(time);
            const baseFile = inputFile.replace(/\.cdg$/, '');
            const buffer = parser.imageRender();
            const bmpData = BitmapGenerate(buffer, CdgParser.CDG_WIDTH, CdgParser.CDG_HEIGHT, false);
            // Create output .bmp file name based on inputFile
            const outputFile = baseFile + '-' + lastReported.toString().padStart(4, '0') + '.bmp';
            fs.writeFileSync(outputFile, bmpData);

            if (false && lastReported % 10 == 0) {
                const palette = parser.paletteDump();
                const image = parser.imageDump();
                const dumpFile = baseFile + '-' + lastReported.toString().padStart(4, '0') + '.txt';
                fs.writeFileSync(dumpFile, palette + '\n' + image);
            }
        }
        */

        if (options.term && stepResult.parseResult && (stepResult.parseResult.packetNumber % considerPackets) == 0) {
            if (changeTrackCli.x != null) {
                let buffer;
                if (0) {
                    buffer = analyzer.imageRender(changeTrackCli, { mono: 'alpha', checkerboard: true });
                } else {
                    buffer = parser.imageRender(changeTrackCli);
                }
                const text = renderAnsiImage(buffer, CdgParser.CDG_WIDTH, CdgParser.CDG_HEIGHT, true, changeTrackCli);
                process.stdout.write(text);
                changeTrackCli = {};
            }

            const now = Date.now();
            const positionCurrent = stepResult.parseResult.time * 1000;
            const positionExpected = (now - startTime) * options.rate;
            const delay = positionCurrent - positionExpected;
            if (delay > 0) {
                await new Promise(resolve => setTimeout(resolve, delay / options.rate));
            }
        }

        let lyricsResult = null;
        if (analyzerResult) {

            if (options.analyzeDump && analyzerResult) {
                for (const change of analyzerResult.changes) {
                    // action: 'group-text', groupId: group.id, srcRect, dimensions, buffer
                    if (change.action == 'group-text') {
                        const text = renderAnsiImage(change.buffer, change.dimensions.width, change.dimensions.height, false);
                        process.stdout.write(text);
                        delete change.buffer;
                        console.log('LYRIC: ' + change.ocrResult.allText);
                    }
                    console.log(JSON.stringify(change));
                }
            }

            lyricsResult = lyrics.step(analyzerResult);

        }

        // End of stream
        if (!stepResult.parseResult) {
            //console.log('End of stream');
            break;
        }

        if (options.maxDuration != null && stepResult.parseResult.time >= options.maxDuration) {
            break;
        }
    }

    // Output lyrics
    if (lrcFile != null || options.lyricsOutput) {
        const extraMetadata = {};
        if (options.scanAudio) {
            const audioFile = inputFile.replace(/\.cdg$/i, '.mp3');
            if (fs.existsSync(audioFile)) {
                const detectSilenceOptions = {};
                const silenceResults = await detectSilence(audioFile, detectSilenceOptions);
                if (silenceResults.startSilenceDuration != null) {
                    extraMetadata._start = CdgLyrics.formatTime(silenceResults.startSilenceDuration);
                }
                if (silenceResults.endSilenceFrom != null) {
                    extraMetadata._end = CdgLyrics.formatTime(silenceResults.endSilenceFrom);
                }
            }
        }
        const lrcData = lyrics.createLrc(options.lrcOptions, extraMetadata);
        if (lrcFile != null) {
            fs.writeFileSync(lrcFile, lrcData);
        } else {
            console.log(lrcData.trimEnd());
        }
    }

    return 0;
}

async function run(inputFiles, options) {
    let errors = 0;
    for (let i = 0; i < inputFiles.length; i++) {
        const inputFile = inputFiles[i];
        console.error('READ #' + (i + 1) + '/' + inputFiles.length + ': ' + inputFile);
        const result = await runOnce(inputFile, options);
        if (result != 0) {
            console.error('ERROR: Failed with result ' + result + ' on input file: ' + inputFile);
            errors++;
        }
    }
    console.error('DONE (' + errors + ' errors): ' + inputFiles.length);
    return errors;
}


async function main(args) {
    let inputFiles = [];
    let positional = 0;
    let help = false;
    const options = {
        // Terminal playback
        term: false,
        rate: 1,
        // Output/restrict analysis
        analyzeDump: false,
        analyzeAfter: null,
        analyzeBefore: null,
        analyzeVerbose: false,
        // Output .LRC lyrics
        lyricsOutput: true,
        overwrite: false,
        overwriteOutdated: false,
        lrcOptions: {
            wordStarts: true,       // false=none, true=all, 1=first only
            wordEnds: true,         // false=none, true=all, 1=last only
            lyricsVersion: 1.0002,
        },
        // Options to cdg-parser
        parserOptions: {
            verbose: false,
            errorUnhandledCommands: false,
        },
        // Options to cdg-analyzer
        analyzerOptions: {
            wordCorrections,
            letterCorrections,
            splitRuns: true,
            textDetector: {
            },
            detectOptions: {
                tesseractPath: 'tesseract',
            },
        },
        // Options to cdg-lyrics
        lyricsOptions: {
            lyricsDump: false,
        },
    };
    for (let i = 0; i < args.length; i++) {
        if (args[i] == '--help') {
            help = true;
        } else if (args[i] == '--term') {
            options.term = true;
        } else if (args[i] == '--verbose') {
            options.parserOptions.verbose = true;
        } else if (args[i] == '--lyrics-dump') {
            options.lyricsOptions.lyricsDump = true;
        } else if (args[i] == '--no-lyrics') {
            options.lyricsOutput = false;
            options.analyzerOptions.detectOptions.tesseractPath = null;     // disable OCR
        } else if (args[i] == '--word-time:none') {
            options.lrcOptions.wordStarts = false;
            options.lrcOptions.wordEnds = false;
        } else if (args[i] == '--word-time:start-and-end') {    // default
            options.lrcOptions.wordStarts = true;
            options.lrcOptions.wordEnds = true;
        } else if (args[i] == '--word-time:start') {    // probably the expected for enhanced LRC?
            options.lrcOptions.wordStarts = true;
            options.lrcOptions.wordEnds = false;
        } else if (args[i] == '--word-time:end') {
            options.lrcOptions.wordStarts = false;
            options.lrcOptions.wordEnds = true;
        } else if (args[i] == '--word-time:start-and-last') {
            options.lrcOptions.wordStarts = true;
            options.lrcOptions.wordEnds = 1;
        } else if (args[i] == '--word-time:end-and-first') {
            options.lrcOptions.wordStarts = 1;
            options.lrcOptions.wordEnds = true;
        } else if (args[i] == '--analyze-dump') {
            options.analyzeDump = true;
        } else if (args[i] == '--analyze-after') {
            options.analyzeAfter = parseFloat(args[++i]);
        } else if (args[i] == '--analyze-before') {
            options.analyzeBefore = parseFloat(args[++i]);
        } else if (args[i] == '--analyze-verbose') {
            options.analyzeVerbose = true;
        } else if (args[i] == '--no-corrections') {
            options.analyzerOptions.wordCorrections = {};
            options.analyzerOptions.letterCorrections = {};
            options.analyzerOptions.splitRuns = false;
        } else if (args[i] == '--max-duration') {
            options.maxDuration = parseFloat(args[++i]);
        } else if (args[i] == '--rate') {
            options.rate = parseFloat(args[++i]);
        } else if (args[i] == '--lrc') {
            options.writeLrc = true;
        } else if (args[i] == '--scan-audio') {
            options.scanAudio = true;
        } else if (args[i] == '--overwrite') {
            options.overwrite = true;
        } else if (args[i] == '--overwrite-outdated') {
            options.overwriteOutdated = true;
        } else if (args[i] == '--tesseract-path') {
            options.analyzerOptions.detectOptions.tesseractPath = args[++i];
        } else if (args[i].startsWith('-')) {
            console.error('ERROR: Unknown option: ' + args[i]);
            help = true;
        } else {
            const path = args[i];
            // If directory, include all *.cdg files in directory
            if (fs.statSync(path).isDirectory()) {
                const files = fs.readdirSync(path);
                for (const file of files) {
                    if (file.match(/\.cdg$/i)) {
                        inputFiles.push(Path.join(path, file));
                    }
                }
            } else {
                inputFiles.push(path);
            }
            positional++;
        }
    }
    if (inputFiles.length == 0) {
        console.error('ERROR: No input file(s) specified');
        help = true;
    }
    if (help) {
        console.log('CaDGe - .CDG file Parser and Lyric Extractor');
        console.log('');
        console.log('Usage - display .LRC for a .CDG file:');
        console.log('');
        console.log('\tnode src/main.mjs FILENAME.cdg');
        console.log('');
        console.log('Usage - convert from .CDG to automatically-named .LRC:');
        console.log('');
        console.log('\tnode src/main.mjs --lrc FILENAME.cdg');
        console.log('');
        console.log('Usage - play .CDG in terminal (resize window to >= 300x108 characters):');
        console.log('');
        console.log('\tnode src/main.mjs --no-lyrics --rate 1 --term FILENAME.cdg');
        console.log('');
        return 1;
    }
    return await run(inputFiles, options);
}

// From CLI, run with arguments and return exit code
process.exit(await main(process.argv.slice(2)));
