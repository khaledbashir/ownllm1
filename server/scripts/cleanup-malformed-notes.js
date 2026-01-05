/**
 * Cleanup script to fix malformed thread notes in the database
 *
 * This script finds and fixes thread notes that contain malformed JSON
 * (e.g., "[object Object]" from incorrect stringification)
 *
 * Run with: node server/scripts/cleanup-malformed-notes.js
 */

const prisma = require("../utils/prisma");

// Malformed patterns to detect
const MALFORMED_PATTERNS = [
  /^\[object /,           // "[object Object]", "[object Array]", etc.
  /^\[object\s+\w+\]$/,   // Exact matches like "[object Object]"
];

function isMalformedNotes(notes) {
  if (!notes || typeof notes !== 'string') {
    return false;
  }

  return MALFORMED_PATTERNS.some(pattern => pattern.test(notes.trim()));
}

async function cleanupMalformedNotes() {
  console.log("Starting cleanup of malformed thread notes...\n");

  try {
    // Find all threads with notes
    const allThreads = await prisma.workspace_threads.findMany({
      where: {
        notes: {
          not: null,
        },
      },
      select: {
        id: true,
        slug: true,
        notes: true,
        workspace_id: true,
      },
    });

    console.log(`Found ${allThreads.length} threads with notes.`);

    const malformedThreads = allThreads.filter(thread =>
      isMalformedNotes(thread.notes)
    );

    if (malformedThreads.length === 0) {
      console.log("\n✅ No malformed notes found. Database is clean!");
      return;
    }

    console.log(`\n⚠️  Found ${malformedThreads.length} threads with malformed notes:`);
    console.log("─".repeat(80));

    // Show sample of malformed notes
    malformedThreads.forEach((thread, index) => {
      const preview = thread.notes.length > 50
        ? thread.notes.substring(0, 50) + "..."
        : thread.notes;
      console.log(`${index + 1}. Thread ID ${thread.id} (slug: ${thread.slug})`);
      console.log(`   Malformed content: "${preview}"`);
      console.log();
    });

    console.log("─".repeat(80));
    console.log("\n🔧 Cleaning up malformed notes...\n");

    // Clear malformed notes
    let cleanedCount = 0;
    for (const thread of malformedThreads) {
      try {
        await prisma.workspace_threads.update({
          where: { id: thread.id },
          data: { notes: "" },
        });
        cleanedCount++;
        console.log(`✓ Cleared malformed notes for thread "${thread.slug}" (ID: ${thread.id})`);
      } catch (error) {
        console.error(`✗ Failed to clear notes for thread ID ${thread.id}:`, error.message);
      }
    }

    console.log("\n" + "=".repeat(80));
    console.log("\n🎉 Cleanup complete!");
    console.log(`   - Threads scanned: ${allThreads.length}`);
    console.log(`   - Malformed found: ${malformedThreads.length}`);
    console.log(`   - Successfully cleaned: ${cleanedCount}`);
    console.log("\n" + "=".repeat(80));
    console.log("\n✨ The notes editor will now create fresh documents for these threads.");
    console.log("💡 Users may need to refresh their browser to see the changes.\n");

  } catch (error) {
    console.error("\n❌ Error during cleanup:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupMalformedNotes()
  .then(() => {
    console.log("✅ Script completed successfully.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
