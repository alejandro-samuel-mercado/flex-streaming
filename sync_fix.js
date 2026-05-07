const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  console.log('🚀 Sincronizando contenidos...');
  const pending = await prisma.content.findMany({
    where: { status: 'PENDING' },
    include: { 
      videoFiles: { where: { status: 'COMPLETED' } },
      seasons: { include: { episodes: { include: { videoFiles: { where: { status: 'COMPLETED' } } } } } }
    }
  });
  for (const c of pending) {
    const hasVideo = c.videoFiles.length > 0 || c.seasons.some(s => s.episodes.some(e => e.videoFiles.length > 0));
    if (hasVideo) {
      await prisma.content.update({ where: { id: c.id }, data: { status: 'READY' } });
      console.log('✅ ' + c.slug + ' ahora está READY');
    }
  }
}
run().finally(() => prisma.$disconnect());
