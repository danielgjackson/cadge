// Detect duration of initial and final silence in an .mp3 file
// Uses external ffmpeg command line tool

// ffmpeg -i "$FILE.mp3" -af silencedetect=n=-50dB:d=0.5 -f null - 2>&1 | grep silencedetect

//   Duration: 00:03:53.25, start: 0.025057, bitrate: 192 kb/s
//    title           : $TITLE
//    album           : Unknown
//    track           : 1
// [silencedetect @ 00000216a362fe80] silence_start: 0
// [silencedetect @ 00000216a362fe80] silence_end: 10.0482 | silence_duration: 10.0482
// [silencedetect @ 00000216a362fe80] silence_start: 224.014
// [silencedetect @ 00000216a362fe80] silence_end: 233.187 | silence_duration: 9.17268

//import fs from 'node:fs/promises';
import process from 'node:process';
import { spawn } from 'node:child_process';

export async function detectSilence(filename, options) {
    options = Object.assign({
        silenceThreshold: '-50',
        silenceDuration: 0.5,
        ffmpegPath: 'ffmpeg',
    }, options);
    if (!filename || !options.ffmpegPath) { return []; }

    const ffmpegPath = options.ffmpegPath;
    const ffmpegOptions = [];

    ffmpegOptions.push('-i', filename);

    ffmpegOptions.push('-af', 'silencedetect=n=' + options.silenceThreshold + 'dB:d=' + options.silenceDuration);
    ffmpegOptions.push('-f', 'null');
    ffmpegOptions.push('-');

    if (0) console.log(JSON.stringify([ffmpegPath, ffmpegOptions]));

    const ffmpeg = spawn(ffmpegPath, ffmpegOptions);

    const outputParts = [];
    ffmpeg.stdout.on('data', (data) => {
        outputParts.push(data);
    });
    ffmpeg.stderr.on('data', (data) => {
        outputParts.push(data);
    });
    return new Promise((resolve, reject) => {
        ffmpeg.on('close', (code) => {
            const output = outputParts.join('').split('\n');
            if (code !== 0) {
                reject(new Error(`ffmpeg process exited with code ${code}`));
            } else {
                const results = {
                    startSilenceFrom: null,
                    startSilenceDuration: 0,
                    endSilenceFrom: null,
                    endSilenceDuration: 0,
                    duration: 0,
                    title: null,
                    album: null,
                    track: null,
                };

                const silenceRegions = [];
                let currentStart = null;
                for (const line of output) {
                    const trimmedLine = line.trim();

                    if (trimmedLine.startsWith('Duration:')) {
                        const timeParts = trimmedLine.split(',')[0].split(':').slice(1).map(x => parseFloat(x.trim()));
                        results.duration = timeParts[0] * 60 * 60 + timeParts[1] * 60 + timeParts[2];
                    }

                    if (trimmedLine.startsWith('title')) {
                        results.title = trimmedLine.split(':').slice(1).join(':').trim();
                    }

                    if (trimmedLine.startsWith('album')) {
                        results.album = trimmedLine.split(':').slice(1).join(':').trim();
                    }

                    if (trimmedLine.startsWith('track')) {
                        results.track = trimmedLine.split(':').slice(1).join(':').trim();
                    }

                    if (trimmedLine.startsWith('[silencedetect')) {
                        const keyValuePairs = trimmedLine.split(']').slice(1).join(']').split('|').map(x => x.trim().split(':').map(x => x.trim()));
                        for (const [key, value] of keyValuePairs) { // 'silence_duration'
                            if (key == 'silence_start') {
                                if (currentStart !== null) {
                                    console.error('WARNING: silence_start without silence_end');
                                }
                                currentStart = parseFloat(value);
                            } else if (key == 'silence_end') {
                                let currentEnd = parseFloat(value);
                                if (currentStart === null) {
                                    console.error('WARNING: silence_end without silence_start');
                                } else {
                                    silenceRegions.push({
                                        start: currentStart,
                                        end: currentEnd,
                                    });
                                }
                                currentStart = null;
                            }
                        }
                    }
                }
                if (currentStart !== null) {
                    console.error('WARNING: silence_start without silence_end');
                }

                if (silenceRegions.length > 0) {
                    if (silenceRegions[0].start <= 0.1) {
                        results.startSilenceFrom = parseFloat(silenceRegions[0].start.toFixed(2));
                        results.startSilenceDuration = parseFloat(silenceRegions[0].end.toFixed(2));
                    }
                }

                if (silenceRegions.length > 1) {
                    if (silenceRegions[silenceRegions.length - 1].end >= results.duration - 0.5) {
                        results.endSilenceFrom = parseFloat(silenceRegions[silenceRegions.length - 1].start.toFixed(2));
                        results.endSilenceDuration = parseFloat((silenceRegions[silenceRegions.length - 1].end - silenceRegions[silenceRegions.length - 1].start).toFixed(2));
                    }
                }

                resolve(results);
            }
        });
    });
}


async function main(args) {
    let positional = 0;
    let help = false;
    const options = {
        inputFile: null,
    };
    for (let i = 0; i < args.length; i++) {
        if (args[i] == '--help') {
            help = true;
        } else if (args[i].startsWith('-')) {
            console.error('ERROR: Unknown option: ' + args[i]);
            help = true;
        } else {
            if (positional == 0) {
                options.inputFile = args[i];
            } else {
                console.error('ERROR: Unexpected positional argument: ' + args[i]);
                help = true;
            }
            positional++;
        }
    }

    if (options.inputFile === null) {
        console.error('ERROR: Missing input file');
        help = true;
    }

    if (help) {
        console.log('Options: <input file>');
        return 1;
    }

    const results = await detectSilence(options.inputFile, options);
    console.log(JSON.stringify(results, null, 2));
    return 0;
}

const runCli = (import.meta.url == new URL(`file:///${process.argv[1]}`).toString());
if (runCli) {
    process.exit(await main(process.argv.slice(2)));
}
