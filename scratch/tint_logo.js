const sharp = require('/home/ale/Documentos/PROYECTOS/PELIPLUS/flex-streaming-api/node_modules/sharp');
const path = require('path');

const input = '/home/ale/Documentos/PROYECTOS/PELIPLUS/flex-streaming/public/logo-nuba.png';
const output = '/home/ale/Documentos/PROYECTOS/PELIPLUS/flex-streaming/public/logo-nuba-red.png';

sharp(input)
    .modulate({
        hue: 0,
        saturation: 1.5,
        brightness: 1
    })
    .tint({ r: 255, g: 50, b: 50 }) // Deep reddish tint
    .toFile(output)
    .then(() => console.log('Logo tinted successfully'))
    .catch(err => console.error('Error tinting logo:', err));
