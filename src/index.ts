import { ImageCanvas } from '@/classes/image-canvas';

(async () => {
    let imageCanvas: ImageCanvas;
    const canvasElement: HTMLCanvasElement | null = document.querySelector('#context');
    if (canvasElement) {
        imageCanvas = new ImageCanvas(canvasElement);
        await imageCanvas.loadImage('images/giraffe-bread.jpg');
    }

    document.addEventListener('keydown', (event) => {
        const key = event.key;
        switch (key) {
            case '=':
                imageCanvas?.zoomIn();
                break;
            case '-':
                imageCanvas?.zoomOut();
                break;
            case ',':
                imageCanvas?.rotateAntiClockwise();
                break;
            case '.':
                imageCanvas?.rotateClockwise();
                break;
            case 'ArrowLeft':
                imageCanvas?.moveLeft();
                break;
            case 'ArrowRight':
                imageCanvas?.moveRight();
                break;
            case 'ArrowUp':
                imageCanvas?.moveUp();
                break;
            case 'ArrowDown':
                imageCanvas?.moveDown();
                break;
        }
    });
})();
