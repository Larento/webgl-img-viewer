import { ImageCanvas } from '@/classes/image-canvas';

(async () => {
    let imageCanvas: ImageCanvas;
    const canvasElement: HTMLCanvasElement | null = document.querySelector('#context');
    const imageInputElement: HTMLInputElement | null = document.querySelector('#tools #upload-image input');

    if (canvasElement) {
        const images = [
            'images/450-300-px-img.jpg',
            'images/giraffe-bread.jpg',
            'images/aspect-ratio-test.gif',
            'images/rip-van-winkle.jpg',
        ];
        const image_src = images[Math.floor(Math.random() * images.length)];
        imageCanvas = await ImageCanvas.fromImage(canvasElement, image_src);

        imageInputElement?.addEventListener('change', (e) => {
            const reader = new FileReader();
            const element = e.target as HTMLInputElement | null;
            const file = element?.files?.[0];
            if (file) {
                reader.readAsDataURL(file);
                reader.addEventListener(
                    'load',
                    async () => {
                        imageCanvas = await ImageCanvas.fromImage(canvasElement, reader.result as string);
                    },
                    false,
                );
            }
        });
    }

    document.addEventListener('keydown', (event) => {
        switch (event.key) {
            case '0':
                imageCanvas.resetView();
                break;
            case '=':
                imageCanvas.zoomIn();
                break;
            case '-':
                imageCanvas.zoomOut();
                break;
            case ',':
                imageCanvas.rotateAntiClockwise();
                break;
            case 's':
                imageCanvas.toggleSmoothing();
                break;
            case '.':
                imageCanvas.rotateClockwise();
                break;
            case 'ArrowLeft':
                imageCanvas.moveLeft();
                break;
            case 'ArrowRight':
                imageCanvas.moveRight();
                break;
            case 'ArrowUp':
                imageCanvas.moveUp();
                break;
            case 'ArrowDown':
                imageCanvas.moveDown();
                break;
        }
    });
})();
