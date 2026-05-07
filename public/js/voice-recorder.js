// ==================== Voice Recording Utilities ====================
class VoiceRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks   = [];
    this.isRecording   = false;
    this.startTime     = null;
    this._resolveStop  = null; // promise resolver for stopRecording()
  }

  // Pick the best supported mimeType for this browser
  _getBestMimeType() {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/mpeg'
    ];
    for (const t of types) {
      if (MediaRecorder.isTypeSupported(t)) return t;
    }
    return ''; // let browser decide
  }

  async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = this._getBestMimeType();

      this.mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      this.audioChunks   = [];
      this.startTime     = Date.now();
      this.isRecording   = true;

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) this.audioChunks.push(e.data);
      };

      // onstop fires after all data is available — safe to build blob here
      this.mediaRecorder.onstop = () => {
        this.isRecording = false;
        if (this._resolveStop) {
          const blob = new Blob(this.audioChunks, {
            type: this.mediaRecorder.mimeType || 'audio/webm'
          });
          this._resolveStop(blob);
          this._resolveStop = null;
        }
        // Stop all mic tracks
        stream.getTracks().forEach(t => t.stop());
      };

      this.mediaRecorder.start(100); // collect data every 100ms
      return true;
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('Microphone access is required to record voice notes.\nPlease allow microphone in your browser settings.');
      return false;
    }
  }

  // Returns a Promise<Blob> — resolves when recording is fully stopped
  stopRecording() {
    if (!this.mediaRecorder || !this.isRecording) return Promise.resolve(null);

    return new Promise((resolve) => {
      this._resolveStop = resolve;
      this.mediaRecorder.stop(); // triggers onstop → resolves promise
    });
  }

  getRecordingDuration() {
    if (!this.startTime) return 0;
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  createAudioElement(blob) {
    if (!blob) return null;
    const audio = document.createElement('audio');
    audio.controls = true;
    audio.src = URL.createObjectURL(blob);
    audio.style.width = '100%';
    return audio;
  }

  clearRecording() {
    this.audioChunks  = [];
    this.startTime    = null;
    this._resolveStop = null;
  }
}

// Global instance
const voiceRecorder = new VoiceRecorder();

// Helper: format seconds as m:ss
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
