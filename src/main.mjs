// Node.js CLI wrapper for CaDGe

import fs from 'node:fs';
import { CdgParser } from './cdg-parser.mjs';
import { CdgAnalyzer } from './cdg-analyzer.mjs';
import { BitmapGenerate } from './bmp.mjs';
import { renderAnsiImage } from './cli-image.mjs';


async function run(inputFile, options) {
    console.log('Processing: ' + inputFile + ' -- ' + JSON.stringify(options));
    const data = fs.readFileSync(inputFile);
    const parser = new CdgParser(data, options);
    const analyzer = new CdgAnalyzer(parser, options);
    
    // Negative times are relative to the end of the stream
    if (options.analyseAfter != null && options.analyseAfter < 0) { options.analyseAfter += parser.getDuration(); }
    if (options.analyseBefore != null && options.analyseBefore < 0) { options.analyseBefore += parser.getDuration(); }

    const reportInterval = 0;
    //let lastReported = null;
    let changeTrackCli = {};
    const considerPackets = 30;
    const startTime = Date.now();
    while (true) {
        const stepResult = analyzer.step([changeTrackCli]);

        let applyResult = null;
        if (options.analyseAfter == null || (stepResult && stepResult.parseResult && stepResult.parseResult.time >= options.analyseAfter)) {
            if (options.analyseBefore == null || (stepResult && stepResult.parseResult && stepResult.parseResult.time < options.analyseBefore)) {
                applyResult = await analyzer.applyChanges(stepResult);
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
                if (1) {
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

        if (options.analyseDump && applyResult) {
            for (const change of applyResult.changes) {
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

        // End of stream
        if (!stepResult.parseResult) {
            //console.log('End of stream');
            break;
        }

        if (options.maxDuration != null && stepResult.parseResult.time >= options.maxDuration) {
            break;
        }
    }

    return 0;
}

async function main(args) {
    let inputFile = null;
    let positional = 0;
    let help = false;
    const options = {
        term: false,
        rate: 1,
        errorUnhandledCommands: true,
        verbose: false,
        analyseDump: true,
        analyseAfter: null,
        analyseBefore: null,
    };
    for (let i = 0; i < args.length; i++) {
        if (args[i] == '--help') {
            help = true;
        } else if (args[i] == '--term') {
            options.term = true;
        } else if (args[i] == '--verbose') {
            options.verbose = true;
        } else if (args[i] == '--analyseDump') {
            options.analyseDump = true;
        } else if (args[i] == '--analyseAfter') {
            options.analyseAfter = parseFloat(args[++i]);
        } else if (args[i] == '--analyseBefore') {
            options.analyseBefore = parseFloat(args[++i]);
        } else if (args[i] == '--maxDuration') {
            options.maxDuration = parseFloat(args[++i]);
        } else if (args[i] == '--rate') {
            options.rate = parseFloat(args[++i]);
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
