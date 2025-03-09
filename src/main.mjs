// Node.js CLI wrapper for CaDGe

import fs from 'node:fs';
import Path from 'path';
import { CdgParser } from './cdg-parser.mjs';
import { CdgAnalyzer } from './cdg-analyzer.mjs';
import { CdgLyrics } from './cdg-lyrics.mjs';
import { BitmapGenerate } from './bmp.mjs';
import { renderAnsiImage } from './cli-image.mjs';
import { corrections } from './corrections.mjs';

async function run(inputFile, options) {
    const baseFilename = Path.parse(inputFile).name;    // path.basename(inputFile, '.cdg');
    //console.log('Processing: ' + inputFile + ' -- ' + JSON.stringify(options));

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
    if (options.lyricsOutput) {
        lyrics.outputLrc(options.lrcOptions);
    }

    return 0;
}

async function main(args) {
    let inputFile = null;
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
        // Output .LRC lyrics
        lyricsOutput: true,
        lrcOptions: {
            wordStarts: true,   // false=none, true=all, 1=first only
            wordEnds: true,     // false=none, true=all, 1=last only
        },
        // Options to cdg-parser
        parserOptions: {
            verbose: false,
            errorUnhandledCommands: false,
        },
        // Options to cdg-analyzer
        analyzerOptions: {
            corrections,
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
        } else if (args[i] == '--max-duration') {
            options.maxDuration = parseFloat(args[++i]);
        } else if (args[i] == '--rate') {
            options.rate = parseFloat(args[++i]);
        } else if (args[i] == '--tesseract-path') {
            options.analyzerOptions.detectOptions.tesseractPath = args[++i];
        } else if (args[i].startsWith('-')) {
            console.error('ERROR: Unknown option: ' + args[i]);
            help = true;
        } else {
            if (positional == 0) {
                inputFile = args[i];
            } else {
                console.error('ERROR: Unexpected positional argument: ' + args[i]);
                help = true;
            }
            positional++;
        }
    }
    if (inputFile === null) {
        console.error('ERROR: Missing input file');
        help = true;
    }
    if (help) {
        console.log('CaDGe - .CDG file Parser and Lyric Extractor');
        console.log('');
        console.log('Usage - convert from .CDG to .LRC:');
        console.log('');
        console.log('\tnode src/main.mjs FILENAME.cdg > FILENAME.lrc');
        console.log('');
        console.log('Usage - play .CDG in terminal (resize window to >= 300x108 characters):');
        console.log('');
        console.log('\tnode src/main.mjs --no-lyrics --rate 1 --term FILENAME.cdg');
        console.log('');
        return 1;
    }
    return await run(inputFile, options);
}

// From CLI, run with arguments and return exit code
process.exit(await main(process.argv.slice(2)));
