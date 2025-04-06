import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Initialize Prisma client with error handling and retries
let prisma;

try {
  prisma = new PrismaClient({
    log: ['error', 'warn'],
    errorFormat: 'pretty',
  });

  // Test the connection
  prisma.$connect()
    .then(() => {
      console.log('Connected to database successfully');
    })
    .catch((error) => {
      console.error('Failed to connect to database:', error);
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

    // Find all users
    async findMany(options = {}) {
      return prisma.user.findMany(options);
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

    // Find posts by user ID
    async findUserPosts(userId) {
      return prisma.post.findMany({
        where: {
          authorId: Number(userId)
        },
        include: {
          topic: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      });
    },

    // Create a new post
    async create({ content, topicId, authorId, parentId = null }) {
      // Create post and update counts in a transaction
      return prisma.$transaction(async (tx) => {
        // Get the topic to find its forumId
        const topic = await tx.topic.findUnique({
          where: { id: Number(topicId) },
          select: { forumId: true, authorId: true }
        });

        // Create the post
        const post = await tx.post.create({
          data: {
            content,
            authorId: Number(authorId),
            topicId: Number(topicId),
            parentId: parentId ? Number(parentId) : null
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

        // Create notification for the topic author if this is a reply to their topic
        // and the reply author is not the topic author
        if (topic.authorId !== Number(authorId)) {
          await tx.notification.create({
            data: {
              type: 'reply',
              content: 'Someone replied to your topic',
              userId: topic.authorId,
              link: `/topics/${topicId}`
            }
          });
        }

        // Create notification if this is a reply to a specific post
        if (parentId) {
          const parentPost = await tx.post.findUnique({
            where: { id: Number(parentId) },
            select: { authorId: true }
          });

          // Only notify if the reply author is not the parent post author
          if (parentPost && parentPost.authorId !== Number(authorId)) {
            await tx.notification.create({
              data: {
                type: 'reply',
                content: 'Someone replied to your post',
                userId: parentPost.authorId,
                link: `/topics/${topicId}#post-${post.id}`
              }
            });
          }
        }

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
  },

  // Message operations
  message: {
    // Create a new message
    async create({ subject, content, senderId, receiverId }) {
      // Create message and notification in a transaction
      return prisma.$transaction(async (tx) => {
        // Create the message
        const message = await tx.message.create({
          data: {
            subject,
            content,
            senderId: Number(senderId),
            receiverId: Number(receiverId)
          }
        });

        // Create notification for receiver
        await tx.notification.create({
          data: {
            type: 'message',
            content: `New message: ${subject}`,
            userId: Number(receiverId),
            link: `/messages/inbox/${message.id}`
          }
        });

        return message;
      });
    },

    // Get inbox messages for a user
    async getInbox(userId) {
      return prisma.message.findMany({
        where: {
          receiverId: Number(userId)
        },
        include: {
          sender: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    },

    // Get sent messages for a user
    async getSent(userId) {
      return prisma.message.findMany({
        where: {
          senderId: Number(userId)
        },
        include: {
          receiver: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    },

    // Get a single message by ID
    async getById(id, userId) {
      const message = await prisma.message.findUnique({
        where: { id: Number(id) },
        include: {
          sender: true,
          receiver: true
        }
      });

      // Verify that the user requesting the message is either the sender or receiver
      if (message && (message.senderId === Number(userId) || message.receiverId === Number(userId))) {
        // Mark as read if the user is the receiver and it's unread
        if (message.receiverId === Number(userId) && !message.isRead) {
          await prisma.message.update({
            where: { id: Number(id) },
            data: { isRead: true }
          });
        }
        return message;
      }

      return null;
    }
  },

  // Notification operations
  notification: {
    // Get notifications for a user
    async getForUser(userId) {
      return prisma.notification.findMany({
        where: {
          userId: Number(userId)
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    },

    // Mark a notification as read
    async markAsRead(id) {
      return prisma.notification.update({
        where: { id: Number(id) },
        data: { isRead: true }
      });
    },

    // Mark all notifications as read for a user
    async markAllAsRead(userId) {
      return prisma.notification.updateMany({
        where: {
          userId: Number(userId),
          isRead: false
        },
        data: { isRead: true }
      });
    },

    // Get unread notification count for a user
    async getUnreadCount(userId) {
      return prisma.notification.count({
        where: {
          userId: Number(userId),
          isRead: false
        }
      });
    }
  }
};

// Export the Prisma client for direct access if needed
export { prisma };