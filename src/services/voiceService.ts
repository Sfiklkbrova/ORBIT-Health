// Two-Way Real-Time Voice Conversation Service for ORBIT AI
// Multilingual support: Azerbaijani (az-AZ), Turkish (tr-TR), English (en-US)

import * as Speech from 'expo-speech';
import { AppLanguage } from '../i18n';

export type VoiceState =
  | 'IDLE'
  | 'LISTENING'
  | 'UNDERSTANDING'
  | 'RESEARCHING'
  | 'THINKING'
  | 'SPEAKING'
  | 'INTERRUPTED'
  | 'ERROR';

export interface VoiceMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  language: AppLanguage;
  timestamp: string;
  latencyMs?: number;
}

export interface VoiceSessionState {
  voiceState: VoiceState;
  isListening: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  activeLanguage: AppLanguage;
  currentTranscript: string;
  lastSpokenResponse: string;
  history: VoiceMessage[];
  availableVoices: Speech.Voice[];
  errorMessage?: string;
  audioLevel: number; // 0.0 to 1.0 for waveform animation
}

type VoiceStateListener = (state: VoiceSessionState) => void;

class VoiceService {
  private state: VoiceSessionState = {
    voiceState: 'IDLE',
    isListening: false,
    isSpeaking: false,
    isMuted: false,
    activeLanguage: 'en',
    currentTranscript: '',
    lastSpokenResponse: '',
    history: [],
    availableVoices: [],
    audioLevel: 0,
  };

  private listeners: Set<VoiceStateListener> = new Set();
  private audioLevelInterval: ReturnType<typeof setInterval> | null = null;
  private recognitionInstance: any = null;
  private hasInitializedVoices: boolean = false;

  constructor() {
    this.initAvailableVoices();
  }

  private async initAvailableVoices(): Promise<void> {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      this.state.availableVoices = voices;
      this.hasInitializedVoices = true;
    } catch {
      this.hasInitializedVoices = true;
    }
  }

  public subscribe(listener: VoiceStateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const currentState = this.getState();
    this.listeners.forEach((listener) => listener(currentState));
  }

  public getState(): VoiceSessionState {
    return { ...this.state };
  }

  public setLanguage(lang: AppLanguage): void {
    this.state.activeLanguage = lang;
    this.notify();
  }

  public setVoiceState(voiceState: VoiceState, errorMsg?: string): void {
    this.state.voiceState = voiceState;
    if (errorMsg) {
      this.state.errorMessage = errorMsg;
    }
    this.notify();
  }

  public toggleMute(): boolean {
    this.state.isMuted = !this.state.isMuted;
    if (this.state.isMuted && this.state.isSpeaking) {
      this.stopSpeaking();
    }
    this.notify();
    return this.state.isMuted;
  }

  /**
   * Resolves appropriate BCP-47 language tag for TTS & STT.
   */
  public getLocaleTag(lang?: AppLanguage): string {
    const target = lang || this.state.activeLanguage;
    switch (target) {
      case 'az':
        return 'az-AZ';
      case 'tr':
        return 'tr-TR';
      case 'en':
      default:
        return 'en-US';
    }
  }

  /**
   * Starts listening to user speech via Web Speech API or simulated streaming buffer.
   */
  public async startListening(onTranscriptionResult?: (text: string) => void): Promise<void> {
    if (this.state.isSpeaking) {
      await this.stopSpeaking();
    }

    this.state.isListening = true;
    this.state.voiceState = 'LISTENING';
    this.state.currentTranscript = '';
    this.startAudioLevelSimulation();
    this.notify();

    // Check for browser / webview SpeechRecognition
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          if (this.recognitionInstance) {
            this.recognitionInstance.abort();
          }

          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = true;
          recognition.lang = this.getLocaleTag();

          recognition.onresult = (event: any) => {
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                const finalTranscript = event.results[i][0].transcript;
                this.state.currentTranscript = finalTranscript;
                this.notify();
                if (onTranscriptionResult) {
                  onTranscriptionResult(finalTranscript);
                }
              } else {
                interim += event.results[i][0].transcript;
                this.state.currentTranscript = interim;
                this.notify();
              }
            }
          };

          recognition.onerror = (e: any) => {
            console.warn('Speech recognition notice:', e.error);
            this.state.isListening = false;
            this.state.voiceState = 'IDLE';
            this.stopAudioLevelSimulation();
            this.notify();
          };

          recognition.onend = () => {
            this.state.isListening = false;
            this.stopAudioLevelSimulation();
            this.notify();
          };

          this.recognitionInstance = recognition;
          recognition.start();
          return;
        } catch (e) {
          console.warn('Could not launch Web Speech recognition:', e);
        }
      }
    }
  }

  /**
   * Stops listening to microphone.
   */
  public stopListening(): void {
    if (this.recognitionInstance) {
      try {
        this.recognitionInstance.stop();
      } catch {
        // Ignore if already stopped
      }
      this.recognitionInstance = null;
    }
    this.state.isListening = false;
    this.stopAudioLevelSimulation();
    if (this.state.voiceState === 'LISTENING') {
      this.state.voiceState = 'IDLE';
    }
    this.notify();
  }

  /**
   * Manually supplies a transcribed speech query (e.g. from user voice prompt chips or speech input).
   */
  public injectSpokenQuery(queryText: string): void {
    this.state.currentTranscript = queryText;
    this.notify();
  }

  /**
   * Speaks the response aloud using expo-speech with interruption support.
   */
  public async speakResponse(
    text: string,
    language?: AppLanguage,
    onSpeechDone?: () => void
  ): Promise<void> {
    if (this.state.isMuted) {
      this.recordMessage('ai', text, language || this.state.activeLanguage);
      this.state.voiceState = 'IDLE';
      this.notify();
      if (onSpeechDone) onSpeechDone();
      return;
    }

    try {
      const isSpeaking = await Speech.isSpeakingAsync();
      if (isSpeaking) {
        await Speech.stop();
      }
    } catch {
      // Ignore check error
    }

    const lang = language || this.state.activeLanguage;
    const locale = this.getLocaleTag(lang);

    this.state.isSpeaking = true;
    this.state.voiceState = 'SPEAKING';
    this.state.lastSpokenResponse = text;
    this.startAudioLevelSimulation();
    this.notify();

    // Clean text for speech (strip markdown asterisks, bracket citations, URLs)
    const speechCleanedText = text
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/•/g, '')
      .trim();

    Speech.speak(speechCleanedText, {
      language: locale,
      pitch: 1.0,
      rate: 1.05,
      onStart: () => {
        this.state.isSpeaking = true;
        this.state.voiceState = 'SPEAKING';
        this.notify();
      },
      onDone: () => {
        this.state.isSpeaking = false;
        this.stopAudioLevelSimulation();
        this.state.voiceState = 'IDLE';
        this.recordMessage('ai', text, lang);
        this.notify();
        if (onSpeechDone) {
          onSpeechDone();
        }
      },
      onStopped: () => {
        this.state.isSpeaking = false;
        this.stopAudioLevelSimulation();
        this.state.voiceState = 'INTERRUPTED';
        this.notify();
        setTimeout(() => {
          if (this.state.voiceState === 'INTERRUPTED') {
            this.state.voiceState = 'IDLE';
            this.notify();
          }
        }, 1500);
      },
      onError: (err) => {
        console.warn('Speech synthesis notice:', err);
        this.state.isSpeaking = false;
        this.stopAudioLevelSimulation();
        this.state.voiceState = 'IDLE';
        this.recordMessage('ai', text, lang);
        this.notify();
        if (onSpeechDone) {
          onSpeechDone();
        }
      },
    });
  }

  /**
   * Interrupts AI speech immediately.
   */
  public async stopSpeaking(): Promise<void> {
    try {
      await Speech.stop();
    } catch (e) {
      console.warn('Error stopping speech:', e);
    }
    this.state.isSpeaking = false;
    this.stopAudioLevelSimulation();
    this.state.voiceState = 'INTERRUPTED';
    this.notify();

    setTimeout(() => {
      if (this.state.voiceState === 'INTERRUPTED') {
        this.state.voiceState = 'IDLE';
        this.notify();
      }
    }, 1200);
  }

  /**
   * Records a voice conversation turn in local memory.
   */
  public recordMessage(
    sender: 'user' | 'ai',
    text: string,
    language: AppLanguage,
    latencyMs?: number
  ): void {
    const msg: VoiceMessage = {
      id: `voice_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sender,
      text,
      language,
      timestamp: new Date().toISOString(),
      latencyMs,
    };
    this.state.history.push(msg);
    if (this.state.history.length > 50) {
      this.state.history.shift();
    }
    this.notify();
  }

  public clearHistory(): void {
    this.state.history = [];
    this.state.currentTranscript = '';
    this.state.lastSpokenResponse = '';
    this.notify();
  }

  private startAudioLevelSimulation(): void {
    if (this.audioLevelInterval) {
      clearInterval(this.audioLevelInterval);
    }
    this.audioLevelInterval = setInterval(() => {
      if (this.state.isSpeaking || this.state.isListening) {
        // Produce reactive wave fluctuation
        const rand = 0.2 + Math.random() * 0.8;
        this.state.audioLevel = rand;
      } else {
        this.state.audioLevel = 0.05;
      }
      this.notify();
    }, 120);
  }

  private stopAudioLevelSimulation(): void {
    if (this.audioLevelInterval) {
      clearInterval(this.audioLevelInterval);
      this.audioLevelInterval = null;
    }
    this.state.audioLevel = 0;
    this.notify();
  }
}

export const voiceService = new VoiceService();
