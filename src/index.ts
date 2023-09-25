import { ImageCanvas } from '@/classes/image-canvas';

(async () => {
    const canvasElement: HTMLCanvasElement | null = document.querySelector('#context');
    if (canvasElement) {
        const imageCanvas = new ImageCanvas(canvasElement);
        await imageCanvas.loadImage('images/giraffe-bread.jpg');
    }
})();
