class GenericOpenAiTTS {
  constructor() {
    if (!process.env.TTS_OPEN_AI_COMPATIBLE_KEY)
      this.#log(
        "No OpenAI compatible API key was set. You might need to set this to use your OpenAI compatible TTS service."
      );
    if (!process.env.TTS_OPEN_AI_COMPATIBLE_MODEL)
      this.#log(
        "No OpenAI compatible TTS model was set. We will use the default voice model 'tts-1'. This may not exist or be valid your selected endpoint."
      );
    if (!process.env.TTS_OPEN_AI_COMPATIBLE_VOICE_MODEL)
      this.#log(
        "No OpenAI compatible voice model was set. We will use the default voice model 'alloy'. This may not exist for your selected endpoint."
      );
    if (!process.env.TTS_OPEN_AI_COMPATIBLE_ENDPOINT)
      throw new Error(
        "No OpenAI compatible endpoint was set. Please set this to use your OpenAI compatible TTS service."
      );

    const { OpenAI: OpenAIApi } = require("openai");
    this.openai = new OpenAIApi({
      apiKey: process.env.TTS_OPEN_AI_COMPATIBLE_KEY || null,
      baseURL: process.env.TTS_OPEN_AI_COMPATIBLE_ENDPOINT,
    });
    this.model = process.env.TTS_OPEN_AI_COMPATIBLE_MODEL ?? "tts-1";
    this.voice = process.env.TTS_OPEN_AI_COMPATIBLE_VOICE_MODEL ?? "alloy";
    this.responseFormat =
      process.env.TTS_OPEN_AI_COMPATIBLE_RESPONSE_FORMAT ??
      process.env.TTS_RESPONSE_FORMAT ??
      "mp3";
    this.#log(
      `Service (${process.env.TTS_OPEN_AI_COMPATIBLE_ENDPOINT}) with model: ${this.model}, voice: ${this.voice}, format: ${this.responseFormat}`
    );
  }

  #log(text, ...args) {
    console.log(`\x1b[32m[OpenAiGenericTTS]\x1b[0m ${text}`, ...args);
  }

  /**
   * Generates a buffer from the given text input using the OpenAI compatible TTS service.
   * Handles character limits by chunking the text and merging the audio buffers.
   * @param {string} textInput - The text to be converted to audio.
   * @returns {Promise<Buffer>} A buffer containing the audio data.
   */
  async ttsBuffer(textInput) {
    try {
      const MAX_CHUNK_LENGTH =
        Number(process.env.TTS_MAX_CHAR_LIMIT) ||
        (process.env.TTS_OPEN_AI_COMPATIBLE_ENDPOINT?.includes("groq.com")
          ? 180
          : 4000);

      if (textInput.length <= MAX_CHUNK_LENGTH) {
        return await this.#fetchTTS(textInput);
      }

      const chunks = this.#splitText(textInput, MAX_CHUNK_LENGTH);
      const buffers = [];
      for (const chunk of chunks) {
        const buffer = await this.#fetchTTS(chunk);
        if (buffer) buffers.push(buffer);
      }

      if (buffers.length === 0) return null;
      if (buffers.length === 1) return buffers[0];

      return this.#mergeBuffers(buffers);
    } catch (e) {
      console.error(e);
    }
    return null;
  }

  async #fetchTTS(text) {
    try {
      const result = await this.openai.audio.speech.create({
        model: this.model,
        voice: this.voice,
        input: text,
        response_format: this.responseFormat,
      });
      return Buffer.from(await result.arrayBuffer());
    } catch (e) {
      this.#log(`Error fetching TTS for chunk: ${text.slice(0, 20)}...`, e);
      return null;
    }
  }

  #splitText(text, limit) {
    const chunks = [];
    let current = text;

    while (current.length > 0) {
      if (current.length <= limit) {
        chunks.push(current);
        break;
      }

      let splitIndex = current.lastIndexOf(". ", limit);
      if (splitIndex === -1) splitIndex = current.lastIndexOf("! ", limit);
      if (splitIndex === -1) splitIndex = current.lastIndexOf("? ", limit);
      if (splitIndex === -1) splitIndex = current.lastIndexOf(", ", limit);
      if (splitIndex === -1) splitIndex = current.lastIndexOf(" ", limit);
      if (splitIndex === -1) splitIndex = limit;

      chunks.push(current.substring(0, splitIndex + 1).trim());
      current = current.substring(splitIndex + 1).trim();
    }

    return chunks.filter((c) => c.length > 0);
  }

  #mergeBuffers(buffers) {
    if (this.responseFormat === "wav") {
      return this.#mergeWavBuffers(buffers);
    }
    // For mp3 and others, simple concatenation usually works for most players
    return Buffer.concat(buffers);
  }

  #mergeWavBuffers(buffers) {
    try {
      const firstBuffer = buffers[0];
      // Basic WAV validation and header extraction
      if (firstBuffer.toString("ascii", 0, 4) !== "RIFF") {
        return Buffer.concat(buffers);
      }

      const dataHeaders = buffers.map((buf) => {
        const dataIndex = buf.indexOf("data");
        if (dataIndex === -1) return { headerSize: 0, dataSize: buf.length };
        return {
          headerSize: dataIndex + 8,
          dataSize: buf.readUInt32LE(dataIndex + 4),
        };
      });

      const totalDataSize = dataHeaders.reduce(
        (sum, h) => sum + (h.headerSize > 0 ? h.dataSize : h.dataSize),
        0
      );
      const firstHeader = firstBuffer.slice(0, dataHeaders[0].headerSize);

      const combinedBuffer = Buffer.alloc(firstHeader.length + totalDataSize);
      firstHeader.copy(combinedBuffer);

      // Update RIFF chunk size (total file size - 8)
      combinedBuffer.writeUInt32LE(combinedBuffer.length - 8, 4);
      // Update data chunk size
      const dataSizeIndex = firstHeader.indexOf("data") + 4;
      combinedBuffer.writeUInt32LE(totalDataSize, dataSizeIndex);

      let offset = firstHeader.length;
      for (let i = 0; i < buffers.length; i++) {
        const h = dataHeaders[i];
        const data = buffers[i].slice(h.headerSize);
        data.copy(combinedBuffer, offset);
        offset += data.length;
      }

      return combinedBuffer;
    } catch (e) {
      this.#log("Error merging WAV buffers, falling back to concatenation", e);
      return Buffer.concat(buffers);
    }
  }
}

module.exports = {
  GenericOpenAiTTS,
};
