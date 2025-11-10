#!/usr/bin/env node

/**
 * Script to delete all users from the database
 * 
 * Usage: node scripts/delete-all-users.js [--confirm]
 * 
 * WARNING: This will delete ALL users and their associated data:
 * - All user accounts
 * - All conversations
 * - All XP states
 * - All sessions
 * 
 * Use with caution!
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteAllUsers() {
  try {
    // Check if --confirm flag is provided
    const args = process.argv.slice(2);
    const confirmed = args.includes('--confirm');

    if (!confirmed) {
      console.log('⚠️  WARNING: This will delete ALL users and their associated data!');
      console.log('   This includes:');
      console.log('   - All user accounts');
      console.log('   - All conversations');
      console.log('   - All XP states');
      console.log('   - All sessions');
      console.log('');
      console.log('   To confirm, run: node scripts/delete-all-users.js --confirm');
      process.exit(1);
    }

    console.log('Deleting all users...');

    // Count users first
    const userCount = await prisma.user.count();
    console.log(`Found ${userCount} user(s) to delete`);

    if (userCount === 0) {
      console.log('No users to delete.');
      await prisma.$disconnect();
      return;
    }

    // Delete all users (cascading deletes will handle related data)
    const result = await prisma.user.deleteMany({});

    console.log(`✅ Successfully deleted ${result.count} user(s)`);
    console.log('   (Associated conversations, XP states, and sessions were also deleted)');

  } catch (error) {
    console.error('❌ Error deleting users:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllUsers();

