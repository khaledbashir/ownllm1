/**
 * API Tester Agent Skill
 * Tests API endpoints before Flow Builder uses them.
 * Verifies cached public APIs and user vault configs work.
 */

const apiTester = {
  name: "api-tester",
  startupConfig: {
    params: {},
  },
  plugin: function () {
    return {
      name: this.name,
      setup(aibitat) {
        aibitat.function({
          super: aibitat,
          name: this.name,
          controller: new AbortController(),
          description:
            "Tests an API endpoint to verify it works before using it in a flow. Returns status code, response time, and sample response.",
          examples: [
            {
              prompt: "Test if the JokeAPI is working",
              call: JSON.stringify({
                url: "https://v2.jokeapi.dev/joke/Any",
                method: "GET",
              }),
            },
            {
              prompt: "Verify this webhook works",
              call: JSON.stringify({
                url: "https://hooks.slack.com/services/xxx",
                method: "POST",
                body: JSON.stringify({ text: "test" }),
              }),
            },
          ],
          parameters: {
            $schema: "http://json-schema.org/draft-07/schema#",
            type: "object",
            properties: {
              url: {
                type: "string",
                format: "uri",
                description: "The full API endpoint URL to test",
              },
              method: {
                type: "string",
                enum: ["GET", "POST", "PUT", "DELETE", "PATCH"],
                description: "HTTP method (defaults to GET)",
              },
              headers: {
                type: "object",
                description: "Optional headers as key-value pairs",
              },
              body: {
                type: "string",
                description: "Optional request body (for POST/PUT/PATCH)",
              },
              timeout: {
                type: "number",
                description: "Timeout in milliseconds (defaults to 5000)",
              },
            },
            required: ["url"],
            additionalProperties: false,
          },
          handler: async function ({
            url,
            method = "GET",
            headers = {},
            body = null,
            timeout = 5000,
          }) {
            try {
              this.super.introspect(
                `${this.caller}: Testing API endpoint ${method} ${url}`
              );

              const result = await this.testEndpoint(
                url,
                method,
                headers,
                body,
                timeout
              );

              if (result.success) {
                this.super.introspect(
                  `${this.caller}: ✅ API is working! Status: ${result.status}, Response time: ${result.responseTime}ms`
                );
                return JSON.stringify({
                  success: true,
                  status: result.status,
                  statusText: result.statusText,
                  responseTime: result.responseTime,
                  contentType: result.contentType,
                  sampleResponse: result.sampleResponse,
                  message: `API endpoint is working. Status ${result.status} in ${result.responseTime}ms.`,
                });
              } else {
                this.super.introspect(
                  `${this.caller}: ❌ API test failed: ${result.error}`
                );
                return JSON.stringify({
                  success: false,
                  error: result.error,
                  status: result.status,
                  message: `API endpoint test failed: ${result.error}`,
                });
              }
            } catch (error) {
              this.super.handlerProps.log(`API Tester Error: ${error.message}`);
              return JSON.stringify({
                success: false,
                error: error.message,
                message: `Error testing API: ${error.message}`,
              });
            }
          },

          /**
           * Test an API endpoint
           */
          testEndpoint: async function (url, method, headers, body, timeout) {
            const startTime = Date.now();

            try {
              // Create abort controller for timeout
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), timeout);

              const fetchOptions = {
                method: method.toUpperCase(),
                headers: {
                  "Content-Type": "application/json",
                  "User-Agent": "OwnLLM-APITester/1.0",
                  ...headers,
                },
                signal: controller.signal,
              };

              // Add body for non-GET requests
              if (
                body &&
                ["POST", "PUT", "PATCH"].includes(method.toUpperCase())
              ) {
                fetchOptions.body =
                  typeof body === "string" ? body : JSON.stringify(body);
              }

              const response = await fetch(url, fetchOptions);
              clearTimeout(timeoutId);

              const responseTime = Date.now() - startTime;
              const contentType =
                response.headers.get("content-type") || "unknown";

              // Try to get sample response
              let sampleResponse = null;
              try {
                const text = await response.text();
                // Limit sample to 500 chars
                sampleResponse =
                  text.length > 500 ? text.substring(0, 500) + "..." : text;
                // Try to parse as JSON for prettier output
                try {
                  sampleResponse = JSON.parse(sampleResponse);
                } catch {
                  // Keep as text
                }
              } catch {
                sampleResponse = "(Could not read response body)";
              }

              if (response.ok) {
                return {
                  success: true,
                  status: response.status,
                  statusText: response.statusText,
                  responseTime,
                  contentType,
                  sampleResponse,
                };
              } else {
                return {
                  success: false,
                  status: response.status,
                  error: `HTTP ${response.status}: ${response.statusText}`,
                  responseTime,
                };
              }
            } catch (error) {
              const responseTime = Date.now() - startTime;

              if (error.name === "AbortError") {
                return {
                  success: false,
                  error: `Request timed out after ${timeout}ms`,
                  responseTime,
                };
              }

              return {
                success: false,
                error: error.message,
                responseTime,
              };
            }
          },
        });
      },
    };
  },
};

module.exports = {
  apiTester,
};
