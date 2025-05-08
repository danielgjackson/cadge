// Detect volume level of an .mp3 file
// Uses external ffmpeg command line tool

// ffmpeg -i "$FILE.mp3" -filter:a "volumedetect" -map 0:a -f null - 2>&1 | grep Parsed_volumedetect_0

// [Parsed_volumedetect_0 @ 0x7f8ba1c121a0] mean_volume: -16.0 dB
// [Parsed_volumedetect_0 @ 0x7f8ba1c121a0] max_volume: -5.0 dB
// [Parsed_volumedetect_0 @ 0x7f8ba1c121a0] histogram_0db: 87861

// If rewriting the audio, a max volume of 0 means no amplification without clipping, but 
// if, for example, the max_volume is -5dB, then the audio can be amplified by 5dB without clipping:
//   ffmpeg -i "$FILE.mp3" -filter:a "volume=5dB" "$FILE.normalized.mp3"


//import fs from 'node:fs/promises';
import process from 'node:process';
import { spawn } from 'node:child_process';

export async function detectVolume(filename, options) {
    options = Object.assign({
        ffmpegPath: 'ffmpeg',
    }, options);
    if (!filename || !options.ffmpegPath) { return []; }

    const ffmpegPath = options.ffmpegPath;
    const ffmpegOptions = [];

    ffmpegOptions.push('-i', filename);

    ffmpegOptions.push('-filter:a', 'volumedetect');
    ffmpegOptions.push('-map', '0:a');
    ffmpegOptions.push('-f', 'null');
    ffmpegOptions.push('-');

    if (options.verbose) {
        console.error('VOLUME-COMMAND: ' + JSON.stringify([ffmpegPath, ffmpegOptions]));
    }

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
            if (options.verbose) {
                console.error('VOLUME-RESULT: ' + code);
            }
            const rawOutput = outputParts.join('');
            const output = rawOutput.split('\n');
            if (options.verbose) {
                console.error('VOLUME-OUTPUT: (' + output.length + ' lines)');
                console.error(rawOutput);
            }

            if (code !== 0) {
                reject(new Error(`ffmpeg process exited with code ${code}`));
            } else {
                const results = {
                    max_volume: null,
                    mean_volume: null,
                    n_samples: null,
                    histogram_db: [], // histogram_0db, histogram_1db, ...
                };

                for (const line of output) {
                    const trimmedLine = line.trim();
                     if (trimmedLine.startsWith('[Parsed_volumedetect_0')) {
                        const keyValuePairs = trimmedLine.split(']').slice(1).join(']').split('|').map(x => x.trim().split(':').map(x => x.trim()));
                        for (const [key, value] of keyValuePairs) {
                            const valueFloat = parseFloat(value);
                            if (key == 'max_volume') {
                                results.max_volume = valueFloat;
                            } else if (key == 'mean_volume') {
                                results.mean_volume = valueFloat;
                            } else if (key == 'n_samples') {
                                results.n_samples = valueFloat;
                            } else if (key.startsWith('histogram_')) {
                                const histogramKey = parseInt(key.replace('histogram_', '').replace('db', ''));
                                results.histogram_db[histogramKey] = valueFloat;
                            } else {
                                if (options.verbose) {
                                    console.error('VOLUME-WARNING: Unknown key: ' + key);
                                }
                            }
                        }
                    }
                }
                if (options.verbose) {
                    console.error('VOLUME-RESULTS: ' + JSON.stringify(results, null, 2));
                }
                if (results.maxVolume === null) {
                    console.error('VOLUME-ERROR: No max volume found in output');
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
        verbose: false,
        //ffmpegPath: 'ffmpeg',
    };
    for (let i = 0; i < args.length; i++) {
        if (args[i] == '--help') {
            help = true;
        } else if (args[i] == '--verbose') {
            options.verbose = true;
        } else if (args[i] == '--ffmpeg') {
            options.ffmpegPath = args[++i];
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

    const results = await detectVolume(options.inputFile, options);
    console.log(JSON.stringify(results, null, 2));
    return 0;
}

const runCli = (import.meta.url.replace(/^file:\/+/, '/') == process.argv[1].replaceAll('\\', '/'));
if (runCli) {
    process.exit(await main(process.argv.slice(2)));
}
