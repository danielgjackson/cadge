// .CDG Analyzer
// Dan Jackson, 2025

import { CdgParser } from './cdg-parser.mjs';

const defaultOptions = {
    backgroundLumaSimilarity: 0.094, // Treat as background if within this threshold
    foregroundSimilarity: 0.02,     // Treat as the same colour (should be a small difference)
    dilateRadius: 2,                // Number of pixels to dilate for row grouping
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
        this.rowGroups = {};        // .start .end
        this.groupIdCounter = 0;
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

    // Aggregate rectangle changes
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

    // Analyze rows to determine information about foreground pixels
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
    
    // Analyze rows to determine groups and group changes
    analyzeRowGroups() {
        // Start with no group assignments
        if (!this.rowInGroup) {
            this.rowInGroup = new Array(CdgParser.CDG_HEIGHT);
            this.prevRowInGroup = new Array(CdgParser.CDG_HEIGHT);
        }

        // Set rows with foreground pixels as part of a group
        for (let row = 0; row < CdgParser.CDG_HEIGHT; row++) {
            this.rowInGroup[row] = (this.rowStats[row].foreground > 0);
        }

        // Dilate
        for (let i = 0; i < this.options.dilateRadius; i++) {
            this.prevRowInGroup.set(this.rowInGroup);
            for (let row = 0; row < CdgParser.CDG_HEIGHT; row++) {
                this.rowInGroup[row] = (row > 0 && this.prevRowInGroup[row - 1]) || this.prevRowInGroup[row] || (row < CdgParser.CDG_HEIGHT - 1 && this.prevRowInGroup[row + 1]);
            }
        }

        // Map of lines to previous group
        if (!this.previousGroup) {
            this.previousGroup = new Array(CdgParser.CDG_HEIGHT);
        }
        this.previousGroup.fill(null);
        for (const group in this.rowGroups) {
            for (let row = this.rowGroups[group].start; row <= this.rowGroups[group].end; row++) {
                this.previousGroup[row] = group;
            }
        }

        // Determine row groups
        const newGroups = [];
        const previousGroupsOverlapped = {};
        let inGroup = null;
        for (let row = 0; row <= CdgParser.CDG_HEIGHT; row++) { // overshoot last row on purpose to detect groups up to last line
            // If should be in a group...
            if (row < CdgParser.CDG_HEIGHT && this.rowInGroup[row]) {
                // ...but not yet in a group, start a new group
                if (inGroup == null) {
                    inGroup = {
                        id: null,
                        start: row,
                        end: null,
                        previousGroupMapping: {},
                    };
                    newGroups.push(inGroup);
                }
            } else {    // If should not be in a group
                // ...but in a group
                if (inGroup) {
                    //inGroup.end = row - 1;
                    inGroup = null;
                }
            }

            // Update group mapping to previous group(s)
            if (inGroup) {
                inGroup.end = row;
                const previousId = this.previousGroup[row].id;
                inGroup.previousGroupMapping[previousId] = previousId;
                previousGroupsOverlapped[previousId] = true;
            }
        }

        // Group deletions -- no overlapping groups, or multiple overlapping groups (split)
        const groupDeletions = {};
        // Group deletions: split groups
        for (const group of newGroups) {
            if (Object.entries(group.previousGroupMapping).length > 1) {
                Object.entries(group.previousGroupMapping).map(([previousId, _]) => { groupDeletions[previousId] = previousId; });
            }
        }
        // Group deletions: no new group overlaps
        for (const group of this.rowGroups) {
            if (!previousGroupsOverlapped[group.id]) {
                groupDeletions[previousId] = group;
            }
        }
        // Group deletions: remove deleted split groups
        for (const groupId in groupDeletions) {
            for (const group of newGroups) {
                delete group.previousGroupMapping[groupId];
            }
        }

        // Group additions: where no previous group is detected (or previous group deleted because of split)
        const groupAdditions = {};
        const groupChanges = {};
        for (const group of newGroups) {
            if (Object.entries(group.previousGroupMapping).length == 0) {
                // Newly added group
                group.id = this.groupIdCounter++;
                groupAdditions[group.id] = group;
            } else if (Object.entries(group.previousGroupMapping).length == 1) {
                // Existing mapped group
                const previousId = Object.keys(group.previousGroupMapping)[0];
                //group.id = previousId;
                const existingGroup = this.rowGroups[previousId];
                existingGroup.start = group.start;
                existingGroup.end = group.end;
                let changed = false;
                if (group.start < existingGroup.minStart) {
                    existingGroup.minStart = group.start;
                    changed = true;
                }
                if (group.end > existingGroup.maxEnd) {
                    existingGroup.maxEnd = group.end;
                    changed = true;
                }
                if (changed) {
                    groupChanges[previousId] = existingGroup;
                }
            } else {
                throw new Error('Unexpected split group not already handled');
            }
        }
        
        return {
            "del": groupDeletions,
            "chg": groupChanges,
            "add": groupAdditions,
        };
    }

    updateTileStats(result) {
        if (!result.newTile) return null;
        // Stats for each row of the new tile
        newTileStats = new Array(CdgParser.CDG_TILE_HEIGHT).fill();
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
        return newTileStats;
    }

    analyzeGroupTileChanges(newTileStats) {
        if (newTileStats == null) { return []; }
        const groupTileChanges = [];
        for (const group in this.rowGroups) {
            let firstRow = group.start - newTileStats.y;
            let lastRow = group.end - newTileStats.y;
            if (firstRow < 0) firstRow = 0;
            if (lastRow > CdgParser.CDG_TILE_HEIGHT - 1) lastRow = CdgParser.CDG_TILE_HEIGHT - 1;
            if (firstRow > CdgParser.CDG_TILE_HEIGHT - 1 || lastRow < 0) {
                continue;
            }
            const groupStats = {
                group,
                add: { count: 0, start: null, end: null, },
                del: { count: 0, start: null, end: null, },
                chg: { count: 0, start: null, end: null, },
            };
            for (let r = firstRow; r <= lastRow; r++) {
                const rowStats = newTileStats[r];
                if (rowStats.add.count > 0) {
                    groupStats.add.count += rowStats.add.count;
                    if (groupStats.add.start == null || groupStats.add.start > rowStats.add.start) groupStats.add.start = rowStats.add.start;
                    if (groupStats.add.end == null || groupStats.add.end < rowStats.add.end) groupStats.add.end = rowStats.add.end;
                }
                if (rowStats.del.count > 0) {
                    groupStats.del.count += rowStats.del.count;
                    if (groupStats.del.start == null || groupStats.del.start > rowStats.del.start) groupStats.del.start = rowStats.del.start;
                    if (groupStats.del.end == null || groupStats.del.end < rowStats.del.end) groupStats.del.end = rowStats.del.end;
                }
                if (rowStats.chg.count > 0) {
                    groupStats.chg.count += rowStats.chg.count;
                    if (groupStats.chg.start == null || groupStats.chg.start > rowStats.chg.start) groupStats.chg.start = rowStats.chg.start;
                    if (groupStats.chg.end == null || groupStats.chg.end < rowStats.chg.end) groupStats.chg.end = rowStats.chg.end;
                }
            }
            groupTileChanges.push(groupStats);
        }
        return groupTileChanges;
    }

    step(changeTrackers = []) {
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
            const newTileStats = updateTileStats(result);

            // Update row stats
            if (result.changeRect.y != null) {
                this.updateRowStats(result.changeRect.y, result.changeRect.y + result.changeRect.height - 1);
            }

            // Check for group-based tile changes
            result.groupTileChanges = this.analyzeGroupTileChanges(newTileStats);

            // Analyze row groups
            result.groupChanges = this.analyzeRowGroups();
        } else {
            // Last packet: delete any remaining groups
            result.groupTileChanges = [];
            result.groupChanges = {
                del: Object.fromEntries(Object.entries(this.rowGroups)),
                add: {},
                chg: {},
            };
        }
        return result;
    }


    // TODO: Apply group tile changes: step.groupTileChange .group .add .del .chg
    // TODO: Handle group deletions: step.groupChanges.del
    // TODO: Handle group changes: step.groupChanges.chg
    // TODO: Handle group additions: step.groupChanges.add


}
