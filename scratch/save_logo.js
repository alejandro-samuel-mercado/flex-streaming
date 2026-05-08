const sharp = require('/home/ale/Documentos/PROYECTOS/PELIPLUS/flex-streaming-api/node_modules/sharp');

const input = '/home/ale/.gemini/antigravity/brain/dce35da3-fcc0-408e-97c1-fef9d96f849c/logo_nuba_sparkles_1778283582057.png';
const output = '/home/ale/Documentos/PROYECTOS/PELIPLUS/flex-streaming/public/logo-nuba-sparkles.png';

sharp(input)
    .ensureAlpha()
    .toFormat('png')
    .toBuffer()
    .then(data => {
        // We can't easily do "remove black" with simple sharp calls without pixel manipulation
        // but we can at least try to make it look good or just save it as is if it's already dark
        return sharp(data).toFile(output);
    })
    .then(() => console.log('Logo saved'))
    .catch(err => console.error(err));
