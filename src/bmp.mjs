// .BMP Bitmap File Writer
// Dan Jackson

// Generate a bitmap from an array of [R,G,B] or [R,G,B,A] pixels
export function BitmapGenerate(data, width, height, alpha = false) {
    const bitsPerPixel = alpha ? 32 : 24;
    const fileHeaderSize = 14;
    const bmpHeaderSizeByVersion = {
        BITMAPCOREHEADER: 12,
        BITMAPINFOHEADER: 40,
        BITMAPV2INFOHEADER: 52,
        BITMAPV3INFOHEADER: 56,
        BITMAPV4HEADER: 108,
        BITMAPV5HEADER: 124,
    };
    const version = alpha ? 'BITMAPV4HEADER' : 'BITMAPINFOHEADER'; // 'BITMAPCOREHEADER'; // V3 provides alpha on Chrome, but V4 required for Firefox
    if (!bmpHeaderSizeByVersion.hasOwnProperty(version))
        throw `Unknown BMP header version: ${version}`;
    const bmpHeaderSize = bmpHeaderSizeByVersion[version];
    const stride = 4 * Math.floor((width * Math.floor((bitsPerPixel + 7) / 8) + 3) / 4); // Byte width of each line
    const biSizeImage = stride * Math.abs(height); // Total number of bytes that will be written
    const bfOffBits = fileHeaderSize + bmpHeaderSize; // + paletteSize
    const bfSize = bfOffBits + biSizeImage;
    const buffer = new ArrayBuffer(bfSize);
    const view = new DataView(buffer);
    // Write 14-byte BITMAPFILEHEADER
    view.setUint8(0, 'B'.charCodeAt(0));
    view.setUint8(1, 'M'.charCodeAt(0)); // @0 WORD bfType
    view.setUint32(2, bfSize, true); // @2 DWORD bfSize
    view.setUint16(6, 0, true); // @6 WORD bfReserved1
    view.setUint16(8, 0, true); // @8 WORD bfReserved2
    view.setUint32(10, bfOffBits, true); // @10 DWORD bfOffBits
    if (bmpHeaderSize == bmpHeaderSizeByVersion.BITMAPCOREHEADER) { // (14+12=26) BITMAPCOREHEADER
        view.setUint32(14, bmpHeaderSize, true); // @14 DWORD biSize
        view.setUint16(18, width, true); // @18 WORD biWidth
        view.setInt16(20, height, true); // @20 WORD biHeight
        view.setUint16(22, 1, true); // @26 WORD biPlanes
        view.setUint16(24, bitsPerPixel, true); // @28 WORD biBitCount
    }
    else if (bmpHeaderSize >= bmpHeaderSizeByVersion.BITMAPINFOHEADER) { // (14+40=54) BITMAPINFOHEADER
        view.setUint32(14, bmpHeaderSize, true); // @14 DWORD biSize
        view.setUint32(18, width, true); // @18 DWORD biWidth
        view.setInt32(22, height, true); // @22 DWORD biHeight
        view.setUint16(26, 1, true); // @26 WORD biPlanes
        view.setUint16(28, bitsPerPixel, true); // @28 WORD biBitCount
        view.setUint32(30, alpha ? 3 : 0, true); // @30 DWORD biCompression (0=BI_RGB, 3=BI_BITFIELDS, 6=BI_ALPHABITFIELDS on Win-CE-5)
        view.setUint32(34, biSizeImage, true); // @34 DWORD biSizeImage
        view.setUint32(38, 2835, true); // @38 DWORD biXPelsPerMeter
        view.setUint32(42, 2835, true); // @42 DWORD biYPelsPerMeter
        view.setUint32(46, 0, true); // @46 DWORD biClrUsed
        view.setUint32(50, 0, true); // @50 DWORD biClrImportant
    }
    if (bmpHeaderSize >= bmpHeaderSizeByVersion.BITMAPV2INFOHEADER) { // (14+52=66) BITMAPV2INFOHEADER (+RGB BI_BITFIELDS)
        view.setUint32(54, alpha ? 0x00ff0000 : 0x00000000, true); // @54 DWORD bRedMask
        view.setUint32(58, alpha ? 0x0000ff00 : 0x00000000, true); // @58 DWORD bGreenMask
        view.setUint32(62, alpha ? 0x000000ff : 0x00000000, true); // @62 DWORD bBlueMask
    }
    if (bmpHeaderSize >= bmpHeaderSizeByVersion.BITMAPV3INFOHEADER) { // (14+56=70) BITMAPV3INFOHEADER (+A BI_BITFIELDS)
        view.setUint32(66, alpha ? 0xff000000 : 0x00000000, true); // @66 DWORD bAlphaMask
    }
    if (bmpHeaderSize >= bmpHeaderSizeByVersion.BITMAPV4HEADER) { // (14+108=122) BITMAPV4HEADER (color space and gamma correction)
        const colorSpace = "Win "; // "BGRs";       // @ 70 DWORD bCSType
        view.setUint8(70, colorSpace.charCodeAt(0));
        view.setUint8(71, colorSpace.charCodeAt(1));
        view.setUint8(72, colorSpace.charCodeAt(2));
        view.setUint8(73, colorSpace.charCodeAt(3));
        // @74 sizeof(CIEXYZTRIPLE)=36 (can be left empty for "Win ")
        view.setUint32(110, 0, true); // @110 DWORD bGammaRed
        view.setUint32(114, 0, true); // @114 DWORD bGammaGreen
        view.setUint32(118, 0, true); // @118 DWORD bGammaBlue
    }
    if (bmpHeaderSize >= bmpHeaderSizeByVersion.BITMAPV5HEADER) { // (14+124=138) BITMAPV5HEADER (ICC color profile)
        view.setUint32(122, 0x4, true); // @122 DWORD bIntent (0x1=LCS_GM_BUSINESS, 0x2=LCS_GM_GRAPHICS, 0x4=LCS_GM_IMAGES, 0x8=LCS_GM_ABS_COLORIMETRIC)
        view.setUint32(126, 0, true); // @126 DWORD bProfileData
        view.setUint32(130, 0, true); // @130 DWORD bProfileSize
        view.setUint32(134, 0, true); // @134 DWORD bReserved
    }
    // If there was one, write the palette here (fileHeaderSize + bmpHeaderSize)
    // Write pixels
    for (let y = 0; y < height; y++) {
        let offset = bfOffBits + (height - 1 - y) * stride;
        for (let x = 0; x < width; x++) {
            const value = [
                data[(y * width + x) * 4 + 0],
                data[(y * width + x) * 4 + 1],
                data[(y * width + x) * 4 + 2],
                data[(y * width + x) * 4 + 3],
            ];
            view.setUint8(offset + 0, value[2]); // B
            view.setUint8(offset + 1, value[1]); // G
            view.setUint8(offset + 2, value[0]); // R
            if (alpha) {
                view.setUint8(offset + 3, value[3]); // A
                offset += 4;
            }
            else {
                offset += 3;
            }
        }
    }
    return view;    // buffer
}

export function BitmapGenerateUri(matrix, options) {
    const bmpData = BitmapGenerate(matrix, options);
    const encoded = btoa(new Uint8Array(bmpData).reduce((data, v) => data + String.fromCharCode(v), ''))
    return 'data:image/bmp;base64,' + encoded;
}
