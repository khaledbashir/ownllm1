const { EventEmitter } = require("events");

/**
 * A mock Socket class to capture Agent output in a headless environment.
 * Emulates the socket.io interface used by AgentHandler.
 */
class HeadlessSocket extends EventEmitter {
  constructor() {
    super();
    this.id = "headless-execution";
    this.handshake = {
      address: "127.0.0.1",
      query: {},
    };
    this.accumulatedText = "";
    this.isDone = false;
    this.streamEvents = [];
  }

  /**
   * Mock emit method to capture events from the Agent (AIbitat).
   * @param {string} event - The event name (e.g., 'message', 'stopGeneration').
   * @param {any} data - The data sent with the event.
   */
  emit(event, data) {
    if (event === "message") {
      this.#handleMessage(data);
      return true;
    } else if (event === "stopGeneration") {
      if (!this.isDone) {
        this.isDone = true;
        // Use super.emit to ensure listeners (waitForCompletion) receive the event
        super.emit("done", this.accumulatedText);
      }
      return true;
    } else if (event === "done") {
      // Internal signal, pass to super
      return super.emit(event, data);
    } else {
      // Capture other events for debugging/logging
      this.streamEvents.push({ event, data });
      // Also pass them through so any listeners work
      return super.emit(event, data);
    }
  }

  #handleMessage(data) {
    // AIbitat / AgentHandler sends a JSON string or object
    let messageData = data;
    if (typeof data === "string") {
      try {
        messageData = JSON.parse(data);
      } catch (e) {
        throw new Error(`Failed to parse message data as JSON: ${e.message}`);
      }
    }

    // Capture text chunks
    if (messageData?.textResponse) {
      this.accumulatedText += messageData.textResponse;
    }

    // Handle 'finalizeResponseStream' or similar closing signals if they come via 'message'
    if (
      messageData?.type === "finalizeResponseStream" ||
      messageData?.close === true
    ) {
      this.isDone = true;
      this.emit("done", this.accumulatedText);
    }
  }

  /**
   * Wait for the agent to complete execution.
   * @param {number} timeoutMs - Max time to wait in ms.
   * @returns {Promise<string>} - The full accumulated text response.
   */
  async waitForCompletion(timeoutMs = 60000) {
    if (this.isDone) return this.accumulatedText;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error("Agent execution timed out"));
      }, timeoutMs);

      this.once("done", (finalText) => {
        clearTimeout(timer);
        resolve(finalText);
      });
    });
  }
}

module.exports = { HeadlessSocket };
