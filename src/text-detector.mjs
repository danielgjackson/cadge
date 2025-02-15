// TextDetector for Node.js
// Dan Jackson
//
// A partial implementation of the TextDetector API: https://wicg.github.io/shape-detection-api/text.html
//
// Uses a local installation of tesseract: https://github.com/tesseract-ocr/tesseract
// 
// TODO: Currently spawns one process per detection, should use the API instead: https://github.com/tesseract-ocr/tessdoc/blob/main/APIExample.md
//

import { BitmapGenerate } from './bmp.mjs';


// Minimum implementation for the below code
class DOMRectReadOnly {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.top = y;
        this.right = x + width;
        this.bottom = y + height;
        this.left = x;
    }
}

// Minimum/incorrect implementation for the below code
class Node {
    constructor() {
        this.tagName = null;
        this.attributes = {};
        this.innerText = '';
        this.childNodes = [];
        this.parentNode = null;
    }
    appendChild(childNode) {
        this.childNodes.push(childNode);
        childNode.parentNode = this;
    }
    getAttribute(name) {
        return this.attributes[name];
    }
    querySelectorAll(selector) {
        if (/^\.(\w+)$/.test(selector)) {
            const className = selector.substring(1);
            const classNames = this.attributes['class'] ? this.attributes['class'].split(' ') : [];
            const results = [];
            if (classNames.includes(className)) {
                results.push(this);
            }
            for (const child of this.childNodes) {
                results.push(...child.querySelectorAll(selector));
            }
            return results;
        } else {
            throw new Error('Unsupported selector: ' + selector);
        }
    }
    dump(depth = 0) {
        const indent = ' '.repeat(depth * 2);
        const allAttributes = Object.keys(this.attributes).map(key => 
            ' ' + key + (this.attributes[key] == null ? '' : '="' + this.attributes[key] + '"')
        ).join('');
        console.log(indent + '<' + this.tagName + allAttributes + '>');
        if (this.innerText != null && this.innerText.trim().length > 0) console.log(indent + '' + this.innerText.trim() + '');
        for (const child of this.childNodes) {
            child.dump(depth + 1);
        }
        console.log(indent + '</' + this.tagName + '>');
    }
}
class DOMParser {
    parseFromString(string) {
        const root = new Node();
        let currentNode = root;
        let newNode = null;
        let currentAttributeName = null;
        let state = 'text';
        let quoted = false;
        let token = '';
        for (let i = 0; i <= string.length; i++) {
            let c = i < string.length ? string.charAt(i) : null;
            if (state == 'text') {
                if (c == '<' || c == null) {
                    //console.log('TEXT: |' + token + '|');
                    if (currentNode.innerText.length > 0) {
                        currentNode.innerText += ' ';
                    }
                    currentNode.innerText += token.trim();

                    if (c == '<') {
                        newNode = new Node();
                        state = 'tag';
                        quoted = false;
                    }
                    token = '';
                } else {
                    token += c;
                }
            } else {
                if (state == 'tag' && (c == ' ' || c == '>')) {
                    //console.log('TAG: |' + token + '|');
                    newNode.tagName = token;
                    if (c == ' ') {
                        state = 'attribute-name';
                    }
                    token = '';
                }
                else if (state == 'attribute-name' && (c == '=' || c == ' ' || c == '>')) {
                    if (token.length > 0) {
                        //console.log('ATTRIB-NAME: |' + token + '|');
                        currentAttributeName = token;
                        newNode.attributes[currentAttributeName] = null;
                        if (c == '=') {
                            state = 'attribute-value';
                        } else if (c == ' ') {
                            state = 'attribute-name';
                        }
                    }
                    token = '';
                }
                else if (state == 'attribute-value' && token.length == 0 && !quoted && (c == '"' || c == "'")) {
                    quoted = c;
                }
                else if (state == 'attribute-value' && ((quoted && c == quoted) || (!quoted && c == ' ') || c == '>')) {
                    //console.log('ATTRIB-VALUE: |' + token + '|');
                    newNode.attributes[currentAttributeName] = token;
                    quoted = false;
                    if (c != '>') {
                        state = 'attribute-name';
                    }
                    token = '';
                }
                else {
                    token += c;
                }

                if (c == '>') {
                    const closing = newNode.tagName.startsWith('/') ? newNode.tagName.substring(1) : null;
                    let selfClosing = newNode.tagName.startsWith('!');
                    if ('/' in newNode.attributes) {
                        selfClosing = true;
                        delete newNode.attributes['/'];
                    }
                    currentAttributeName == '/';
                    // Append to parent
                    if (!closing) {
                        currentNode.appendChild(newNode);
                    }
                    // Non-self-closing tags...
                    if (!selfClosing) {
                        if (!closing) {     // Opening
                            currentNode = newNode;
                        } else {            // Closing
                            currentNode = currentNode.parentNode;
                        }
                    }
                    newNode = null;
                    state = 'text';
                }
            }
        }
        return root;
    }
}



export class TextDetectorNode {

    // _options is non-standard
    constructor(_options) {
        const defaultOptions = {
            //langs: 'eng',
            tesseractPath: 'tesseract',
        }
        this.options = Object.assign(defaultOptions, _options);
    }

    static _parseHOcr(hocrString) {
        // Parse hOCR
        if (!this.domParser) {
            this.domParser = new DOMParser();
        }
        const ocrDom = this.domParser.parseFromString(hocrString, 'text/html');

        // Parse class="ocr_line"
        const lines = [];
        const lineElements = ocrDom.querySelectorAll('.ocr_line');

        for (const lineElement of lineElements) {
            const words = [];
            const wordElements = lineElement.querySelectorAll('.ocrx_word');
            for (const wordElement of wordElements) {
                const word = {
                    text: wordElement.innerText
                };
                // Parse word's title attribute
                const title = wordElement.getAttribute('title');
                const attributes = title ? title.split(';') : [];
                for (const attribute of attributes) {
                    const parts = attribute.split(' ').map(part => part.trim()).filter(part => part.length > 0).map(part => /^-?\d+(\.\d+)?$/.test(part) ? parseFloat(part) : part);
                    if (parts.length == 0) continue;
                    else if (parts.length == 1) word[parts[0]] = null;
                    else if (parts.length == 2) word[parts[0]] = parts[1];
                    else word[parts[0]] = parts.slice(1);
                }
                words.push(word);
            }

            const line = {
                words: words,
            }
            // Parse line's title attribute
            const title = lineElement.getAttribute('title');
            const attributes = title ? title.split(';') : [];
            for (const attribute of attributes) {
                const parts = attribute.split(' ').map(part => part.trim()).filter(part => part.length > 0).map(part => /^-?\d+(\.\d+)?$/.test(part) ? parseFloat(part) : part);
                if (parts.length == 0) continue;
                else if (parts.length == 1) line[parts[0]] = null;
                else if (parts.length == 2) line[parts[0]] = parts[1];
                else line[parts[0]] = parts.slice(1);
            }
            lines.push(line);
        }
        return {
            lines:lines
        }
    }

    static _boundingBoxToCornerPoints(boundingBox) {
        return [
            { x: boundingBox.left, y: boundingBox.top },
            { x: boundingBox.right, y: boundingBox.top },
            { x: boundingBox.right, y: boundingBox.bottom },
            { x: boundingBox.left, y: boundingBox.bottom },
        ];
    }

    static _convertHocrToDetectedTexts(parsedHocr) {
        const detectedTexts = [];
        for (const line of parsedHocr.lines) {
            const detectedText = {};

            // Standard line information
            detectedText.boundingBox = new DOMRectReadOnly(line.bbox[0], line.bbox[1], line.bbox[2] - line.bbox[0], line.bbox[3] - line.bbox[1]);
            detectedText.cornerPoints = TextDetectorNode._boundingBoxToCornerPoints(detectedText.boundingBox);
            detectedText.rawValue = line.words.map(word => word.text).join(' ');

            // Non-standard per-word information
            let confidenceSum = 0, confidenceCount = 0;
            detectedText._words = line.words.map(word => {
                const newWord = {
                    rawValue: word.text,
                    boundingBox: new DOMRectReadOnly(word.bbox[0], word.bbox[1], word.bbox[2] - word.bbox[0], word.bbox[3] - word.bbox[1]),
                    _confidence: word.x_wconf,
                };
                newWord.cornerPoints = TextDetectorNode._boundingBoxToCornerPoints(newWord.boundingBox);
                if ('_confidence' in newWord) {
                    confidenceSum += newWord._confidence;
                    confidenceCount++;
                }
                return newWord;
            });
            detectedText._confidence = confidenceCount > 0 ? confidenceSum / confidenceCount : null;

            detectedTexts.push(detectedText);
        }
        return detectedTexts;
    }

    // NOTE: _options is non-standard
    async detect(imageBitmapSource, _options = {}) {
        // Options
        const recognizeOptions = Object.assign({
            //lang: 'eng',
            hocr: true,
        }, _options);

        // The imageBitmapSource could be one of: Blob, HTMLCanvasElement, HTMLImageElement, HTMLVideoElement, ImageBitmap, ImageData, OffscreenCanvas, SVGImageElement, VideoFrame.
        if ('data' in imageBitmapSource && 'width' in imageBitmapSource && 'height' in imageBitmapSource) { // ImageData
            imageBitmapSource = BitmapGenerate(imageBitmapSource.data, imageBitmapSource.width, imageBitmapSource.height, false); // .toString('latin1');
        }
        else if (imageBitmapSource[0] == 'B'.charCodeAt(0) && imageBitmapSource[1] == 'M'.charCodeAt(0)) { // BMP
            ; // Will work with .bmp data
        }
        else {
            // TODO: Support other input types
            throw new Error('Currently unsupported imageBitmapSource type!');
        }

        // Recognize text
        const hocr = await this._recognize(imageBitmapSource, recognizeOptions);
        //console.dir(hocr);
        const parsedHocr = TextDetectorNode._parseHOcr(hocr);
        //console.log(JSON.stringify(parsedHocr, null, 4));
        const detectedTexts = TextDetectorNode._convertHocrToDetectedTexts(parsedHocr);
        return detectedTexts;
    }


    async _recognize(imageBitmapSource, options) {
        // Open tesseract process, pipe image data to stdin, read stdout, store return code
        const { spawn } = await import('node:child_process');
        const tesseractPath = this.options.tesseractPath;
        const tesseractOptions = [];
        tesseractOptions.push('-');     // stdin
        tesseractOptions.push('-');     // stdout
        if (options.lang) {
            tesseractOptions.push('-l');
            tesseractOptions.push(lang);
        }
        /*
        if (options.segmentationMode) {
            // osd_only auto_osd auto_only auto single_column single_block_vert_text single_block single_line single_word circle_word single_char sparse_text sparse_text_osd raw_line
            const psmOptions = {
                'osd_only': 0,
                'auto_osd': 1,
                'auto_only': 2,
                'auto': 3,
                'single_column': 4,
                'single_block_vert_text': 5,
                'single_block': 6,
                'single_line': 7,
                'single_word': 8,
                'circle_word': 9,
                'single_char': 10,
                'sparse_text': 11,
                'sparse_text_osd': 12,
                'raw_line': 13,
            };
            tesseractOptions.push('psm');
            tesseractOptions.push(psmOptions[options.segmentationMode] ?? options.segmentationMode);
        }
        */
        tesseractOptions.push('quiet');
        tesseractOptions.push('hocr');
        const tesseract = spawn(tesseractPath, tesseractOptions);
        tesseract.stdin.write(imageBitmapSource);
        tesseract.stdin.end();
        let output = [];
        tesseract.stdout.on('data', (data) => {
            output.push(data);
        });
        tesseract.stderr.on('data', (data) => {
            console.error(`Tesseract Error: ${data}`);
        });
        return new Promise((resolve, reject) => {
            tesseract.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`Tesseract process exited with code ${code}`));
                } else {
                    resolve(output.join(''));
                }
            });
        });
    }

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

    const fs = (await import('fs')).promises;
    const imageBitmapSource = await fs.readFile(options.inputFile);
    const textDetector = new TextDetectorNode();
    const textResults = await textDetector.detect(imageBitmapSource);
    console.log(JSON.stringify(textResults, null, 4));
    return 0;
}


const process = await import('node:process');
const runCli = (import.meta.url == new URL(`file:///${process.argv[1]}`).toString());
if (runCli) {
    process.exit(await main(process.argv.slice(2)));
}
