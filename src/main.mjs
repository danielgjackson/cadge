// Node.js CLI wrapper for CaDGe

import fs from 'node:fs';
import Path from 'path';
import { CdgParser } from './cdg-parser.mjs';
import { CdgAnalyzer } from './cdg-analyzer.mjs';
import { CdgLyrics } from './cdg-lyrics.mjs';
import { BitmapGenerate } from './bmp.mjs';
import { renderAnsiImage } from './cli-image.mjs';

// spell-checker:disable
const corrections = {
    'metry': 'merry',
    'youa': 'you a',
    'anda': 'and a',
    '»»»»': '>>>>',
    'won’t': 'won\'t',
    'YOu': 'YOU',
    'IDO': 'I DO',
    '‘Well': 'Well',
    '‘You': 'You',
};
// spell-checker:enable

async function run(inputFile, options) {
    const baseFilename = Path.parse(inputFile).name;    // path.basename(inputFile, '.cdg');
    //console.log('Processing: ' + inputFile + ' -- ' + JSON.stringify(options));

    const data = fs.readFileSync(inputFile);
    const parser = new CdgParser(data, options);
    const analyzer = new CdgAnalyzer(parser, options);
    const lyrics = new CdgLyrics(analyzer, options, baseFilename);
    
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
    lyrics.dump();

    return 0;
}

async function main(args) {
    let inputFile = null;
    let positional = 0;
    let help = false;
    const options = {
        term: false,
        rate: 1,
        errorUnhandledCommands: false,
        verbose: false,
        analyzeDump: false,
        analyzeAfter: null,
        analyzeBefore: null,
        corrections,
        tesseractPath: 'tesseract',
    };
    for (let i = 0; i < args.length; i++) {
        if (args[i] == '--help') {
            help = true;
        } else if (args[i] == '--term') {
            options.term = true;
        } else if (args[i] == '--verbose') {
            options.verbose = true;
        } else if (args[i] == '--lyricsDump') {
            options.lyricsDump = true;
        } else if (args[i] == '--analyzeDump') {
            options.analyzeDump = true;
        } else if (args[i] == '--analyzeAfter') {
            options.analyzeAfter = parseFloat(args[++i]);
        } else if (args[i] == '--analyzeBefore') {
            options.analyzeBefore = parseFloat(args[++i]);
        } else if (args[i] == '--maxDuration') {
            options.maxDuration = parseFloat(args[++i]);
        } else if (args[i] == '--rate') {
            options.rate = parseFloat(args[++i]);
        } else if (args[i] == '--tesseractPath') {
            options.tesseractPath = args[++i];
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
        console.log('Options: <input file>');
        console.log('');
        return 1;
    }
    return await run(inputFile, options);
}

// From CLI, run with arguments and return exit code
process.exit(await main(process.argv.slice(2)));
