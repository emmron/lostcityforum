import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'Admin' },
    update: {},
    create: {
      username: 'Admin',
      email: 'admin@lostcityforum.com',
      passwordHash: adminPassword,
      signature: 'Administrator of the Lost City Forum',
    },
  });

  console.log('Created admin user:', admin.username);

  // Create categories
  const mainCategory = await prisma.category.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Main',
      sortOrder: 1,
    },
  });

  const communityCategory = await prisma.category.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: 'Community',
      sortOrder: 2,
    },
  });

  console.log('Created categories:', mainCategory.name, communityCategory.name);

  // Create forums
  const forums = [
    {
      title: 'Official Announcements',
      description: 'Official announcements from the staff',
      categoryId: mainCategory.id,
      sortOrder: 1,
    },
    {
      title: 'Rules & Guidelines',
      description: 'Forum rules and guidelines',
      categoryId: mainCategory.id,
      sortOrder: 2,
    },
    {
      title: 'General Discussion',
      description: 'General discussion about 2004scape',
      categoryId: communityCategory.id,
      sortOrder: 1,
    },
    {
      title: 'Guides & Tutorials',
      description: 'Guides and tutorials for 2004scape',
      categoryId: communityCategory.id,
      sortOrder: 2,
    },
    {
      title: 'Technical Support',
      description: 'Technical support for 2004scape',
      categoryId: communityCategory.id,
      sortOrder: 3,
    },
    {
      title: 'Events & Meetups',
      description: 'Community events and meetups',
      categoryId: communityCategory.id,
      sortOrder: 4,
    },
    {
      title: 'Media & Screenshots',
      description: 'Share your screenshots and videos',
      categoryId: communityCategory.id,
      sortOrder: 5,
    },
    {
      title: 'Off-Topic',
      description: 'Discussions not related to 2004scape',
      categoryId: communityCategory.id,
      sortOrder: 6,
    },
  ];

  // Create each forum
  for (const forumData of forums) {
    const forum = await prisma.forum.upsert({
      where: {
        id: forums.indexOf(forumData) + 1
      },
      update: {},
      create: {
        id: forums.indexOf(forumData) + 1,
        ...forumData,
      },
    });
    console.log('Created forum:', forum.title);
  }

  // Create a welcome topic in the announcements forum
  const welcomeTopic = await prisma.topic.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      title: 'Welcome to the Lost City Forum!',
      isSticky: true,
      forumId: 1,
      authorId: admin.id,
    },
  });

  // Create the welcome post
  const welcomePost = await prisma.post.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      content: `<p>Welcome to the official 2004scape Lost City Forum!</p>
      <p>This is a place for all fans of the 2004 era of RuneScape and especially those who love the Lost City quest and content.</p>
      <p>Feel free to introduce yourself and join our community. We hope you'll find this forum helpful and enjoyable.</p>
      <p>Here are some quick links to get you started:</p>
      <ul>
        <li><a href="/forums/2">Forum Rules & Guidelines</a></li>
        <li><a href="/forums/3">General Discussion</a></li>
        <li><a href="/forums/4">Guides & Tutorials</a></li>
      </ul>
      <p>Happy posting!</p>`,
      authorId: admin.id,
      topicId: welcomeTopic.id,
    },
  });

  console.log('Created welcome topic and post');

  // Update forum counts
  await prisma.forum.update({
    where: { id: 1 },
    data: {
      topicsCount: 1,
      postsCount: 1,
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
