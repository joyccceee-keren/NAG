// ==================== Voice Recording Utilities ====================
class VoiceRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.startTime = null;
  }

  async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus' || 'audio/wav'
      });

      this.audioChunks = [];
      this.startTime = Date.now();
      this.isRecording = true;

      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.onstop = () => {
        this.isRecording = false;
      };

      this.mediaRecorder.start();
      return true;
    } catch (error) {
      console.error('Microphone access denied:', error);
      alert('Microphone access is required to record voice notes');
      return false;
    }
  }

  stopRecording() {
    if (!this.mediaRecorder || !this.isRecording) return null;

    this.mediaRecorder.stop();

    // Stop all tracks
    this.mediaRecorder.stream.getTracks().forEach(track => track.stop());

    const blob = new Blob(this.audioChunks, {
      type: this.mediaRecorder.mimeType || 'audio/webm'
    });

    return blob;
  }

  getRecordingDuration() {
    if (!this.isRecording || !this.startTime) return 0;
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  createAudioElement(blob) {
    const url = URL.createObjectURL(blob);
    const audio = document.createElement('audio');
    audio.src = url;
    audio.controls = true;
    return audio;
  }

  async playAudio(blob) {
    const audio = this.createAudioElement(blob);
    audio.play();
    return audio;
  }

  clearRecording() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.startTime = null;
  }
}

// Create global voice recorder instance
const voiceRecorder = new VoiceRecorder();

// Helper function to format time
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
