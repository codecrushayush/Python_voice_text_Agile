/**
 * Microphone recorder that produces a standard PCM WAV file in the browser.
 * Uses the Web Audio API only - no external service and no AI model.
 */

function encodeWav(channels, sampleRate) {
  const numChannels = channels.length;
  const length = channels[0].length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = length * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i += 1) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < length; i += 1) {
    for (let ch = 0; ch < numChannels; ch += 1) {
      let sample = Math.max(-1, Math.min(1, channels[ch][i]));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, sample, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

export class WavRecorder {
  constructor() {
    this.audioContext = null;
    this.stream = null;
    this.recording = false;
    this.chunks = [];
    this.sampleRate = 16000;
    this._resolve = null;
    this._reject = null;
  }

  async start() {
    if (this.recording) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Microphone recording is not supported by this browser.');
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'SecurityError') {
        throw new Error('Microphone permission denied. Please allow microphone access and try again.');
      }
      throw new Error('Could not access the microphone. Please check your input device.');
    }

    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.sampleRate = this.audioContext.sampleRate;
    const source = this.audioContext.createMediaStreamSource(this.stream);
    const processor = this.audioContext.createScriptProcessor(4096, 1, 1);

    this.chunks = [];
    this.recording = true;

    processor.onaudioprocess = (event) => {
      if (!this.recording) return;
      const data = event.inputBuffer.getChannelData(0);
      this.chunks.push(new Float32Array(data));
    };

    source.connect(processor);
    processor.connect(this.audioContext.destination);
    this._processor = processor;
    this._source = source;

    return new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
  }

  stop() {
    if (!this.recording) {
      return Promise.resolve(null);
    }
    this.recording = false;

    try {
      this._processor?.disconnect();
      this._source?.disconnect();
      this.stream?.getTracks().forEach((track) => track.stop());
      this.audioContext?.close();
    } catch {
      /* ignore teardown errors */
    }

    if (!this.chunks.length) {
      this._reject?.(new Error('No audio captured. Please try recording again.'));
      return Promise.resolve(null);
    }

    const length = this.chunks.reduce((sum, c) => sum + c.length, 0);
    const merged = new Float32Array(length);
    let offset = 0;
    this.chunks.forEach((chunk) => {
      merged.set(chunk, offset);
      offset += chunk.length;
    });

    const blob = encodeWav([merged], this.sampleRate);
    this._resolve?.(blob);
    return Promise.resolve(blob);
  }

  cancel() {
    this.recording = false;
    try {
      this._processor?.disconnect();
      this._source?.disconnect();
      this.stream?.getTracks().forEach((track) => track.stop());
      this.audioContext?.close();
    } catch {
      /* ignore */
    }
    this.chunks = [];
  }
}
