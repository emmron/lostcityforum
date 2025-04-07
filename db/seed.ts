import { db, User, Category, Forum, Topic, Post } from 'astro:db';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

// https://astro.build/db/seed
export default async function seed() {
	console.log('Seeding database...');

	try {
		// Create admin user
		const adminPasswordHash = await bcrypt.hash('adminpassword', 10);
		const [admin] = await db.insert(User).values({
			username: 'admin',
			email: 'admin@example.com',
			passwordHash: adminPasswordHash,
			signature: 'Forum Administrator',
			avatarUrl: '/images/avatars/admin.png',
			postsCount: 0
		}).returning();

		console.log('Created admin user:', admin.username);

		// Create main category
		const [mainCategory] = await db.insert(Category).values({
			name: 'Lost City Forum',
			sortOrder: 1
		}).returning();

		const [communityCategory] = await db.insert(Category).values({
			name: 'Community',
			sortOrder: 2
		}).returning();

		console.log('Created categories:', mainCategory.name, communityCategory.name);

		// Create forums
		const [generalForum] = await db.insert(Forum).values({
			title: 'General Discussion',
			description: 'General discussion about Lost City',
			sortOrder: 1,
			categoryId: mainCategory.id
		}).returning();

		await db.insert(Forum).values({
			title: 'Quest Help',
			description: 'Get help with the Lost City quest',
			sortOrder: 2,
			categoryId: mainCategory.id
		});

		await db.insert(Forum).values({
			title: 'Guides & Strategies',
			description: 'Guides and strategies for all aspects of the game',
			sortOrder: 3,
			categoryId: mainCategory.id
		});

		await db.insert(Forum).values({
			title: 'Introductions',
			description: 'Introduce yourself to the community',
			sortOrder: 1,
			categoryId: communityCategory.id
		});

		await db.insert(Forum).values({
			title: 'Off-Topic',
			description: 'Discussions not related to the game',
			sortOrder: 2,
			categoryId: communityCategory.id
		});

		// Create welcome topic
		const [welcomeTopic] = await db.insert(Topic).values({
			title: 'Welcome to the Lost City Forum',
			forumId: generalForum.id,
			authorId: admin.id,
			views: 0,
			isSticky: true,
			isLocked: false
		}).returning();

		// Create welcome post
		await db.insert(Post).values({
			content: 'Welcome to the Lost City Forum! This is a place to discuss all things related to the Lost City quest and the 2004 era of RuneScape.\n\nPlease read the forum rules before posting:\n\n1. Be respectful to other members\n2. No spamming or advertising\n3. Use the search function before creating new topics\n4. Stay on topic\n\nEnjoy your stay!',
			authorId: admin.id,
			topicId: welcomeTopic.id,
			isEdited: false
		});

		console.log('Created welcome topic and post');

		// Update forum counts
		await db.update(Forum)
			.set({
				topicsCount: 1,
				postsCount: 1
			})
			.where(eq(Forum.id, generalForum.id));

		// Update user post count
		await db.update(User)
			.set({
				postsCount: 1
			})
			.where(eq(User.id, admin.id));

		console.log('Database seeded successfully!');
	} catch (error) {
		console.error('Error seeding database:', error);
	}
}
