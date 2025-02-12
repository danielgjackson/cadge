// Node.js CLI wrapper for CaDGe

import fs from 'node:fs';
import { CdgParser } from './cdg-parser.mjs';


function run(inputFile) {
    console.log('Processing: ' + inputFile);
    const data = fs.readFileSync(inputFile);
    const parserOptions = {
    };
    const parser = new CdgParser(data, parserOptions);

    while (!parser.isEndOfStream()) {
        const packetNumber = parser.getPacketNumber();
        const time = parser.getTime();
        console.log('#' + packetNumber + ' @' + time + ' - ');
        parser.parseNextPacket();
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
