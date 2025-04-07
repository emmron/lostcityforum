import { db as astroDB } from 'astro:db';
import bcrypt from 'bcryptjs';

// Log connection status
console.log('Astro DB initialized');

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
      return astroDB.insert('User').values({
        username,
        email,
        passwordHash,
      }).returning();
    },

    // Find all users
    async findMany(options = {}) {
      return astroDB.select().from('User');
    },

    // Find a user by username
    async findByUsername(username) {
      const users = await astroDB.select().from('User').where({ username });
      return users.length > 0 ? users[0] : null;
    },

    // Find a user by email
    async findByEmail(email) {
      const users = await astroDB.select().from('User').where({ email });
      return users.length > 0 ? users[0] : null;
    },

    // Find a user by ID
    async findById(id) {
      const users = await astroDB.select().from('User').where({ id });
      return users.length > 0 ? users[0] : null;
    },

    // Verify a user's password
    async verifyPassword(user, password) {
      return bcrypt.compare(password, user.passwordHash);
    },

    // Update user's post count
    async incrementPostCount(userId) {
      const user = await this.findById(userId);
      return astroDB.update('User').set({
        postsCount: user.postsCount + 1
      }).where({ id: userId });
    }
  },

  // Category operations
  category: {
    // Get all categories with forums
    async getAll() {
      const categories = await astroDB.select().from('Category').orderBy({ sortOrder: 'asc' });

      // Get forums for each category
      for (const category of categories) {
        category.forums = await astroDB.select().from('Forum').where({ categoryId: category.id });
      }

      return categories;
    },

    // Create a new category
    async create({ name, sortOrder = 0 }) {
      return astroDB.insert('Category').values({
        name,
        sortOrder
      }).returning();
    }
  },

  // Forum operations
  forum: {
    // Get all forums
    async getAll() {
      return astroDB.select().from('Forum').orderBy({ sortOrder: 'asc' });
    },

    // Get a forum by ID with topics
    async getById(id) {
      const forums = await astroDB.select().from('Forum').where({ id: Number(id) });

      if (forums.length === 0) return null;

      const forum = forums[0];

      // Get topics
      const topics = await astroDB.select().from('Topic').where({ forumId: Number(id) });

      // Get author for each topic
      for (const topic of topics) {
        topic.author = await db.user.findById(topic.authorId);

        // Get latest post for each topic
        const posts = await astroDB.select().from('Post')
          .where({ topicId: topic.id })
          .orderBy({ createdAt: 'desc' })
          .limit(1);

        topic.posts = posts;

        if (posts.length > 0) {
          posts[0].author = await db.user.findById(posts[0].authorId);
        }
      }

      // Sort topics by sticky first, then by updatedAt
      topics.sort((a, b) => {
        if (a.isSticky !== b.isSticky) return b.isSticky ? 1 : -1;
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      });

      forum.topics = topics;

      return forum;
    },

    // Create a new forum
    async create({ title, description, categoryId, sortOrder = 0 }) {
      return astroDB.insert('Forum').values({
        title,
        description,
        sortOrder,
        categoryId: Number(categoryId)
      }).returning();
    },

    // Update forum post and topic counts
    async incrementCounts(forumId, incrementTopics = false) {
      const forum = await astroDB.select().from('Forum').where({ id: Number(forumId) }).limit(1);

      if (forum.length === 0) return null;

      const updateData = {
        postsCount: forum[0].postsCount + 1
      };

      if (incrementTopics) {
        updateData.topicsCount = forum[0].topicsCount + 1;
      }

      return astroDB.update('Forum').set(updateData).where({ id: Number(forumId) });
    }
  },

  // Topic operations
  topic: {
    // Get a topic by ID with posts
    async getById(id) {
      const topics = await astroDB.select().from('Topic').where({ id: Number(id) });

      if (topics.length === 0) return null;

      const topic = topics[0];

      // Get forum details
      const forums = await astroDB.select().from('Forum').where({ id: topic.forumId });
      topic.forum = forums.length > 0 ? forums[0] : null;

      // Get author details
      topic.author = await db.user.findById(topic.authorId);

      // Get posts
      const posts = await astroDB.select().from('Post')
        .where({ topicId: Number(id) })
        .orderBy({ createdAt: 'asc' });

      // Get author for each post
      for (const post of posts) {
        post.author = await db.user.findById(post.authorId);
      }

      topic.posts = posts;

      return topic;
    },

    // Create a new topic with initial post
    async create({ title, content, forumId, authorId, isSticky = false, isLocked = false }) {
      // Create the topic
      const newTopic = await astroDB.insert('Topic').values({
        title,
        forumId: Number(forumId),
        authorId: Number(authorId),
        isSticky,
        isLocked
      }).returning();

      const topic = newTopic[0];

      // Create the first post
      await astroDB.insert('Post').values({
        content,
        authorId: Number(authorId),
        topicId: topic.id
      });

      // Update forum counts
      await astroDB.update('Forum').set({
        topicsCount: { increment: 1 },
        postsCount: { increment: 1 }
      }).where({ id: Number(forumId) });

      // Update user post count
      await db.user.incrementPostCount(Number(authorId));

      return topic;
    },

    // Increment view count
    async incrementViews(id) {
      const topics = await astroDB.select().from('Topic').where({ id: Number(id) });

      if (topics.length === 0) return null;

      return astroDB.update('Topic').set({
        views: topics[0].views + 1
      }).where({ id: Number(id) });
    },

    // Toggle sticky status
    async toggleSticky(id) {
      const topics = await astroDB.select().from('Topic').where({ id: Number(id) });

      if (topics.length === 0) return null;

      return astroDB.update('Topic').set({
        isSticky: !topics[0].isSticky
      }).where({ id: Number(id) });
    },

    // Toggle locked status
    async toggleLocked(id) {
      const topics = await astroDB.select().from('Topic').where({ id: Number(id) });

      if (topics.length === 0) return null;

      return astroDB.update('Topic').set({
        isLocked: !topics[0].isLocked
      }).where({ id: Number(id) });
    }
  },

  // Post operations
  post: {
    // Get a post by ID
    async getById(id) {
      const posts = await astroDB.select().from('Post').where({ id: Number(id) });

      if (posts.length === 0) return null;

      const post = posts[0];

      // Get author
      post.author = await db.user.findById(post.authorId);

      // Get topic
      const topics = await astroDB.select().from('Topic').where({ id: post.topicId });
      post.topic = topics.length > 0 ? topics[0] : null;

      return post;
    },

    // Find posts by user ID
    async findUserPosts(userId) {
      const posts = await astroDB.select().from('Post')
        .where({ authorId: Number(userId) })
        .orderBy({ createdAt: 'desc' })
        .limit(10);

      // Get topic for each post
      for (const post of posts) {
        const topics = await astroDB.select().from('Topic').where({ id: post.topicId });
        post.topic = topics.length > 0 ? topics[0] : null;
      }

      return posts;
    },

    // Create a new post
    async create({ content, topicId, authorId, parentId = null }) {
      // Get the topic to find its forumId
      const topics = await astroDB.select().from('Topic').where({ id: Number(topicId) });

      if (topics.length === 0) return null;

      const topic = topics[0];

      // Create the post
      const newPost = await astroDB.insert('Post').values({
        content,
        authorId: Number(authorId),
        topicId: Number(topicId),
        parentId: parentId ? Number(parentId) : null
      }).returning();

      const post = newPost[0];

      // Update topic's updatedAt timestamp
      await astroDB.update('Topic').set({
        updatedAt: new Date()
      }).where({ id: Number(topicId) });

      // Update forum post count
      await astroDB.update('Forum').set({
        postsCount: { increment: 1 }
      }).where({ id: topic.forumId });

      // Update user post count
      await db.user.incrementPostCount(Number(authorId));

      // Create notification for the topic author if this is a reply to their topic
      // and the reply author is not the topic author
      if (topic.authorId !== Number(authorId)) {
        await astroDB.insert('Notification').values({
          type: 'reply',
          content: 'Someone replied to your topic',
          userId: topic.authorId,
          link: `/topics/${topicId}`
        });
      }

      // Create notification if this is a reply to a specific post
      if (parentId) {
        const parentPosts = await astroDB.select().from('Post').where({ id: Number(parentId) });

        if (parentPosts.length > 0 && parentPosts[0].authorId !== Number(authorId)) {
          await astroDB.insert('Notification').values({
            type: 'reply',
            content: 'Someone replied to your post',
            userId: parentPosts[0].authorId,
            link: `/topics/${topicId}#post-${post.id}`
          });
        }
      }

      return post;
    },

    // Edit a post
    async edit({ id, content }) {
      return astroDB.update('Post').set({
        content,
        isEdited: true,
        editedAt: new Date()
      }).where({ id: Number(id) });
    }
  },

  // Message operations
  message: {
    // Create a new message
    async create({ subject, content, senderId, receiverId }) {
      // Create the message
      const newMessage = await astroDB.insert('Message').values({
        subject,
        content,
        senderId: Number(senderId),
        receiverId: Number(receiverId)
      }).returning();

      const message = newMessage[0];

      // Create notification for receiver
      await astroDB.insert('Notification').values({
        type: 'message',
        content: `New message: ${subject}`,
        userId: Number(receiverId),
        link: `/messages/inbox/${message.id}`
      });

      return message;
    },

    // Get inbox messages for a user
    async getInbox(userId) {
      const messages = await astroDB.select().from('Message')
        .where({ receiverId: Number(userId) })
        .orderBy({ createdAt: 'desc' });

      // Get sender for each message
      for (const message of messages) {
        message.sender = await db.user.findById(message.senderId);
      }

      return messages;
    },

    // Get sent messages for a user
    async getSent(userId) {
      const messages = await astroDB.select().from('Message')
        .where({ senderId: Number(userId) })
        .orderBy({ createdAt: 'desc' });

      // Get receiver for each message
      for (const message of messages) {
        message.receiver = await db.user.findById(message.receiverId);
      }

      return messages;
    },

    // Get a single message by ID
    async getById(id, userId) {
      const messages = await astroDB.select().from('Message').where({ id: Number(id) });

      if (messages.length === 0) return null;

      const message = messages[0];

      // Get sender and receiver
      message.sender = await db.user.findById(message.senderId);
      message.receiver = await db.user.findById(message.receiverId);

      // Verify that the user requesting the message is either the sender or receiver
      if (message && (message.senderId === Number(userId) || message.receiverId === Number(userId))) {
        // Mark as read if the user is the receiver and it's unread
        if (message.receiverId === Number(userId) && !message.isRead) {
          await astroDB.update('Message').set({
            isRead: true
          }).where({ id: Number(id) });
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
      return astroDB.select().from('Notification')
        .where({ userId: Number(userId) })
        .orderBy({ createdAt: 'desc' });
    },

    // Mark a notification as read
    async markAsRead(id) {
      return astroDB.update('Notification').set({
        isRead: true
      }).where({ id: Number(id) });
    },

    // Mark all notifications as read for a user
    async markAllAsRead(userId) {
      return astroDB.update('Notification').set({
        isRead: true
      }).where({
        userId: Number(userId),
        isRead: false
      });
    },

    // Get unread notification count for a user
    async getUnreadCount(userId) {
      const result = await astroDB.select().from('Notification')
        .where({
          userId: Number(userId),
          isRead: false
        });

      return result.length;
    }
  }
};