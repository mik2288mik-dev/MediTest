import { PrismaClient, Visibility } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { id: "1000" },
    update: {},
    create: { id: "1000", username: "demo", fullName: "Demo User", avatar: null },
  });
  const poster = "https://placekitten.com/512/512";
  const media = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";
  for (let i = 0; i < 30; i++) {
    await prisma.circle.create({
      data: {
        authorId: user.id,
        mediaUrl: media,
        posterUrl: poster,
        duration: 10,
        visibility: Visibility.PUBLIC,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    });
  }
}

main().finally(async () => prisma.$disconnect());