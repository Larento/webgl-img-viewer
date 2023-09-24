import { main } from './canvas';

const image = new Image();
image.src = 'giraffe-bread.jpg';
image.onload = () => {
    main();
};
