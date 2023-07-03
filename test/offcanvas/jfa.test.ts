import fs from "fs";

describe('offscreen-canvas테스트', () => {
    it("offscreen동작확인", () => {
        const canvas = new OffscreenCanvas(200, 200);
        const ctx = canvas.getContext('2d')!;
        ctx.beginPath();
        ctx.fillStyle = 'red';
        ctx.fillRect(10, 10, 20, 20);
        ctx.closePath();

        canvas.convertToBlob({ type: 'image/png' }).then(async (blob) => {
            const buffer = await blob.arrayBuffer();
            fs.writeFileSync('./test.png', Buffer.from(buffer));
        })
    });
});