import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Initialize Prisma client with error logging
let prisma;

try {
  prisma = new PrismaClient({
    log: ['query', 'error', 'warn'],
  });
} catch (error) {
  console.error('Failed to initialize Prisma client:', error);
  throw error;
}

// Handle potential connection issues
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Promise Rejection:', error);
});

export const db = {
  // User operations
  user: {
    // Create a new user
    async create({ username, email, password }) {
      // Hash the password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create the user in the database
      return prisma.user.create({
        data: {
          username,
          email,
          passwordHash,
        },
      });
    },

    // Find a user by username
    async findByUsername(username) {
      return prisma.user.findUnique({
        where: { username },
      });
    },

    // Find a user by email
    async findByEmail(email) {
      return prisma.user.findUnique({
        where: { email },
      });
    },

    // Find a user by ID
    async findById(id) {
      return prisma.user.findUnique({
        where: { id },
      });
    },

    // Verify a user's password
    async verifyPassword(user, password) {
      return bcrypt.compare(password, user.passwordHash);
    },

    // Update user's post count
    async incrementPostCount(userId) {
      return prisma.user.update({
        where: { id: userId },
        data: {
          postsCount: {
            increment: 1
          }
        }
      });
    }
  },

  // Category operations
  category: {
    // Get all categories with forums
    async getAll() {
      return prisma.category.findMany({
        include: {
          forums: true
        },
        orderBy: {
          sortOrder: 'asc'
        }
      });
    },

    // Create a new category
    async create({ name, sortOrder = 0 }) {
      return prisma.category.create({
        data: {
          name,
          sortOrder
        }
      });
    }
  },

  // Forum operations
  forum: {
    // Get all forums
    async getAll() {
      return prisma.forum.findMany({
        orderBy: {
          sortOrder: 'asc'
        }
      });
    },

    // Get a forum by ID with topics
    async getById(id) {
      return prisma.forum.findUnique({
        where: { id: Number(id) },
        include: {
          topics: {
            include: {
              author: true,
              posts: {
                orderBy: {
                  createdAt: 'desc'
                },
                take: 1,
                include: {
                  author: true
                }
              }
            },
            orderBy: [
              { isSticky: 'desc' },
              { updatedAt: 'desc' }
            ]
          }
        }
      });
    },

    // Create a new forum
    async create({ title, description, categoryId, sortOrder = 0 }) {
      return prisma.forum.create({
        data: {
          title,
          description,
          sortOrder,
          category: {
            connect: { id: Number(categoryId) }
          }
        }
      });
    },

    // Update forum post and topic counts
    async incrementCounts(forumId, incrementTopics = false) {
      return prisma.forum.update({
        where: { id: Number(forumId) },
        data: {
          postsCount: {
            increment: 1
          },
          topicsCount: incrementTopics ? {
            increment: 1
          } : undefined
        }
      });
    }
  },

  // Topic operations
  topic: {
    // Get a topic by ID with posts
    async getById(id) {
      return prisma.topic.findUnique({
        where: { id: Number(id) },
        include: {
          forum: true,
          author: true,
          posts: {
            include: {
              author: true
            },
            orderBy: {
              createdAt: 'asc'
            }
          }
        }
      });
    },

    // Create a new topic with initial post
    async create({ title, content, forumId, authorId, isSticky = false, isLocked = false }) {
      // Create the topic and the first post in a transaction
      return prisma.$transaction(async (tx) => {
        // Create the topic
        const topic = await tx.topic.create({
          data: {
            title,
            forumId: Number(forumId),
            authorId: Number(authorId),
            isSticky,
            isLocked
          }
        });

        // Create the first post
        await tx.post.create({
          data: {
            content,
            authorId: Number(authorId),
            topicId: topic.id
          }
        });

        // Update forum counts
        await tx.forum.update({
          where: { id: Number(forumId) },
          data: {
            topicsCount: { increment: 1 },
            postsCount: { increment: 1 }
          }
        });

        // Update user post count
        await tx.user.update({
          where: { id: Number(authorId) },
          data: {
            postsCount: { increment: 1 }
          }
        });

        return topic;
      });
    },

    // Increment view count
    async incrementViews(id) {
      return prisma.topic.update({
        where: { id: Number(id) },
        data: {
          views: {
            increment: 1
          }
        }
      });
    },

    // Toggle sticky status
    async toggleSticky(id) {
      const topic = await prisma.topic.findUnique({
        where: { id: Number(id) }
      });

      return prisma.topic.update({
        where: { id: Number(id) },
        data: {
          isSticky: !topic.isSticky
        }
      });
    },

    // Toggle locked status
    async toggleLocked(id) {
      const topic = await prisma.topic.findUnique({
        where: { id: Number(id) }
      });

      return prisma.topic.update({
        where: { id: Number(id) },
        data: {
          isLocked: !topic.isLocked
        }
      });
    }
  },

  // Post operations
  post: {
    // Get a post by ID
    async getById(id) {
      return prisma.post.findUnique({
        where: { id: Number(id) },
        include: {
          author: true,
          topic: true
        }
      });
    },

    // Create a new post
    async create({ content, topicId, authorId }) {
      // Create post and update counts in a transaction
      return prisma.$transaction(async (tx) => {
        // Get the topic to find its forumId
        const topic = await tx.topic.findUnique({
          where: { id: Number(topicId) },
          select: { forumId: true }
        });

        // Create the post
        const post = await tx.post.create({
          data: {
            content,
            authorId: Number(authorId),
            topicId: Number(topicId)
          }
        });

        // Update topic's updatedAt timestamp
        await tx.topic.update({
          where: { id: Number(topicId) },
          data: { updatedAt: new Date() }
        });

        // Update forum post count
        await tx.forum.update({
          where: { id: topic.forumId },
          data: {
            postsCount: { increment: 1 }
          }
        });

        // Update user post count
        await tx.user.update({
          where: { id: Number(authorId) },
          data: {
            postsCount: { increment: 1 }
          }
        });

        return post;
      });
    },

    // Edit a post
    async edit({ id, content }) {
      return prisma.post.update({
        where: { id: Number(id) },
        data: {
          content,
          isEdited: true,
          editedAt: new Date()
        }
      });
    }
  }
};

// Export the Prisma client for direct access if needed
export { prisma };