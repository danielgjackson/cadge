// Node.js CLI wrapper for CaDGe

import fs from 'node:fs';
import { CdgParser } from './cdg-parser.mjs';
import { BitmapGenerate } from './bmp.mjs';
import { outputImageTerminalSmall } from './cli-image.mjs';


function run(inputFile) {
    console.log('Processing: ' + inputFile);
    const data = fs.readFileSync(inputFile);
    const parserOptions = {
    };
    const parser = new CdgParser(data, parserOptions);

    const reportInterval = 0;
    let lastReported = null;
    let changeTrackCli = {};
    while (!parser.isEndOfStream()) {
        const packetNumber = parser.getPacketNumber();
        const time = parser.getTime();
        const changed = parser.parseNextPacket([changeTrackCli]);
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

        if (true) {
            if (changeTrackCli.x != null) {
                const buffer = parser.imageRender(changeTrackCli);
// HACK: Fix partial output
changeTrackCli = {};
                outputImageTerminalSmall(buffer, CdgParser.CDG_WIDTH, CdgParser.CDG_HEIGHT, true, changeTrackCli);
                changeTrackCli = {};
            }
        }
    
    }

    return 0;
}

function main(args) {
    let inputFile = null;
    let positional = 0;
    let help = false;
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--help') {
            help = true;
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
    return run(inputFile);
}

// From CLI, run with arguments and return exit code
process.exit(main(process.argv.slice(2)));
