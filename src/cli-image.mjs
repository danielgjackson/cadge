

export const blocks = {
    "ascii": {
        width: 1, height: 1, characters: [
            " ", "#",
        ],
    },
    "whole": {
        width: 1, height: 1, characters: [
            " ", "█",
        ],
    },
    "half": {
        width: 1, height: 2, characters: [
            " ", "▀", "▄", "█",
        ],
    },
    "quarter": {
        width: 2, height: 2, characters: [
            " ", "▘", "▝", "▀",
            "▖", "▌", "▞", "▛",
            "▗", "▚", "▐", "▜",
            "▄", "▙", "▟", "█",
        ],
    },
    "sixths": { // This output type requires "BLOCK SEXTANT" codes from "Symbols For Legacy Computing", part of Unicode 13.
        width: 2, height: 3, characters: [
                    " ", "\u{1FB00}", "\u{1FB01}", "\u{1FB02}", // 00/00/00, 10/00/00, 01/00/00, 11/00/00, 
            "\u{1FB03}", "\u{1FB04}", "\u{1FB05}", "\u{1FB06}", // 00/10/00, 10/10/00, 01/10/00, 11/10/00, 
            "\u{1FB07}", "\u{1FB08}", "\u{1FB09}", "\u{1FB0A}", // 00/01/00, 10/01/00, 01/01/00, 11/01/00, 
            "\u{1FB0B}", "\u{1FB0C}", "\u{1FB0D}", "\u{1FB0E}", // 00/11/00, 10/11/00, 01/11/00, 11/11/00, 
            "\u{1FB0F}", "\u{1FB10}", "\u{1FB11}", "\u{1FB12}", // 00/00/10, 10/00/10, 01/00/10, 11/00/10, 
            "\u{1FB13}",         "▌", "\u{1FB14}", "\u{1FB15}", // 00/10/10, 10/10/10, 01/10/10, 11/10/10, 
            "\u{1FB16}", "\u{1FB17}", "\u{1FB18}", "\u{1FB19}", // 00/01/10, 10/01/10, 01/01/10, 11/01/10, 
            "\u{1FB1A}", "\u{1FB1B}", "\u{1FB1C}", "\u{1FB1D}", // 00/11/10, 10/11/10, 01/11/10, 11/11/10, 
            "\u{1FB1E}", "\u{1FB1F}", "\u{1FB20}", "\u{1FB21}", // 00/00/01, 10/00/01, 01/00/01, 11/00/01, 
            "\u{1FB22}", "\u{1FB23}", "\u{1FB24}", "\u{1FB25}", // 00/10/01, 10/10/01, 01/10/01, 11/10/01, 
            "\u{1FB26}", "\u{1FB27}",         "▐", "\u{1FB28}", // 00/01/01, 10/01/01, 01/01/01, 11/01/01, 
            "\u{1FB29}", "\u{1FB2A}", "\u{1FB2B}", "\u{1FB2C}", // 00/11/01, 10/11/01, 01/11/01, 11/11/01, 
            "\u{1FB2D}", "\u{1FB2E}", "\u{1FB2F}", "\u{1FB30}", // 00/00/11, 10/00/11, 01/00/11, 11/00/11, 
            "\u{1FB31}", "\u{1FB32}", "\u{1FB33}", "\u{1FB34}", // 00/10/11, 10/10/11, 01/10/11, 11/10/11, 
            "\u{1FB35}", "\u{1FB36}", "\u{1FB37}", "\u{1FB38}", // 00/01/11, 10/01/11, 01/01/11, 11/01/11, 
            "\u{1FB39}", "\u{1FB3A}", "\u{1FB3B}",         "█", // 00/11/11, 10/11/11, 01/11/11, 11/11/11, 
        ],
    },
    "dots3": {
        width: 2, height: 3, characters: [
            "⠀", "⠁", "⠈", "⠉", "⠂", "⠃", "⠊", "⠋", "⠐", "⠑", "⠘", "⠙", "⠒", "⠓", "⠚", "⠛",
            "⠄", "⠅", "⠌", "⠍", "⠆", "⠇", "⠎", "⠏", "⠔", "⠕", "⠜", "⠝", "⠖", "⠗", "⠞", "⠟",
            "⠠", "⠡", "⠨", "⠩", "⠢", "⠣", "⠪", "⠫", "⠰", "⠱", "⠸", "⠹", "⠲", "⠳", "⠺", "⠻",
            "⠤", "⠥", "⠬", "⠭", "⠦", "⠧", "⠮", "⠯", "⠴", "⠵", "⠼", "⠽", "⠶", "⠷", "⠾", "⠿",
        ],
    },    
    "dots": {
        width: 2, height: 4, characters: [
            "⠀", "⠁", "⠈", "⠉", "⠂", "⠃", "⠊", "⠋", "⠐", "⠑", "⠘", "⠙", "⠒", "⠓", "⠚", "⠛",
            "⠄", "⠅", "⠌", "⠍", "⠆", "⠇", "⠎", "⠏", "⠔", "⠕", "⠜", "⠝", "⠖", "⠗", "⠞", "⠟",
            "⠠", "⠡", "⠨", "⠩", "⠢", "⠣", "⠪", "⠫", "⠰", "⠱", "⠸", "⠹", "⠲", "⠳", "⠺", "⠻",
            "⠤", "⠥", "⠬", "⠭", "⠦", "⠧", "⠮", "⠯", "⠴", "⠵", "⠼", "⠽", "⠶", "⠷", "⠾", "⠿",
            "⡀", "⡁", "⡈", "⡉", "⡂", "⡃", "⡊", "⡋", "⡐", "⡑", "⡘", "⡙", "⡒", "⡓", "⡚", "⡛",
            "⡄", "⡅", "⡌", "⡍", "⡆", "⡇", "⡎", "⡏", "⡔", "⡕", "⡜", "⡝", "⡖", "⡗", "⡞", "⡟",
            "⡠", "⡡", "⡨", "⡩", "⡢", "⡣", "⡪", "⡫", "⡰", "⡱", "⡸", "⡹", "⡲", "⡳", "⡺", "⡻",
            "⡤", "⡥", "⡬", "⡭", "⡦", "⡧", "⡮", "⡯", "⡴", "⡵", "⡼", "⡽", "⡶", "⡷", "⡾", "⡿",
            "⢀", "⢁", "⢈", "⢉", "⢂", "⢃", "⢊", "⢋", "⢐", "⢑", "⢘", "⢙", "⢒", "⢓", "⢚", "⢛",
            "⢄", "⢅", "⢌", "⢍", "⢆", "⢇", "⢎", "⢏", "⢔", "⢕", "⢜", "⢝", "⢖", "⢗", "⢞", "⢟",
            "⢠", "⢡", "⢨", "⢩", "⢢", "⢣", "⢪", "⢫", "⢰", "⢱", "⢸", "⢹", "⢲", "⢳", "⢺", "⢻",
            "⢤", "⢥", "⢬", "⢭", "⢦", "⢧", "⢮", "⢯", "⢴", "⢵", "⢼", "⢽", "⢶", "⢷", "⢾", "⢿",
            "⣀", "⣁", "⣈", "⣉", "⣂", "⣃", "⣊", "⣋", "⣐", "⣑", "⣘", "⣙", "⣒", "⣓", "⣚", "⣛",
            "⣄", "⣅", "⣌", "⣍", "⣆", "⣇", "⣎", "⣏", "⣔", "⣕", "⣜", "⣝", "⣖", "⣗", "⣞", "⣟",
            "⣠", "⣡", "⣨", "⣩", "⣢", "⣣", "⣪", "⣫", "⣰", "⣱", "⣸", "⣹", "⣲", "⣳", "⣺", "⣻",
            "⣤", "⣥", "⣬", "⣭", "⣦", "⣧", "⣮", "⣯", "⣴", "⣵", "⣼", "⣽", "⣶", "⣷", "⣾", "⣿",
        ],
    },
};


export function renderText(data, width, height, span, blockType)
{
    const output = '';
    for (let y = 0; y < height; y += blockType.cellH)
    {
        for (let x = 0; x < width; x += blockType.cellW)
        {
            let value = 0;
            for (let yy = 0; yy < blockType.cellH; yy++)
            {
                for (let xx = 0; xx < blockType.cellW; xx++)
                {
                    let bit = (data[(y + yy) * span + ((x + xx) >> 3)] >> (7 - ((x + xx) & 7))) & 1;
                    value |= (bit << (yy * blockType.cellW + xx));
                }
            }
            output += blockType.text[value];
        }
        output += '\n';
    }
    return output;
}


export function renderAnsiImage(color, width, height, reset = false, rectangle = null) {
    const displayParts = [];
    const character = '▀';

    //if (reset) { displayParts.push('\x1B[s'); } // Save cursor
    //if (reset) { displayParts.push('\x1B7'); } // Save cursor

    if (rectangle == null || rectangle.x == null) {
        rectangle = { x: 0, y: 0, width, height };
    }
    if (rectangle.y & 1) {
        rectangle.y--;
        rectangle.height++;
    }
    if (rectangle.y > 0) {
        displayParts.push('\x1B[' + (Math.floor(rectangle.y / 2)) + 'B');
    }
    for (let y = rectangle.y; y < rectangle.y + rectangle.height; y += 2) {
        if (rectangle.x > 0) {
            displayParts.push('\x1B[' + (rectangle.x) + 'C');
        }
        for (let x = rectangle.x; x < rectangle.x + rectangle.width; x++) {
            let c;
            // Background color
            if (y + 1 < height) {
                const r = color[((y + 1) * width + x) * 4 + 0];
                const g = color[((y + 1) * width + x) * 4 + 1];
                const b = color[((y + 1) * width + x) * 4 + 2];
                displayParts.push(`\x1B[48;2;${r};${g};${b}m`);
            } else {
                displayParts.push('\x1B[0m');  // reset (for background)
            }
            // Upper/foreground color and character
            const r = color[(y * width + x) * 4 + 0];
            const g = color[(y * width + x) * 4 + 1];
            const b = color[(y * width + x) * 4 + 2];
            displayParts.push(`\x1B[38;2;${r};${g};${b}m${character}`);
        }
        displayParts.push('\x1B[0m\n');
    }

    if (reset) { displayParts.push('\x1B[' + Math.ceil((rectangle.y + rectangle.height) / 2) + 'A'); } // Return cursor to top
    //if (reset) { displayParts.push('\x1B8'); } // Restore cursor
    //if (reset) { displayParts.push('\x1B[u'); } // Restore cursor

    return displayParts.join('');
}


export function renderSixelImage(color, width, height, reset = false, rectangle = null, scale = 1) {
    const LINE_HEIGHT = 6;
    const displayParts = [];

    if (rectangle == null || rectangle.x == null) {
        rectangle = { x: 0, y: 0, width, height };
    }
    if (rectangle.y % LINE_HEIGHT) {
        rectangle.height += rectangle.y % LINE_HEIGHT;
        rectangle.y -= rectangle.y % LINE_HEIGHT;
    }
    if (rectangle.height % LINE_HEIGHT) {
        rectangle.height += LINE_HEIGHT - (rectangle.y % LINE_HEIGHT);
    }

    // Calculate mapping to sixel color code
    const toCode = {};
    for (let y = rectangle.y; y < rectangle.y + rectangle.height; y++) {
        for (let x = rectangle.x; x < rectangle.x + rectangle.width; x++) {
            if (y >= height) continue;
            const rgb = [color[(y * width + x) * 4 + 0], color[(y * width + x) * 4 + 1], color[(y * width + x) * 4 + 2]];
            const r = Math.floor(100 * color[(y * width + x) * 4 + 0] / 255);
            const g = Math.floor(100 * color[(y * width + x) * 4 + 1] / 255);
            const b = Math.floor(100 * color[(y * width + x) * 4 + 2] / 255);
            const code = `${r};${g};${b}`;
            toCode[rgb] = code;
        }
    }
    // Calculate unique color codes
    const codeMap = {};
    for (const c of Object.values(toCode)) {
      codeMap[c] = true;
    }
    const codes = Object.keys(codeMap);

    if (reset) { displayParts.push('\x1B[s'); } // Save cursor
    //if (reset) { displayParts.push('\x1B7'); } // Save cursor

    // Enter sixel mode
    displayParts.push('\x1BP7;1q');    // 1:1 ratio, 0 pixels remain at current color
    // Set color map
    displayParts.push('#0;2;0;0;0');       // Background

    // Skip lines to rectangle
    const skip = Math.floor(rectangle.y / LINE_HEIGHT);
    displayParts.push('-'.repeat(skip));

    // Draw image
    for (let y = rectangle.y * scale; y < (rectangle.y + rectangle.height) * scale; y += LINE_HEIGHT) {
        if (y >= height * scale) continue;
        let passCount = 0;
        for (let pass of codes) {
            // Start a pass in a specific color
            const passStart = (passCount++ == 0 ? '' : '$') + '#' + 1 + ';2;' + pass;
            let lastX = 0;
            // Line data
            for (let x = rectangle.x * scale; x < (rectangle.x + rectangle.width) * scale; x += scale) {
                let value = 0;
                for (let yy = 0; yy < LINE_HEIGHT; yy++) {
                    const rgb = [
                        color[(Math.floor((y + yy) / scale) * width + Math.floor(x / scale)) * 4 + 0], 
                        color[(Math.floor((y + yy) / scale) * width + Math.floor(x / scale)) * 4 + 1], 
                        color[(Math.floor((y + yy) / scale) * width + Math.floor(x / scale)) * 4 + 2],
                    ];
                    if (rgb == null) continue;
                    const code = toCode[rgb]; // c[0], c[1], c[2]
                    if (code == null) continue;
                    if (code != pass) {
                        // Not the current color
                        continue;
                    }
                    value |= 1 << yy;
                }
                if (value > 0) {
                  if (lastX == 0) {
                    displayParts.push(passStart);
                  }
                  const gap = x - lastX;
                  if (gap > 0) {
                    // Gap of empty pixels to the current position
                    if (gap <= 3) {
                      displayParts.push('?'.repeat(gap));
                    } else {
                      displayParts.push('!' + gap + '?');
                    }
                  }
                  const code = (scale > 3 ? '!' + scale : '') + String.fromCharCode(value + 63).repeat(scale <= 3 ? scale : 1);
                  // Six pixels strip at 'scale' (repeated) width
                  displayParts.push(code);
                  lastX = x + scale;
                }
            }
        }
        // Next line
        if (y + LINE_HEIGHT < (rectangle.y + rectangle.height) * scale) {
            displayParts.push('-');
        }
    }
    // Exit sixel mode
    displayParts.push('\x1B\\');

    if (reset) { displayParts.push('\x1B8'); } // Restore cursor
    //if (reset) { displayParts.push('\x1B[u'); } // Restore cursor

    return displayParts.join('');
}


// TGP - Terminal Graphics Protocol
let tgpImageBuffer = null;        // Cached
let tgpBase64Buffer = null;       // Cached
export function renderTerminalGraphicsProtocolImage(color, width, height, reset = false, rectangle = null, scale = 1) {
    const alpha = false;

    if (rectangle == null || rectangle.x == null) {
        rectangle = { x: 0, y: 0, width, height };
    }

    // Render scaled image
    const tgpImageBufferSize = (width * scale) * (height * scale) * (alpha ? 4 : 3);
    if (!tgpImageBuffer || tgpImageBuffer.byteLength < tgpImageBufferSize) {
        tgpImageBuffer = new Uint8Array(tgpImageBufferSize);
    }
    for (let y = rectangle.y * scale; y < (rectangle.y + rectangle.height) * scale; y++) {
        for (let x = rectangle.x * scale; x < (rectangle.x + rectangle.width) * scale; x++) {
            const srcOfs = (Math.floor(y / scale) * width + Math.floor(x / scale)) * 4;
            const dstOfs = (y * (width * scale) + x) * (alpha ? 4 : 3);
            tgpImageBuffer[dstOfs + 0] = color[srcOfs + 0]; // r
            tgpImageBuffer[dstOfs + 1] = color[srcOfs + 1]; // g
            tgpImageBuffer[dstOfs + 2] = color[srcOfs + 2]; // b
            if (alpha) tgpImageBuffer[dstOfs + 3] = color[srcOfs + 3];  // a
        }
    }

    // Convert to base64 (TODO: Switch to use built-in functions in Node/Deno/etc.)
    const tgpBase64BufferSize = Math.floor((tgpImageBufferSize + 2) / 3) * 4;
    if (!tgpBase64Buffer || tgpBase64Buffer.length != tgpBase64BufferSize) {
        tgpBase64Buffer = new Uint8Array(tgpBase64BufferSize);
    }
    // Manually encode to Base64
    const base64Chars = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"].map(x => x.charCodeAt(0));
    for (let i = 0; i < tgpImageBufferSize; i += 3) {
        const value = (tgpImageBuffer[i] << 16) | (i + 1 < tgpImageBufferSize ? (tgpImageBuffer[i + 1] << 8) : 0) | (i + 2 < tgpImageBufferSize ? tgpImageBuffer[i + 2] : 0);
        let ofs = Math.floor(i / 3) * 4;
        tgpBase64Buffer[ofs + 0] = base64Chars[(value >> 18) & 0x3f];
        tgpBase64Buffer[ofs + 1] = base64Chars[(value >> 12) & 0x3f];
        tgpBase64Buffer[ofs + 2] = (i + 1 < tgpImageBufferSize) ? base64Chars[(value >> 6) & 0x3f] : '=';
        tgpBase64Buffer[ofs + 3] = (i + 2 < tgpImageBufferSize) ? base64Chars[value & 0x3f] : '=';
    }

    // Convert tgpBase64Buffer to a string from ASCII
    const encodedString = (new TextDecoder()).decode(tgpBase64Buffer);

    // Output
    const parts = [];
    //if (reset) { parts.push('\x1B[s'); } // Save cursor
    //if (reset) { parts.push('\x1B7'); } // Save cursor

    // Chunked image output
    const MAX_CHUNK_SIZE = 4096;
    for (let i = 0; i < encodedString.length; i += MAX_CHUNK_SIZE) {
        const chunk = encodedString.slice(i, i + MAX_CHUNK_SIZE);
        // action transmit and display (a=T), direct transfer (t=d), uncompressed (o=), 3/4 bytes per pixel (f=24/32 bits per pixel), no responses at all (q=2)
        // do not move cursor (C=1)
        const doNotMove = (true && reset) ? ',C=1' : '';
        const initialControls = (i == 0) ? `a=T,f=${alpha ? 32 : 24},s=${width * scale},v=${height * scale},t=d,q=2,` : '';
        const nonTerminal = (i + MAX_CHUNK_SIZE < encodedString.length) ? 1 : 0;
        parts.push(`\x1B_G${initialControls}m=${nonTerminal}${doNotMove};${chunk}\x1B\\`);
    }

    //if (reset) { parts.push('\x1B8'); } // Restore cursor
    //if (reset) { parts.push('\x1B[u'); } // Restore cursor

    return parts.join('');
}
