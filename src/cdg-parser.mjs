// .CDG Parser
// Dan Jackson, 2025

/*
Audio disc read at 75 sectors per second, each sector:
* 98 frames of data

CD-DA audio disc 33-byte data frame at (44100/6=) 7350 frames per second:
* 24 bytes of audio (6 samples of stereo 16-bit PCM, at 44100 Hz)
* 8 bytes of error-correction code
* 1 byte of subcode (the bits being channels P to W; P/Q used for audio navigation/timing; R/S/T/U/V/W for CD+G)

CDG files:
* Store the entire subcode byte (ignore the top two bits).
* Each CD+G packet consists of 24-bytes
* 4 CD+G packets per sector (96 of the 98 subcode bytes available per frame)
* 300 packets per second

Structure of each packet (only the lower 6-bits are used of each byte):
```
byte command;
byte instruction;
byte parityQ[2];
byte data[16];
byte parityP[4];
```

CD+G system:
* 4-bits per pixel, indexed 16 color, palette an R4G4B4 space.
* Raster field is 300x216 pixels, only the middle 294x204 area (or, possibly, 288x192) displayed, the rest is shown as a solid border.
* CDG command is 9, instructions are:
  * 1: Memory preset - color, repeat
  * 2: Border preset - color
  * 6: Tile block (12x6) - color0 & 0x0f, color1 & 0x0f, row & 0x1f, column & 0x3f, data[12] scan-line rows uppermost bit 5 contains left-most.
  * 20: Scroll preset - color & 0x0f, hScroll (sCmd=(hScroll&0x30)>>4 where 0=no scroll, 1=6 right, 2=6 left; hOffset=(hScroll&0x07) values 0-5), vScroll (sCmd=(hScroll&0x30)>>4 where 0=no scroll, 1=12 down, 2=12 up;  vOffset=(vScroll&0x0f) values 0-11)
  * 24: Scroll copy - (same as 20 but scrolled out region replaces uncovered region)
  * 28: Define transparent color
  * 30: Load color table lower (0-7) - set 8 palette colors from byte pairs (high/low) 00RRRRGG 00GGBBBB
  * 31: Load color table upper (8-15) - (same as 30 but sets colors 8-15)
  * 38: Tile block XOR (12x6) - (same as 6 but results is XORed with existing data)
*/

const defaultOptions = {
    verbose: false,
}

export class CdgParser {

    static PACKET_SIZE = 24;
    static PACKETS_PER_SECOND = 300;

    static CDG_COLORS = 16;
    static CDG_WIDTH = 300;
    static CDG_HEIGHT = 216;
    static CDG_TILE_WIDTH = 6;
    static CDG_TILE_HEIGHT = 12;
    static CDG_BORDER_WIDTH = CdgParser.CDG_TILE_WIDTH;
    static CDG_BORDER_HEIGHT = CdgParser.CDG_TILE_HEIGHT;

    static DATA_MASK = 0x3f;
    static DATA_OFFSET = 4;

    static COMMAND_NONE = 0;
    static COMMAND_CDG = 9;

    static INSTRUCTION_MEMORY_PRESET = 1;
    static INSTRUCTION_BORDER_PRESET = 2;
    static INSTRUCTION_TILE_BLOCK = 6;
    static INSTRUCTION_SCROLL_PRESET = 20;
    static INSTRUCTION_SCROLL_COPY = 24;
    static INSTRUCTION_DEFINE_TRANSPARENT = 28;
    static INSTRUCTION_LOAD_COLOR_TABLE_LOWER = 30;
    static INSTRUCTION_LOAD_COLOR_TABLE_UPPER = 31;
    static INSTRUCTION_TILE_BLOCK_XOR = 38;

    constructor(data, options = {}) {
        this.data = data;  // UInt8Array
        this.options = Object.assign(defaultOptions, options);
        this.packetNumber = 0;

        // Decoded state
        this.borderColor = null;
        this.transparentColor = null;
        this.palette = new Uint8Array(CdgParser.CDG_COLORS * 4);
        // Store as 1 byte per pixel, but only the lower 4 bits are used for the color index
        this.image = new Uint8Array(CdgParser.CDG_WIDTH * CdgParser.CDG_HEIGHT);

        // Unknown default palette
        for (let i = 0; i < CdgParser.CDG_COLORS; i++) {
            let r = (i & 4) * ((i & 8) ? 0xff : 0x7f);
            let g = (i & 2) * ((i & 8) ? 0xff : 0x7f);
            let b = (i & 1) * ((i & 8) ? 0xff : 0x7f);
            this.setPaletteEntry(i, r, g, b);
        }
    }

    setPaletteEntry(index, r, g, b) {
        this.palette[index * 4 + 0] = r;
        this.palette[index * 4 + 1] = g;
        this.palette[index * 4 + 2] = b;
        this.palette[index * 4 + 3] = 0xff;
    }

    setPaletteTransparent(index) {
        for (let i = 0; i < CdgParser.CDG_COLORS; i++) {
            const value = (i == index) ? 0x00 : 0xff;
            this.palette[i * 4 + 3] = value;
        }
    }

    paletteDump() {
        const colors = [];
        for (let i = 0; i < CdgParser.CDG_COLORS; i++) {
            const r = this.palette[i * 4 + 0];
            const g = this.palette[i * 4 + 1];
            const b = this.palette[i * 4 + 2];
            const color = '#' + r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0');
            colors.push(color)
        }
        return colors;
    }

    getPacketNumber() {
        return this.packetNumber;
    }

    getTime() {
        return this.packetNumber / CdgParser.PACKETS_PER_SECOND;
    }

    byteOffset() {
        return this.packetNumber * CdgParser.PACKET_SIZE;
    }

    isEndOfStream() {
        return this.byteOffset() + CdgParser.PACKET_SIZE > this.data.byteLength;
    }

    imageClear(index) {
        for (let i = 0; i < this.image.byteLength; i++) {
            this.image[i] = index;
        }
    }

    imagePixel(x, y, index, xor = false) {
        const i = y * CdgParser.CDG_WIDTH + x;
        if (!xor) {
            this.image[i] = index;
        } else {
            this.image[i] ^= index;
        }
    }

    imageRender(rectangle) {
        if (!this.renderBuffer) {
            this.renderBuffer = new Uint8Array(CdgParser.CDG_WIDTH * CdgParser.CDG_HEIGHT * 4);
        }
        if (rectangle == null || rectangle.x == null) {
            rectangle = { x: 0, y: 0, width: CdgParser.CDG_WIDTH, height: CdgParser.CDG_HEIGHT };
        }
        for (let y = rectangle.y; y < rectangle.y + rectangle.height; y++) {
            for (let x = rectangle.x; x < rectangle.x + rectangle.width; x++) {
                let index;
                if (y < CdgParser.CDG_BORDER_HEIGHT || y >= CdgParser.CDG_HEIGHT - CdgParser.CDG_BORDER_HEIGHT || x < CdgParser.CDG_BORDER_WIDTH || x >= CdgParser.CDG_WIDTH - CdgParser.CDG_BORDER_WIDTH) {
                    index = this.borderColor;
                } else {
                    const i = y * CdgParser.CDG_WIDTH + x;
                    index = this.image[i];
                }
                const j = (y * CdgParser.CDG_WIDTH + x) * 4;
                let r = this.palette[index * 4 + 0];
                let g = this.palette[index * 4 + 1];
                let b = this.palette[index * 4 + 2];
                let a = this.palette[index * 4 + 3];
                if (false && a < 0x80) {       // Checkerboard transparency
                    if (((x ^ y) >> 0) & 1) {
                        r = g = b = 0x33;
                    } else {
                        r = g = b = 0xcc;
                    }
                }
                this.renderBuffer[j + 0] = r;
                this.renderBuffer[j + 1] = g;
                this.renderBuffer[j + 2] = b;
                this.renderBuffer[j + 3] = a;
            }
        }
        return this.renderBuffer;
    }

    imageDump() {
        let output = '';
        for (let y = 0; y < CdgParser.CDG_HEIGHT; y++) {
            for (let x = 0; x < CdgParser.CDG_WIDTH; x++) {
                const i = y * CdgParser.CDG_WIDTH + x;
                output += this.image[i].toString(16);
            }
        }
        return output;
    }

    // Parse the next packet
    parseNextPacket(changeTrackers = []) {
        if (this.isEndOfStream()) {
            if (this.options.verbose) console.log('--- END OF STREAM');
            return null;
        }
        let changes = null;

        if (this.options.verbose) console.log('#' + this.getPacketNumber() + ' @' + this.getTime() + ' - ');

        // Extract packet
        const offset = this.byteOffset();
        const packet = this.data.slice(offset, offset + CdgParser.PACKET_SIZE);
        // Mask each byte
        for (let i = 0; i < packet.byteLength; i++) {
            packet[i] &= CdgParser.DATA_MASK;
        }

        const command = packet[0];
        if (command == CdgParser.COMMAND_NONE) {
            //if (this.options.verbose) console.log('COMMAND_NONE');
        } else
        if (command == CdgParser.COMMAND_CDG) {
            //if (this.options.verbose) console.log('COMMAND_CDG');
            const instruction = packet[1];
            if (instruction == CdgParser.INSTRUCTION_MEMORY_PRESET) {
                const color = packet[CdgParser.DATA_OFFSET + 0];
                const repeat = packet[CdgParser.DATA_OFFSET + 1];
                if (this.options.verbose) console.log('INSTRUCTION_MEMORY_PRESET ' + color + ' ' + repeat);
                //if (this.options.verbose) console.log('... ' + packet[CdgParser.DATA_OFFSET + 2] + ', ' + packet[CdgParser.DATA_OFFSET + 3]);
                // Only follow the first command, and not repeats (assumes no errors in stream)
                if (repeat == 0) {
                    this.imageClear(color);
                    changes = true;
                }
            } else if (instruction == CdgParser.INSTRUCTION_BORDER_PRESET) {
                const color = packet[CdgParser.DATA_OFFSET + 0];
                if (this.options.verbose) console.log('INSTRUCTION_BORDER_PRESET ' + color);
                //if (this.options.verbose) console.log('... ' + packet[CdgParser.DATA_OFFSET + 1] + ', ' + packet[CdgParser.DATA_OFFSET + 2] + ', ' + packet[CdgParser.DATA_OFFSET + 3]);
                this.borderColor = color;
                changes = true;
            } else if (instruction == CdgParser.INSTRUCTION_TILE_BLOCK || instruction == CdgParser.INSTRUCTION_TILE_BLOCK_XOR) {
                const doXor = instruction == CdgParser.INSTRUCTION_TILE_BLOCK_XOR;
                const colors = [
                    packet[CdgParser.DATA_OFFSET + 0],
                    packet[CdgParser.DATA_OFFSET + 1],
                ];
                const row = packet[CdgParser.DATA_OFFSET + 2];
                const column = packet[CdgParser.DATA_OFFSET + 3];
                if (this.options.verbose) console.log('INSTRUCTION_TILE_BLOCK ' + (doXor ? 'XOR' : ' Normal') + ' @(' + column + ',' + row + ') [' + colors[0] + ',' + colors[1] + ']');
                // Parse scan lines
                for (let r = 0; r < CdgParser.CDG_TILE_HEIGHT; r++) {
                    const lineData = packet[CdgParser.DATA_OFFSET + 4 + r];
                    const y = row * CdgParser.CDG_TILE_HEIGHT + r;
                    for (let c = 0; c < CdgParser.CDG_TILE_WIDTH; c++) {
                        const colorValue = (lineData >> (CdgParser.CDG_TILE_WIDTH - 1 - c)) & 1;
                        const x = column * CdgParser.CDG_TILE_WIDTH + c;
                        const color = colors[colorValue];
                        this.imagePixel(x, y, color, doXor);
                    }
                    if (this.options.verbose) console.log('> @(' + (column * CdgParser.CDG_TILE_WIDTH) + ',' + y + ') ' + lineData.toString(2).padStart(6, '0').replaceAll('0', '.').replaceAll('1', '#'));
                }
                changes = {
                    x: column * CdgParser.CDG_TILE_WIDTH,
                    y: row * CdgParser.CDG_TILE_HEIGHT,
                    width: CdgParser.CDG_TILE_WIDTH,
                    height: CdgParser.CDG_TILE_HEIGHT,
                };
            } else if (instruction == CdgParser.INSTRUCTION_SCROLL_PRESET || instruction == CdgParser.INSTRUCTION_SCROLL_COPY) {
                const doCopy = instruction == CdgParser.INSTRUCTION_SCROLL_COPY;
                if (this.options.verbose) console.log('INSTRUCTION_SCROLL_PRESET ' + (doCopy ? 'COPY' : ' Normal'));
                // TODO: Scroll - color & 0x0f, hScroll (sCmd=(hScroll&0x30)>>4 where 0=no scroll, 1=6 right, 2=6 left; hOffset=(hScroll&0x07) values 0-5), vScroll (sCmd=(hScroll&0x30)>>4 where 0=no scroll, 1=12 down, 2=12 up;  vOffset=(vScroll&0x0f) values 0-11)
                if (this.options.verbose) console.log('WARNING: Scroll not implemented');
                //changes = true;
            } else if (instruction == CdgParser.INSTRUCTION_DEFINE_TRANSPARENT) {
                const color = packet[CdgParser.DATA_OFFSET + 0];
                if (this.options.verbose) console.log('INSTRUCTION_DEFINE_TRANSPARENT ' + color);
                //if (this.options.verbose) console.log('... ' + packet[CdgParser.DATA_OFFSET + 1] + ', ' + packet[CdgParser.DATA_OFFSET + 2] + ', ' + packet[CdgParser.DATA_OFFSET + 3]);
                this.setPaletteTransparent(color);
                changes = true;
            } else if (instruction == CdgParser.INSTRUCTION_LOAD_COLOR_TABLE_LOWER || instruction == CdgParser.INSTRUCTION_LOAD_COLOR_TABLE_UPPER) {
                const offset = instruction == CdgParser.INSTRUCTION_LOAD_COLOR_TABLE_UPPER ? 8 : 0;
                if (this.options.verbose) console.log('INSTRUCTION_LOAD_COLOR_TABLE ' + offset + '-' + (offset + 7));
                for (let i = 0; i < 8; i++) {
                    const high = packet[CdgParser.DATA_OFFSET + i * 2 + 0];
                    const low = packet[CdgParser.DATA_OFFSET + i * 2 + 1];
                    // 00RRRRGG 00GGBBBB
                    const r = (high >> 2) & 0x0f;
                    const g = ((high & 0x03) << 2) | ((low >> 4) & 0x03);
                    const b = low & 0x0f;
                    // Expand 4-bit value to 8-bit value
                    const red = (r << 4) | r;
                    const green = (g << 4) | g;
                    const blue = (b << 4) | b;
                    this.setPaletteEntry(offset + i, red, green, blue);
                    if (this.options.verbose) console.log('> @' + (i + offset) + ' #' + red.toString(16).padStart(2, '0') + green.toString(16).padStart(2, '0') + blue.toString(16).padStart(2, '0'));
                }
                changes = true;
            } else {
                if (this.options.verbose) console.log('WARNING: Unknown CDG instruction: ' + instruction);
            }

        } else {
            if (this.options.verbose) console.log('WARNING: Unknown subcode command: ' + command);
        }

        this.packetNumber++;

        // Normalize changes as a rectangle
        let changeRect = changes;
        if (changes === null) {
            changeRect = { x: null, y: null, width: null, height: null };
        } else if (changes === true) {
            changeRect = { x: 0, y: 0, width: CdgParser.CDG_WIDTH, height: CdgParser.CDG_HEIGHT };
        }

        // Accumulate change trackers
        if (changes) {
            for (const tracker of changeTrackers) {
                const x2 = (tracker.x ?? changeRect.x) + (tracker.width ?? changeRect.width);
                const y2 = (tracker.y ?? changeRect.y) + (tracker.height ?? changeRect.height);
                if (changeRect.x !== null) tracker.x = Math.min(tracker.x ?? changeRect.x, changeRect.x);
                if (changeRect.y !== null) tracker.y = Math.min(tracker.y ?? changeRect.y, changeRect.y);
                if (changeRect.width !== null) { tracker.width = Math.max(x2, changeRect.x + changeRect.width) - tracker.x; }
                if (changeRect.height !== null) { tracker.height = Math.max(y2, changeRect.y + changeRect.height) - tracker.y; }
            }
        }
        return changes;
    }
    
}