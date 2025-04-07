import { defineDb, defineTable, column } from 'astro:db';

// https://astro.build/db/config
export default defineDb({
  tables: {
    User: defineTable({
      columns: {
        id: column.number({ primaryKey: true, autoIncrement: true }),
        username: column.text({ unique: true }),
        email: column.text({ unique: true }),
        passwordHash: column.text(),
        createdAt: column.date({ default: new Date() }),
        updatedAt: column.date({ default: new Date() }),
        avatarUrl: column.text({ optional: true }),
        signature: column.text({ optional: true }),
        postsCount: column.number({ default: 0 }),
      }
    }),

    Category: defineTable({
      columns: {
        id: column.number({ primaryKey: true, autoIncrement: true }),
        name: column.text(),
        sortOrder: column.number({ default: 0 }),
        createdAt: column.date({ default: new Date() }),
        updatedAt: column.date({ default: new Date() }),
      }
    }),

    Forum: defineTable({
      columns: {
        id: column.number({ primaryKey: true, autoIncrement: true }),
        title: column.text(),
        description: column.text(),
        sortOrder: column.number({ default: 0 }),
        topicsCount: column.number({ default: 0 }),
        postsCount: column.number({ default: 0 }),
        createdAt: column.date({ default: new Date() }),
        updatedAt: column.date({ default: new Date() }),
        categoryId: column.number(),
      }
    }),

    Topic: defineTable({
      columns: {
        id: column.number({ primaryKey: true, autoIncrement: true }),
        title: column.text(),
        views: column.number({ default: 0 }),
        isSticky: column.boolean({ default: false }),
        isLocked: column.boolean({ default: false }),
        createdAt: column.date({ default: new Date() }),
        updatedAt: column.date({ default: new Date() }),
        forumId: column.number(),
        authorId: column.number(),
      }
    }),

    Post: defineTable({
      columns: {
        id: column.number({ primaryKey: true, autoIncrement: true }),
        content: column.text(),
        isEdited: column.boolean({ default: false }),
        editedAt: column.date({ optional: true }),
        createdAt: column.date({ default: new Date() }),
        updatedAt: column.date({ default: new Date() }),
        authorId: column.number(),
        topicId: column.number(),
        parentId: column.number({ optional: true }), // For threaded replies
      }
    }),

    Message: defineTable({
      columns: {
        id: column.number({ primaryKey: true, autoIncrement: true }),
        subject: column.text(),
        content: column.text(),
        isRead: column.boolean({ default: false }),
        createdAt: column.date({ default: new Date() }),
        senderId: column.number(),
        receiverId: column.number(),
      }
    }),

    Notification: defineTable({
      columns: {
        id: column.number({ primaryKey: true, autoIncrement: true }),
        type: column.text(), // "message", "reply", "mention", etc.
        content: column.text(),
        isRead: column.boolean({ default: false }),
        createdAt: column.date({ default: new Date() }),
        link: column.text({ optional: true }), // Link to the related content
        userId: column.number(),
      }
    })
  }
});
