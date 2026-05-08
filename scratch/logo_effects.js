const sharp = require('/home/ale/Documentos/PROYECTOS/PELIPLUS/flex-streaming-api/node_modules/sharp');

const input = '/home/ale/Documentos/PROYECTOS/PELIPLUS/flex-streaming/public/logo-nuba.png';
const output = '/home/ale/Documentos/PROYECTOS/PELIPLUS/flex-streaming/public/logo-nuba-fx.png';

async function applyEffects() {
    const base = sharp(input);
    const metadata = await base.metadata();

    // Create a red glow
    const redGlow = await sharp(input)
        .extend({
            top: 20, bottom: 20, left: 20, right: 20,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .threshold(1) // Make it solid for the glow base
        .tint({ r: 255, g: 0, b: 0 })
        .blur(10)
        .toBuffer();

    // Create a blue glow (shifted slightly)
    const blueGlow = await sharp(input)
        .extend({
            top: 20, bottom: 20, left: 20, right: 20,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .threshold(1)
        .tint({ r: 0, g: 229, b: 255 })
        .blur(6)
        .toBuffer();

    // Composite them
    await sharp({
        create: {
            width: metadata.width + 40,
            height: metadata.height + 40,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
    })
    .composite([
        { input: redGlow, blend: 'screen' },
        { input: blueGlow, blend: 'screen' },
        { input: await base.toBuffer(), gravity: 'center' }
    ])
    .png()
    .toFile(output);

    console.log('Logo with effects created');
}

applyEffects().catch(console.error);
