

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
