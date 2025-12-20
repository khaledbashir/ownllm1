const prisma = require("../utils/prisma");

/**
 * Public API Registry - cached free APIs for common use cases
 * Flow Builder uses this when user asks for generic stuff (jokes, weather, etc.)
 */
const PublicApiRegistry = {
  /**
   * Find APIs matching a category
   */
  findByCategory: async function (category) {
    try {
      const apis = await prisma.public_api_registry.findMany({
        where: {
          category: category.toLowerCase(),
          isVerified: true,
        },
        orderBy: { name: "asc" },
      });

      return apis.map((api) => ({
        name: api.name,
        endpoint: api.endpoint,
        method: api.method,
        authType: api.authType,
        headers: api.headers ? JSON.parse(api.headers) : null,
        docsUrl: api.docsUrl,
      }));
    } catch (error) {
      console.error("[PublicApiRegistry] Find error:", error.message);
      return [];
    }
  },

  /**
   * Search for APIs matching query
   */
  search: async function (query) {
    try {
      const apis = await prisma.public_api_registry.findMany({
        where: {
          OR: [
            { category: { contains: query.toLowerCase() } },
            { name: { contains: query } },
          ],
        },
        take: 5,
      });

      return apis.map((api) => ({
        category: api.category,
        name: api.name,
        endpoint: api.endpoint,
        method: api.method,
        authType: api.authType,
        docsUrl: api.docsUrl,
      }));
    } catch {
      return [];
    }
  },

  /**
   * Get a specific API by category and name
   */
  get: async function (category, name) {
    try {
      const api = await prisma.public_api_registry.findFirst({
        where: {
          category: category.toLowerCase(),
          name: name,
        },
      });

      if (!api) return null;

      return {
        name: api.name,
        endpoint: api.endpoint,
        method: api.method,
        authType: api.authType,
        headers: api.headers ? JSON.parse(api.headers) : null,
        bodySchema: api.bodySchema ? JSON.parse(api.bodySchema) : null,
        responseExample: api.responseExample,
        docsUrl: api.docsUrl,
      };
    } catch {
      return null;
    }
  },

  /**
   * Seed the registry with common free APIs
   */
  seed: async function () {
    const apis = [
      // Jokes
      {
        category: "jokes",
        name: "JokeAPI",
        endpoint: "https://v2.jokeapi.dev/joke/Any",
        method: "GET",
        authType: "none",
        docsUrl: "https://jokeapi.dev/",
        isVerified: true,
        responseExample:
          '{"type":"single","joke":"Why do programmers prefer dark mode? Because light attracts bugs."}',
      },
      {
        category: "jokes",
        name: "Chuck Norris API",
        endpoint: "https://api.chucknorris.io/jokes/random",
        method: "GET",
        authType: "none",
        docsUrl: "https://api.chucknorris.io/",
        isVerified: true,
      },
      // Quotes
      {
        category: "quotes",
        name: "Quotable",
        endpoint: "https://api.quotable.io/random",
        method: "GET",
        authType: "none",
        docsUrl: "https://github.com/lukePeavey/quotable",
        isVerified: true,
      },
      // Random facts
      {
        category: "facts",
        name: "Useless Facts",
        endpoint: "https://uselessfacts.jsph.pl/random.json?language=en",
        method: "GET",
        authType: "none",
        isVerified: true,
      },
      // Cat facts
      {
        category: "facts",
        name: "Cat Facts",
        endpoint: "https://catfact.ninja/fact",
        method: "GET",
        authType: "none",
        docsUrl: "https://catfact.ninja/",
        isVerified: true,
      },
      // Dog images
      {
        category: "images",
        name: "Dog CEO",
        endpoint: "https://dog.ceo/api/breeds/image/random",
        method: "GET",
        authType: "none",
        docsUrl: "https://dog.ceo/dog-api/",
        isVerified: true,
      },
      // IP info
      {
        category: "ip",
        name: "ipify",
        endpoint: "https://api.ipify.org?format=json",
        method: "GET",
        authType: "none",
        docsUrl: "https://www.ipify.org/",
        isVerified: true,
      },
      // Placeholder data
      {
        category: "placeholder",
        name: "JSONPlaceholder",
        endpoint: "https://jsonplaceholder.typicode.com/posts",
        method: "GET",
        authType: "none",
        docsUrl: "https://jsonplaceholder.typicode.com/",
        isVerified: true,
      },
      // Bored - activity suggestions
      {
        category: "activities",
        name: "Bored API",
        endpoint: "https://www.boredapi.com/api/activity",
        method: "GET",
        authType: "none",
        docsUrl: "https://www.boredapi.com/",
        isVerified: true,
      },
    ];

    let created = 0;
    for (const api of apis) {
      try {
        await prisma.public_api_registry.upsert({
          where: {
            category_name: {
              category: api.category,
              name: api.name,
            },
          },
          create: api,
          update: api,
        });
        created++;
      } catch (e) {
        console.error(
          `[PublicApiRegistry] Seed failed for ${api.name}:`,
          e.message
        );
      }
    }

    return { success: true, count: created };
  },
};

module.exports = { PublicApiRegistry };
