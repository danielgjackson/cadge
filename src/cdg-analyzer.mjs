// .CDG Analyzer
// Dan Jackson, 2025

import { CdgParser } from './cdg-parser.mjs';

const defaultOptions = {
    backgroundLumaSimilarity: 0.094, // Treat as background if within this threshold
    foregroundSimilarity: 0.02,     // Treat as the same colour (should be a small difference)
};

export class CdgAnalyzer {

    constructor(parser, options = {}) {
        this.parser = parser;
        this.options = Object.assign(defaultOptions, options);
        this.paletteBackground = (new Array(CdgParser.CDG_COLORS)).fill(false);
        this.paletteSimilarity = new Array(CdgParser.CDG_COLORS).fill().map(() => (new Array(CdgParser.CDG_COLORS)).fill(false));
        this.paletteChanged();
        this.updateRowStats();
        this.newTileStats = null;
    }
    
    colorLuminance(rgb) {
        if (rgb == null) return null;
        return (rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114) / 255;
    }

    colorDifference(rgbA, rgbB) {
        if (rgbA == null || rgbB == null) return null;
        // Euclidean distance is not perceptually uniform -- consider, e.g. LAB distance
        const distance = Math.sqrt((rgbA.r - rgbB.r) ** 2 + (rgbA.g - rgbB.g) ** 2 + (rgbA.b - rgbB.b) ** 2) / Math.sqrt(255 ** 2 + 255 ** 2 + 255 ** 2);
        return distance;
    }


    paletteChanged() {
        // Determine which palette entries are similar to the "background"
        let rgbBackground = this.parser.getPaletteEntry(this.backgroundColor);
        let lumaBackground = this.colorLuminance(rgbBackground);
        for (let i = 0; i < CdgParser.CDG_COLORS; i++) {
            let similarToBackground = false;
            if (lumaBackground != null) {
                const luma = this.colorLuminance(this.parser.getPaletteEntry(i));
                const deltaLuma = Math.abs(luma - lumaBackground);
                if (deltaLuma <= this.options.backgroundLumaSimilarity) {
                    similarToBackground = true;
                }
            }
            this.paletteBackground[i] = similarToBackground;
        }

        // Determine which palette entries are almost identical to one another
        for (let i = 0; i < CdgParser.CDG_COLORS; i++) {
            const rgbThis = this.parser.getPaletteEntry(i);
            for (let j = 0; j < CdgParser.CDG_COLORS; j++) {
                if (i != j) {
                    const rgbOther = this.parser.getPaletteEntry(j);
                    const distance = this.colorDifference(rgbThis, rgbOther);
                    const similar = distance <= this.options.foregroundSimilarity;
                    this.paletteSimilarity[j][i] = similar;
                }
            }
        }
    }


    imageRender(rectangle, options = {}) {
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
                    index = this.parser.borderColor;
                } else {
                    const i = (y + this.parser.yOffset) * CdgParser.CDG_WIDTH + (x + this.parser.xOffset);
                    index = this.parser.image[i];
                }
                const j = (y * CdgParser.CDG_WIDTH + x) * 4;
                let rgb = this.parser.getPaletteEntry(index);

                // Monochrome-ish
                if (options.mono) {
                    const background = this.paletteBackground[index];
                    if (options.mono == 'alpha') {
                        rgb.a = background ? 0x00 : 0xff;
                    } else if (options.mono == 'visual') {
                        if (background) {
                            rgb = { r: 0x00 + rgb.r / 2, g: 0x00 + rgb.g / 2, b: 0x00 + rgb.b / 2, a: 0xff };
                        } else {
                            rgb = { r: 0xc0 + rgb.r / 4, g: 0xc0 + rgb.g / 4, b: 0xc0 + rgb.b / 4, a: 0xff };
                        }
                    } else if (options.mono == 'invert') {
                        const color = background ? 0xff : 0x00;
                        rgb = { r: color, g: color, b: color, a: 0xff };
                    } else {
                        const color = background ? 0x00 : 0xff;
                        rgb = { r: color, g: color, b: color, a: 0xff };
                    }
                }

                // Visualize alpha as checkerboard
                if (options.checkerboard) {
                    if (rgb.a < 0x80) {
                        rgb = (((x ^ y) >> 0) & 1) ? { r: 0xcc, g: 0xcc, b: 0xcc, a: 0xff } : { r: 0xaa, g: 0xaa, b: 0xaa, a: 0xff }
                    }
                }

                this.renderBuffer[j + 0] = rgb.r;
                this.renderBuffer[j + 1] = rgb.g;
                this.renderBuffer[j + 2] = rgb.b;
                this.renderBuffer[j + 3] = rgb.a;
            }
        }
        return this.renderBuffer;
    }


    updateRowStats(firstRow = null, lastRow = null) {
        if (firstRow == null) firstRow = 0;
        if (lastRow == null) lastRow = CdgParser.CDG_HEIGHT - 1;

        if (!this.rowStats) {
            this.rowStats = new Array(CdgParser.CDG_HEIGHT).fill().map(() => ({ 
                foreground: 0,
                start: null,
                end: null,
            }));
        }

        // Foreground pixels per row
        for (let row = firstRow; row <= lastRow; row++) {
            const stats = this.rowStats[row];
            stats.foreground = 0;
            stats.start = null;
            stats.end = null;
            for (let x = 0; x < CdgParser.CDG_WIDTH; x++) {
                const i = row * CdgParser.CDG_WIDTH + x;
                if (!this.paletteBackground[this.parser.image[i]]) {
                    stats.foreground++;
                    if (stats.start == null) stats.start = x;
                    stats.end = x;
                }
            }
        }
    }


    accumulateChanges(changeRect, changeTrackers = []) {
        // Accumulate change trackers
        if (changeRect && changeRect.x != null) {
            for (const tracker of changeTrackers) {
                const x2 = (tracker.x ?? changeRect.x) + (tracker.width ?? changeRect.width);
                const y2 = (tracker.y ?? changeRect.y) + (tracker.height ?? changeRect.height);
                if (changeRect.x !== null) tracker.x = Math.min(tracker.x ?? changeRect.x, changeRect.x);
                if (changeRect.y !== null) tracker.y = Math.min(tracker.y ?? changeRect.y, changeRect.y);
                if (changeRect.width !== null) { tracker.width = Math.max(x2, changeRect.x + changeRect.width) - tracker.x; }
                if (changeRect.height !== null) { tracker.height = Math.max(y2, changeRect.y + changeRect.height) - tracker.y; }
            }
        }
    }

    parseNextPacket(changeTrackers = []) {
        const result = this.parser.parseNextPacket();
        if (result) {
            this.accumulateChanges(result.changeRect, changeTrackers);
            if (result.cleared != null) {
                this.backgroundColor = result.cleared;
            }
            if (result.cleared != null || result.paletteChanged) {
                this.paletteChanged();
            }

            // Update tile
            if (result.newTile) {
                // Stats for each row of the new tile
                const newTileStats = new Array(CdgParser.CDG_TILE_HEIGHT).fill();
                for (let r = 0; r < CdgParser.CDG_TILE_HEIGHT; r++) {
                    newTileStats[r] = {
                        y: result.changes.top + r,
                        add: { count: 0, start: null, end: null, },
                        del: { count: 0, start: null, end: null, },
                        chg: { count: 0, start: null, end: null, },
                    };
                    for (let c = 0; c < CdgParser.CDG_TILE_WIDTH; c++) {
                        const x = result.changes.left + c;
                        const previous = result.oldTile[r * CdgParser.CDG_TILE_WIDTH + c];
                        const next = result.newTile[r * CdgParser.CDG_TILE_WIDTH + c];
                        if (next != previous) {
                            const wasBackground = this.paletteBackground[previous];
                            const isBackground = this.paletteBackground[next];
                            const isEquivalent = this.paletteSimilarity[next][previous];
                        
                            // Determine if this counts as a foreground addition, deletion, or change.
                            if (wasBackground && !isBackground) {
                                newTileStats[r].add.count++;
                                if (newTileStats[r].add.start == null) newTileStats[r].add.start = x;
                                newTileStats[r].add.end = x;
                            } else if (!wasBackground && isBackground) {
                                newTileStats[r].del.count++;
                                if (newTileStats[r].del.start == null) newTileStats[r].del.start = x;
                                newTileStats[r].del.end = x;
                            } else if (!wasBackground && !isBackground && !isEquivalent) {
                                newTileStats[r].chg.count++;
                                if (newTileStats[r].chg.start == null) newTileStats[r].chg.start = x;
                                newTileStats[r].chg.end = x;
                            }
                        }
                    }
                }
                
                // TODO: Analyze newTileStats
            }

            // Update row stats
            if (result.changeRect.y != null) {
                this.updateRowStats(result.changeRect.y, result.changeRect.y + result.changeRect.height - 1);
            }

            // TODO: Analyze row groups

            return result;
        }
    }

}
