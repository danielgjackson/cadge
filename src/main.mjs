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
    
    const reportInterval = 0;
    //let lastReported = null;
    let changeTrackCli = {};
    const considerPackets = 30;
    const startTime = Date.now();
    while (true) {
        const stepResult = analyzer.step([changeTrackCli]);

        let applyResult = null;
        if (options.analyseAfter == null || (stepResult && stepResult.parseResult && stepResult.parseResult.time >= options.analyseAfter)) {
            applyResult = analyzer.applyChanges(stepResult);
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

        if (options.verbose) {
            if (applyResult) {
                for (const change of applyResult.changes) {
                    console.log(JSON.stringify(change));
                }
            }
        }

        // End of stream
        if (!stepResult.parseResult) {
            console.log('End of stream');
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
        analyseAfter: null,       // 12
    };
    for (let i = 0; i < args.length; i++) {
        if (args[i] == '--help') {
            help = true;
        } else if (args[i] == '--term') {
            options.term = true;
        } else if (args[i] == '--verbose') {
            options.verbose = true;
        } else if (args[i] == '--analyseAfter') {
            options.analyseAfter = parseFloat(args[++i]);
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
