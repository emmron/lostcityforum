import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Initialize Prisma client
const prisma = new PrismaClient();

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

    // Verify a user's password
    async verifyPassword(user, password) {
      return bcrypt.compare(password, user.passwordHash);
    }
  }
};

// Export the Prisma client for direct access if needed
export { prisma };