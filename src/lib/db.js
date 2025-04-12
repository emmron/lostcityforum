import { db as astroDB, User, Category, Forum, Topic, Post, Message, Notification } from 'astro:db';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// Enhanced logging function with error handling
const logOperation = (operation, details) => {
  try {
    console.log(`[DB:${operation}]`, details);
  } catch (error) {
    console.error(`[DB:Log:Error] Failed to log operation: ${operation}`, error);
  }
  return details;
};

// Add safe query execution wrapper with improved error handling
const safeQuery = async (queryName, queryFn) => {
  try {
    console.log(`[DB:Query:Start] ${queryName}`);
    const result = await queryFn();
    console.log(`[DB:Query:Success] ${queryName}`);
    return result;
  } catch (error) {
    console.error(`[DB:Query:Error] ${queryName}:`, error.message || error);
    console.error(`[DB:Query:Error:Stack] ${error.stack || 'No stack trace available'}`);
    // Rethrow with a more specific error message for better debugging
    throw new Error(`Database operation '${queryName}' failed: ${error.message || 'Unknown error'}`);
  }
};

// Safely parse IDs to numbers
const safeParseId = (id) => {
  try {
    return id ? Number(id) : null;
  } catch (error) {
    console.error(`[DB:ParseError] Failed to parse ID: ${id}`, error);
    return null;
  }
};

// Log connection status
console.log('Astro DB initialized');

// Handle potential connection issues
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Promise Rejection in database:', error);
});

export const db = {
  // User operations
  user: {
    // Create a new user
    async create({ username, email, password }) {
      if (!username || !email || !password) {
        throw new Error('Missing required fields for user creation');
      }

      console.log(`[DB:User] Creating new user: ${username}, ${email}`);
      try {
        // Hash the password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create the user in the database
        const result = await safeQuery(`User.create(${username})`, () =>
          astroDB.insert(User).values({
            username,
            email,
            passwordHash,
            postsCount: 0 // Ensure default value
          }).returning()
        );

        if (!result || result.length === 0) {
          throw new Error('User creation failed - no result returned');
        }

        logOperation('User:Create', { id: result[0]?.id, username });
        return result;
      } catch (error) {
        console.error(`[DB:User:Create:Error] ${error.message}`);
        throw error;
      }
    },

    // Find all users
    async findMany(options = {}) {
      console.log('[DB:User] Finding all users');
      try {
        const users = await safeQuery('User.findMany', () =>
          astroDB.select().from(User)
        );
        logOperation('User:FindMany', { count: users.length });
        return users;
      } catch (error) {
        console.error('[DB:User:FindMany:Error]', error);
        return [];
      }
    },

    // Find a user by username
    async findByUsername(username) {
      if (!username) return null;

      console.log(`[DB:User] Finding user by username: ${username}`);
      try {
        const users = await safeQuery(`User.findByUsername(${username})`, () =>
          astroDB.select().from(User).where({ username })
        );
        const found = users && users.length > 0;
        logOperation('User:FindByUsername', { username, found });
        return found ? users[0] : null;
      } catch (error) {
        console.error(`[DB:User:FindByUsername:Error] ${username}`, error);
        return null;
      }
    },

    // Find a user by email
    async findByEmail(email) {
      if (!email) return null;

      console.log(`[DB:User] Finding user by email: ${email}`);
      try {
        const users = await astroDB.select().from(User).where({ email });
        const found = users && users.length > 0;
        logOperation('User:FindByEmail', { email, found });
        return found ? users[0] : null;
      } catch (error) {
        console.error(`[DB:User:FindByEmail:Error] ${email}`, error);
        return null;
      }
    },

    // Find a user by ID
    async findById(id) {
      if (!id) return null;

      const userId = safeParseId(id);
      if (userId === null) return null;

      console.log(`[DB:User] Finding user by ID: ${userId}`);
      try {
        const users = await astroDB.select().from(User).where({ id: userId });
        const found = users && users.length > 0;
        logOperation('User:FindById', { id: userId, found });
        return found ? users[0] : null;
      } catch (error) {
        console.error(`[DB:User:FindById:Error] ${userId}`, error);
        return null;
      }
    },

    // Verify a user's password
    async verifyPassword(user, password) {
      if (!user || !password) return false;

      console.log(`[DB:User] Verifying password for user: ${user.username}`);
      try {
        const result = await bcrypt.compare(password, user.passwordHash);
        logOperation('User:VerifyPassword', { userId: user.id, success: result });
        return result;
      } catch (error) {
        console.error(`[DB:User:VerifyPassword:Error] ${user.id}`, error);
        return false;
      }
    },

    // Update user's post count
    async incrementPostCount(userId) {
      if (!userId) return null;

      const parsedUserId = safeParseId(userId);
      if (parsedUserId === null) return null;

      console.log(`[DB:User] Incrementing post count for user: ${parsedUserId}`);
      try {
        const user = await this.findById(parsedUserId);
        if (!user) return null;

        const newCount = (user.postsCount || 0) + 1;

        const result = await astroDB.update(User).set({
          postsCount: newCount
        }).where({ id: parsedUserId });

        logOperation('User:IncrementPostCount', { userId: parsedUserId, newCount });
        return result;
      } catch (error) {
        console.error(`[DB:User:IncrementPostCount:Error] ${parsedUserId}`, error);
        return null;
      }
    }
  },

  // Category operations
  category: {
    // Get all categories with forums
    async getAll() {
      console.log('[DB:Category] Getting all categories with forums');
      try {
        // Use a raw SQL query instead of ORM to avoid syntax errors
        const result = await astroDB.execute(`SELECT * FROM "Category" ORDER BY "sortOrder" ASC`);
        const categories = result.rows;
        console.log(`[DB:Category] Found ${categories.length} categories`);

        // Get forums for each category
        for (const category of categories) {
          if (category && category.id) {
            try {
              const forumResult = await astroDB.execute(
                `SELECT * FROM "Forum" WHERE "categoryId" = $1`,
                [category.id]
              );
              category.forums = forumResult.rows || [];
            } catch (forumError) {
              console.error(`[DB:Category:GetForums:Error] Category ID ${category.id}`, forumError);
              category.forums = [];
            }
          } else {
            console.warn(`[DB:Category:GetAll] Skipping forums for category with missing ID:`, category);
            if(category) category.forums = [];
          }
        }

        logOperation('Category:GetAll', { count: categories.length });
        return categories;
      } catch (error) {
        console.error('[DB:Category:GetAll:Error] Failed to get all categories:', error);
        return [];
      }
    },

    // Create a new category
    async create({ name, sortOrder = 0 }) {
      if (!name) {
        throw new Error('Category name is required');
      }

      console.log(`[DB:Category] Creating new category: ${name}`);
      try {
        const result = await astroDB.insert(Category).values({
          name,
          sortOrder: sortOrder || 0
        }).returning();

        logOperation('Category:Create', { id: result[0]?.id, name });
        return result;
      } catch (error) {
        console.error(`[DB:Category:Create:Error] ${name}`, error);
        throw error;
      }
    }
  },

  // Forum operations
  forum: {
    // Get all forums
    async getAll() {
      console.log('[DB:Forum] Getting all forums');
      try {
        // Use a raw SQL query instead of ORM to avoid syntax errors
        const result = await astroDB.execute(`SELECT * FROM "Forum" ORDER BY "sortOrder" ASC`);
        const forums = result.rows;
        logOperation('Forum:GetAll', { count: forums.length });
        return forums;
      } catch (error) {
        console.error('[DB:Forum:GetAll:Error]', error);
        return [];
      }
    },

    // Get a forum by ID with topics
    async getById(id) {
      if (!id) return null;

      const forumId = safeParseId(id);
      if (forumId === null) return null;

      console.log(`[DB:Forum] Getting forum by ID: ${forumId}`);
      try {
        const forums = await astroDB.select().from(Forum).where({ id: forumId });

        if (!forums || forums.length === 0) {
          logOperation('Forum:GetById', { id: forumId, found: false });
          return null;
        }

        const forum = forums[0];

        // Get topics
        try {
          const topics = await astroDB.select().from(Topic).where({ forumId });
          console.log(`[DB:Forum] Found ${topics.length} topics for forum ID: ${forumId}`);

          // Get author for each topic
          for (const topic of topics) {
            try {
              if (topic.authorId) {
                topic.author = await db.user.findById(topic.authorId);
              }

              // Get latest post for each topic
              try {
                const posts = await astroDB.select().from(Post)
                  .where({ topicId: topic.id })
                  .orderBy({ createdAt: 'desc' })
                  .limit(1);

                topic.posts = posts || [];

                if (posts && posts.length > 0 && posts[0].authorId) {
                  posts[0].author = await db.user.findById(posts[0].authorId);
                }
              } catch (postError) {
                console.error(`[DB:Forum:GetTopicPosts:Error] Topic ${topic.id}`, postError);
                topic.posts = [];
              }
            } catch (authorError) {
              console.error(`[DB:Forum:GetTopicAuthor:Error] Topic ${topic.id}`, authorError);
              topic.author = null;
            }
          }

          // Sort topics by sticky first, then by updatedAt
          topics.sort((a, b) => {
            if (a.isSticky !== b.isSticky) return b.isSticky ? 1 : -1;
            return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
          });

          forum.topics = topics;
        } catch (topicsError) {
          console.error(`[DB:Forum:GetTopics:Error] ${forumId}`, topicsError);
          forum.topics = [];
        }

        logOperation('Forum:GetById', {
          id: forumId,
          found: true,
          topicsCount: forum.topics ? forum.topics.length : 0
        });

        return forum;
      } catch (error) {
        console.error(`[DB:Forum:GetById:Error] ${forumId}`, error);
        return null;
      }
    },

    // Create a new forum
    async create({ title, description, categoryId, sortOrder = 0 }) {
      if (!title || !categoryId) {
        throw new Error('Forum title and categoryId are required');
      }

      const parsedCategoryId = safeParseId(categoryId);
      if (parsedCategoryId === null) {
        throw new Error('Invalid categoryId');
      }

      console.log(`[DB:Forum] Creating new forum: ${title} in category: ${parsedCategoryId}`);
      try {
        const result = await astroDB.insert(Forum).values({
          title,
          description: description || '',
          sortOrder: sortOrder || 0,
          categoryId: parsedCategoryId,
          topicsCount: 0,
          postsCount: 0
        }).returning();

        logOperation('Forum:Create', { id: result[0]?.id, title, categoryId: parsedCategoryId });
        return result;
      } catch (error) {
        console.error(`[DB:Forum:Create:Error] ${title}`, error);
        throw error;
      }
    },

    // Update forum post and topic counts
    async incrementCounts(forumId, incrementTopics = false) {
      if (!forumId) return null;

      const parsedForumId = safeParseId(forumId);
      if (parsedForumId === null) return null;

      console.log(`[DB:Forum] Incrementing counts for forum ID: ${parsedForumId}, topics: ${incrementTopics}`);
      try {
        const forums = await astroDB.select().from(Forum).where({ id: parsedForumId }).limit(1);

        if (!forums || forums.length === 0) {
          logOperation('Forum:IncrementCounts', { forumId: parsedForumId, found: false });
          return null;
        }

        const forum = forums[0];
        const updateData = {
          postsCount: (forum.postsCount || 0) + 1
        };

        if (incrementTopics) {
          updateData.topicsCount = (forum.topicsCount || 0) + 1;
        }

        const result = await astroDB.update(Forum).set(updateData).where({ id: parsedForumId });
        logOperation('Forum:IncrementCounts', {
          forumId: parsedForumId,
          found: true,
          newPostsCount: (forum.postsCount || 0) + 1,
          newTopicsCount: incrementTopics ? (forum.topicsCount || 0) + 1 : (forum.topicsCount || 0)
        });

        return result;
      } catch (error) {
        console.error(`[DB:Forum:IncrementCounts:Error] ${parsedForumId}`, error);
        return null;
      }
    }
  },

  // Topic operations
  topic: {
    // Get a topic by ID with posts
    async getById(id) {
      if (!id) return null;

      const topicId = safeParseId(id);
      if (topicId === null) return null;

      console.log(`[DB:Topic] Getting topic by ID: ${topicId}`);
      try {
        const topics = await astroDB.select().from(Topic).where({ id: topicId });

        if (!topics || topics.length === 0) {
          logOperation('Topic:GetById', { id: topicId, found: false });
          return null;
        }

        const topic = topics[0];

        // Get forum details
        try {
          if (topic.forumId) {
            const forums = await astroDB.select().from(Forum).where({ id: topic.forumId });
            topic.forum = forums && forums.length > 0 ? forums[0] : null;
          }
        } catch (forumError) {
          console.error(`[DB:Topic:GetForum:Error] ${topicId}`, forumError);
          topic.forum = null;
        }

        // Get author details
        try {
          if (topic.authorId) {
            topic.author = await db.user.findById(topic.authorId);
          }
        } catch (authorError) {
          console.error(`[DB:Topic:GetAuthor:Error] ${topicId}`, authorError);
          topic.author = null;
        }

        // Get posts
        try {
          const posts = await astroDB.select().from(Post)
            .where({ topicId })
            .orderBy({ createdAt: 'asc' });

          console.log(`[DB:Topic] Found ${posts.length} posts for topic ID: ${topicId}`);

          // Get author for each post
          for (const post of posts) {
            try {
              if (post.authorId) {
                post.author = await db.user.findById(post.authorId);
              }
            } catch (postAuthorError) {
              console.error(`[DB:Topic:GetPostAuthor:Error] Post ${post.id}`, postAuthorError);
              post.author = null;
            }
          }

          topic.posts = posts;
        } catch (postsError) {
          console.error(`[DB:Topic:GetPosts:Error] ${topicId}`, postsError);
          topic.posts = [];
        }

        logOperation('Topic:GetById', {
          id: topicId,
          found: true,
          title: topic.title,
          postsCount: topic.posts ? topic.posts.length : 0
        });

        return topic;
      } catch (error) {
        console.error(`[DB:Topic:GetById:Error] ${topicId}`, error);
        return null;
      }
    },

    // Create a new topic with initial post
    async create({ title, content, forumId, authorId, isSticky = false, isLocked = false }) {
      if (!title || !content || !forumId || !authorId) {
        throw new Error('Missing required fields for topic creation');
      }

      const parsedForumId = safeParseId(forumId);
      const parsedAuthorId = safeParseId(authorId);

      if (parsedForumId === null || parsedAuthorId === null) {
        throw new Error('Invalid forumId or authorId');
      }

      console.log(`[DB:Topic] Creating new topic: ${title} in forum: ${parsedForumId} by author: ${parsedAuthorId}`);

      try {
        // Create the topic
        const newTopic = await safeQuery(`Topic.create(${title})`, () =>
          astroDB.insert(Topic).values({
            title,
            forumId: parsedForumId,
            authorId: parsedAuthorId,
            isSticky: !!isSticky,
            isLocked: !!isLocked,
            views: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          }).returning()
        );

        if (!newTopic || newTopic.length === 0) {
          throw new Error('Topic creation failed - no result returned');
        }

        const topic = newTopic[0];
        console.log(`[DB:Topic] Topic created with ID: ${topic.id}`);

        // Create the first post
        try {
          const newPost = await safeQuery(`Post.createFirst(topicId: ${topic.id})`, () =>
            astroDB.insert(Post).values({
              content,
              authorId: parsedAuthorId,
              topicId: topic.id,
              createdAt: new Date()
            }).returning()
          );

          console.log(`[DB:Topic] First post created for topic ID: ${topic.id} with ID: ${newPost[0]?.id}`);
        } catch (postError) {
          console.error(`[DB:Topic:CreateFirstPost:Error] ${topic.id}`, postError);
          // If post creation fails, we might want to delete the topic to avoid incomplete data
          try {
            await astroDB.delete(Topic).where({ id: topic.id });
          } catch (deleteError) {
            console.error(`[DB:Topic:DeleteAfterPostFail:Error] ${topic.id}`, deleteError);
          }
          throw postError;
        }

        // Update forum counts
        try {
          const forum = await safeQuery(`Forum.getForUpdate(${parsedForumId})`, () =>
            astroDB.select().from(Forum).where({ id: parsedForumId })
          );

          if (forum && forum.length > 0) {
            await safeQuery(`Forum.updateCounts(${parsedForumId})`, () =>
              astroDB.update(Forum).set({
                topicsCount: (forum[0].topicsCount || 0) + 1,
                postsCount: (forum[0].postsCount || 0) + 1
              }).where({ id: parsedForumId })
            );
            console.log(`[DB:Topic] Updated forum counts for forum ID: ${parsedForumId}`);
          }
        } catch (forumUpdateError) {
          console.error(`[DB:Topic:UpdateForumCounts:Error] ${parsedForumId}`, forumUpdateError);
          // Continue even if this fails - not critical enough to roll back
        }

        // Update user post count
        try {
          await db.user.incrementPostCount(parsedAuthorId);
          console.log(`[DB:Topic] Updated post count for author ID: ${parsedAuthorId}`);
        } catch (userUpdateError) {
          console.error(`[DB:Topic:UpdateUserPostCount:Error] ${parsedAuthorId}`, userUpdateError);
          // Continue even if this fails - not critical
        }

        logOperation('Topic:Create', {
          id: topic.id,
          title,
          forumId: parsedForumId,
          authorId: parsedAuthorId
        });

        return topic;
      } catch (error) {
        console.error(`[DB:Topic:Create:Error] Failed to create topic: ${error.message}`);
        throw error;
      }
    },

    // Increment view count
    async incrementViews(id) {
      if (!id) return null;

      const topicId = safeParseId(id);
      if (topicId === null) return null;

      try {
        const topics = await astroDB.select().from(Topic).where({ id: topicId });

        if (!topics || topics.length === 0) return null;

        const currentViews = topics[0].views || 0;

        return astroDB.update(Topic).set({
          views: currentViews + 1
        }).where({ id: topicId });
      } catch (error) {
        console.error(`[DB:Topic:IncrementViews:Error] ${topicId}`, error);
        return null;
      }
    },

    // Toggle sticky status
    async toggleSticky(id) {
      if (!id) return null;

      const topicId = safeParseId(id);
      if (topicId === null) return null;

      try {
        const topics = await astroDB.select().from(Topic).where({ id: topicId });

        if (!topics || topics.length === 0) return null;

        return astroDB.update(Topic).set({
          isSticky: !topics[0].isSticky
        }).where({ id: topicId });
      } catch (error) {
        console.error(`[DB:Topic:ToggleSticky:Error] ${topicId}`, error);
        return null;
      }
    },

    // Toggle locked status
    async toggleLocked(id) {
      if (!id) return null;

      const topicId = safeParseId(id);
      if (topicId === null) return null;

      try {
        const topics = await astroDB.select().from(Topic).where({ id: topicId });

        if (!topics || topics.length === 0) return null;

        return astroDB.update(Topic).set({
          isLocked: !topics[0].isLocked
        }).where({ id: topicId });
      } catch (error) {
        console.error(`[DB:Topic:ToggleLocked:Error] ${topicId}`, error);
        return null;
      }
    }
  },

  // Post operations
  post: {
    // Get a post by ID
    async getById(id) {
      if (!id) return null;

      const postId = safeParseId(id);
      if (postId === null) return null;

      try {
        const posts = await astroDB.select().from(Post).where({ id: postId });

        if (!posts || posts.length === 0) return null;

        const post = posts[0];

        // Get author
        try {
          if (post.authorId) {
            post.author = await db.user.findById(post.authorId);
          }
        } catch (authorError) {
          console.error(`[DB:Post:GetAuthor:Error] ${postId}`, authorError);
          post.author = null;
        }

        // Get topic
        try {
          if (post.topicId) {
            const topics = await astroDB.select().from(Topic).where({ id: post.topicId });
            post.topic = topics && topics.length > 0 ? topics[0] : null;
          }
        } catch (topicError) {
          console.error(`[DB:Post:GetTopic:Error] ${postId}`, topicError);
          post.topic = null;
        }

        return post;
      } catch (error) {
        console.error(`[DB:Post:GetById:Error] ${postId}`, error);
        return null;
      }
    },

    // Find posts by user ID
    async findUserPosts(userId) {
      if (!userId) return [];

      const parsedUserId = safeParseId(userId);
      if (parsedUserId === null) return [];

      try {
        const posts = await astroDB.select().from(Post)
          .where({ authorId: parsedUserId })
          .orderBy({ createdAt: 'desc' })
          .limit(10);

        // Get topic for each post
        for (const post of posts) {
          try {
            if (post.topicId) {
              const topics = await astroDB.select().from(Topic).where({ id: post.topicId });
              post.topic = topics && topics.length > 0 ? topics[0] : null;
            }
          } catch (topicError) {
            console.error(`[DB:Post:GetPostTopic:Error] Post ${post.id}`, topicError);
            post.topic = null;
          }
        }

        return posts;
      } catch (error) {
        console.error(`[DB:Post:FindUserPosts:Error] ${parsedUserId}`, error);
        return [];
      }
    },

    // Create a new post
    async create({ content, topicId, authorId, parentId = null }) {
      if (!content || !topicId || !authorId) {
        throw new Error('Missing required fields for post creation');
      }

      const parsedTopicId = safeParseId(topicId);
      const parsedAuthorId = safeParseId(authorId);
      const parsedParentId = parentId ? safeParseId(parentId) : null;

      if (parsedTopicId === null || parsedAuthorId === null) {
        throw new Error('Invalid topicId or authorId');
      }

      console.log(`[DB:Post] Creating new post in topic: ${parsedTopicId} by author: ${parsedAuthorId}`);

      try {
        // Get the topic to find its forumId
        const topics = await safeQuery(`Topic.getForPost(${parsedTopicId})`, () =>
          astroDB.select().from(Topic).where({ id: parsedTopicId })
        );

        if (!topics || topics.length === 0) {
          logOperation('Post:Create', { topicId: parsedTopicId, found: false });
          throw new Error(`Topic with ID ${parsedTopicId} not found`);
        }

        const topic = topics[0];

        // Check if topic is locked
        if (topic.isLocked) {
          throw new Error(`Cannot post in locked topic ${parsedTopicId}`);
        }

        // Create the post
        const newPost = await safeQuery(`Post.create(topicId: ${parsedTopicId})`, () =>
          astroDB.insert(Post).values({
            content,
            authorId: parsedAuthorId,
            topicId: parsedTopicId,
            parentId: parsedParentId,
            createdAt: new Date(),
            isEdited: false
          }).returning()
        );

        if (!newPost || newPost.length === 0) {
          throw new Error('Post creation failed - no result returned');
        }

        const post = newPost[0];
        console.log(`[DB:Post] Post created with ID: ${post.id}`);

        // Update topic's updatedAt timestamp
        try {
          await safeQuery(`Topic.updateTimestamp(${parsedTopicId})`, () =>
            astroDB.update(Topic).set({
              updatedAt: new Date()
            }).where({ id: parsedTopicId })
          );
        } catch (topicUpdateError) {
          console.error(`[DB:Post:UpdateTopicTimestamp:Error] ${parsedTopicId}`, topicUpdateError);
          // Continue even if this fails
        }

        // Update forum post count
        try {
          if (topic.forumId) {
            const forum = await safeQuery(`Forum.getForUpdate(${topic.forumId})`, () =>
              astroDB.select().from(Forum).where({ id: topic.forumId })
            );

            if (forum && forum.length > 0) {
              await safeQuery(`Forum.updatePostCount(${topic.forumId})`, () =>
                astroDB.update(Forum).set({
                  postsCount: (forum[0].postsCount || 0) + 1
                }).where({ id: topic.forumId })
              );
              console.log(`[DB:Post] Updated forum post count for forum ID: ${topic.forumId}`);
            }
          }
        } catch (forumUpdateError) {
          console.error(`[DB:Post:UpdateForumPostCount:Error] ${topic.forumId}`, forumUpdateError);
          // Continue even if this fails
        }

        // Update user post count
        try {
          await db.user.incrementPostCount(parsedAuthorId);
          console.log(`[DB:Post] Updated post count for author ID: ${parsedAuthorId}`);
        } catch (userUpdateError) {
          console.error(`[DB:Post:UpdateUserPostCount:Error] ${parsedAuthorId}`, userUpdateError);
          // Continue even if this fails
        }

        // Create notification for the topic author if this is a reply to their topic
        // and the reply author is not the topic author
        try {
          if (topic.authorId && topic.authorId !== parsedAuthorId) {
            await safeQuery(`Notification.createTopicReply(${topic.authorId})`, () =>
              astroDB.insert(Notification).values({
                type: 'reply',
                content: 'Someone replied to your topic',
                userId: topic.authorId,
                link: `/topics/${parsedTopicId}`,
                isRead: false,
                createdAt: new Date()
              })
            );
            console.log(`[DB:Post] Created notification for topic author ID: ${topic.authorId}`);
          }
        } catch (notificationError) {
          console.error(`[DB:Post:CreateTopicReplyNotification:Error] ${topic.authorId}`, notificationError);
          // Continue even if this fails
        }

        // Create notification if this is a reply to a specific post
        try {
          if (parsedParentId) {
            const parentPosts = await safeQuery(`Post.getParent(${parsedParentId})`, () =>
              astroDB.select().from(Post).where({ id: parsedParentId })
            );

            if (parentPosts && parentPosts.length > 0 && parentPosts[0].authorId !== parsedAuthorId) {
              await safeQuery(`Notification.createPostReply(${parentPosts[0].authorId})`, () =>
                astroDB.insert(Notification).values({
                  type: 'reply',
                  content: 'Someone replied to your post',
                  userId: parentPosts[0].authorId,
                  link: `/topics/${parsedTopicId}#post-${post.id}`,
                  isRead: false,
                  createdAt: new Date()
                })
              );
              console.log(`[DB:Post] Created notification for post author ID: ${parentPosts[0].authorId}`);
            }
          }
        } catch (replyNotificationError) {
          console.error(`[DB:Post:CreatePostReplyNotification:Error] ${parsedParentId}`, replyNotificationError);
          // Continue even if this fails
        }

        logOperation('Post:Create', {
          id: post.id,
          topicId: parsedTopicId,
          authorId: parsedAuthorId
        });

        return post;
      } catch (error) {
        console.error(`[DB:Post:Create:Error] Failed to create post: ${error.message}`);
        throw error;
      }
    },

    // Edit a post
    async edit({ id, content }) {
      if (!id || !content) return null;

      const postId = safeParseId(id);
      if (postId === null) return null;

      try {
        return astroDB.update(Post).set({
          content,
          isEdited: true,
          editedAt: new Date()
        }).where({ id: postId });
      } catch (error) {
        console.error(`[DB:Post:Edit:Error] ${postId}`, error);
        return null;
      }
    }
  },

  // Message operations
  message: {
    // Create a new message
    async create({ subject, content, senderId, receiverId }) {
      if (!subject || !content || !senderId || !receiverId) {
        throw new Error('Missing required fields for message creation');
      }

      const parsedSenderId = safeParseId(senderId);
      const parsedReceiverId = safeParseId(receiverId);

      if (parsedSenderId === null || parsedReceiverId === null) {
        throw new Error('Invalid senderId or receiverId');
      }

      try {
        // Create the message
        const newMessage = await astroDB.insert(Message).values({
          subject,
          content,
          senderId: parsedSenderId,
          receiverId: parsedReceiverId,
          isRead: false,
          createdAt: new Date()
        }).returning();

        if (!newMessage || newMessage.length === 0) {
          throw new Error('Message creation failed');
        }

        const message = newMessage[0];

        // Create notification for receiver
        try {
          await astroDB.insert(Notification).values({
            type: 'message',
            content: `New message: ${subject}`,
            userId: parsedReceiverId,
            link: `/messages/inbox/${message.id}`,
            isRead: false,
            createdAt: new Date()
          });
        } catch (notificationError) {
          console.error(`[DB:Message:CreateNotification:Error] ${parsedReceiverId}`, notificationError);
          // Continue even if notification fails
        }

        return message;
      } catch (error) {
        console.error(`[DB:Message:Create:Error]`, error);
        throw error;
      }
    },

    // Get inbox messages for a user
    async getInbox(userId) {
      if (!userId) return [];

      const parsedUserId = safeParseId(userId);
      if (parsedUserId === null) return [];

      try {
        const messages = await astroDB.select().from(Message)
          .where({ receiverId: parsedUserId })
          .orderBy({ createdAt: 'desc' });

        // Get sender for each message
        for (const message of messages) {
          try {
            if (message.senderId) {
              message.sender = await db.user.findById(message.senderId);
            }
          } catch (senderError) {
            console.error(`[DB:Message:GetSender:Error] Message ${message.id}`, senderError);
            message.sender = null;
          }
        }

        return messages;
      } catch (error) {
        console.error(`[DB:Message:GetInbox:Error] ${parsedUserId}`, error);
        return [];
      }
    },

    // Get sent messages for a user
    async getSent(userId) {
      if (!userId) return [];

      const parsedUserId = safeParseId(userId);
      if (parsedUserId === null) return [];

      try {
        const messages = await astroDB.select().from(Message)
          .where({ senderId: parsedUserId })
          .orderBy({ createdAt: 'desc' });

        // Get receiver for each message
        for (const message of messages) {
          try {
            if (message.receiverId) {
              message.receiver = await db.user.findById(message.receiverId);
            }
          } catch (receiverError) {
            console.error(`[DB:Message:GetReceiver:Error] Message ${message.id}`, receiverError);
            message.receiver = null;
          }
        }

        return messages;
      } catch (error) {
        console.error(`[DB:Message:GetSent:Error] ${parsedUserId}`, error);
        return [];
      }
    },

    // Get a single message by ID
    async getById(id, userId) {
      if (!id || !userId) return null;

      const messageId = safeParseId(id);
      const parsedUserId = safeParseId(userId);

      if (messageId === null || parsedUserId === null) return null;

      try {
        const messages = await astroDB.select().from(Message).where({ id: messageId });

        if (!messages || messages.length === 0) return null;

        const message = messages[0];

        // Get sender and receiver
        try {
          if (message.senderId) {
            message.sender = await db.user.findById(message.senderId);
          }
          if (message.receiverId) {
            message.receiver = await db.user.findById(message.receiverId);
          }
        } catch (userError) {
          console.error(`[DB:Message:GetUsers:Error] ${messageId}`, userError);
          // Continue with potentially null users
        }

        // Verify that the user requesting the message is either the sender or receiver
        if (message && (message.senderId === parsedUserId || message.receiverId === parsedUserId)) {
          // Mark as read if the user is the receiver and it's unread
          if (message.receiverId === parsedUserId && !message.isRead) {
            try {
              await astroDB.update(Message).set({
                isRead: true
              }).where({ id: messageId });
            } catch (updateError) {
              console.error(`[DB:Message:MarkRead:Error] ${messageId}`, updateError);
              // Continue even if update fails
            }
          }
          return message;
        }

        return null;
      } catch (error) {
        console.error(`[DB:Message:GetById:Error] ${messageId}`, error);
        return null;
      }
    }
  },

  // Notification operations
  notification: {
    // Get notifications for a user
    async getForUser(userId) {
      if (!userId) return [];

      const parsedUserId = safeParseId(userId);
      if (parsedUserId === null) return [];

      try {
        return astroDB.select().from(Notification)
          .where({ userId: parsedUserId })
          .orderBy({ createdAt: 'desc' });
      } catch (error) {
        console.error(`[DB:Notification:GetForUser:Error] ${parsedUserId}`, error);
        return [];
      }
    },

    // Mark a notification as read
    async markAsRead(id) {
      if (!id) return null;

      const notificationId = safeParseId(id);
      if (notificationId === null) return null;

      try {
        return astroDB.update(Notification).set({
          isRead: true
        }).where({ id: notificationId });
      } catch (error) {
        console.error(`[DB:Notification:MarkAsRead:Error] ${notificationId}`, error);
        return null;
      }
    },

    // Mark all notifications as read for a user
    async markAllAsRead(userId) {
      if (!userId) return null;

      const parsedUserId = safeParseId(userId);
      if (parsedUserId === null) return null;

      try {
        return astroDB.update(Notification).set({
          isRead: true
        }).where({
          userId: parsedUserId,
          isRead: false
        });
      } catch (error) {
        console.error(`[DB:Notification:MarkAllAsRead:Error] ${parsedUserId}`, error);
        return null;
      }
    },

    // Get unread notification count for a user
    async getUnreadCount(userId) {
      if (!userId) return 0;

      const parsedUserId = safeParseId(userId);
      if (parsedUserId === null) return 0;

      try {
        const result = await astroDB.select().from(Notification)
          .where({
            userId: parsedUserId,
            isRead: false
          });

        return result ? result.length : 0;
      } catch (error) {
        console.error(`[DB:Notification:GetUnreadCount:Error] ${parsedUserId}`, error);
        return 0;
      }
    }
  }
};