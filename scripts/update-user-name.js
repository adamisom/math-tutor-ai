#!/usr/bin/env node

/**
 * Script to update a user's name by email
 * 
 * Usage: node scripts/update-user-name.js <email> <new-name>
 * 
 * Example: node scripts/update-user-name.js user@example.com "John Doe"
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateUserName() {
  try {
    const args = process.argv.slice(2);

    if (args.length < 2) {
      console.error('❌ Error: Missing required arguments');
      console.log('');
      console.log('Usage: node scripts/update-user-name.js <email> <new-name>');
      console.log('');
      console.log('Example:');
      console.log('  node scripts/update-user-name.js user@example.com "John Doe"');
      process.exit(1);
    }

    const email = args[0];
    const newName = args[1];

    if (!email || !newName) {
      console.error('❌ Error: Email and new name are required');
      process.exit(1);
    }

    console.log(`Looking for user with email: ${email}`);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!existingUser) {
      console.error(`❌ Error: User with email "${email}" not found`);
      process.exit(1);
    }

    console.log(`Found user: ${existingUser.name || '(no name)'} (ID: ${existingUser.id})`);
    console.log(`Updating name to: "${newName}"`);

    // Update user name
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { name: newName.trim() },
    });

    console.log(`✅ Successfully updated user name`);
    console.log(`   Email: ${updatedUser.email}`);
    console.log(`   Name: ${updatedUser.name}`);
    console.log(`   ID: ${updatedUser.id}`);

  } catch (error) {
    console.error('❌ Error updating user name:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserName();

