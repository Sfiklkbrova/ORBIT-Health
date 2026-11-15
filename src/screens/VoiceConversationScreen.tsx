// Real-Time Two-Way Voice Conversation Terminal with ORBIT AI
// Multilingual: Azerbaijani (az), Turkish (tr), English (en)
// Audio Waveform, Glowing Animated AI Orb, Interruption Handling & Full Space Medicine Engine

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../theme/colors';
import { SpaceBackground } from '../components/SpaceBackground';
import { AiVoiceOrb } from '../components/AiVoiceOrb';
import { AudioWaveform } from '../components/AudioWaveform';
import {
  voiceService,
  VoiceSessionState,
} from '../services/voiceService';
import { processUserQuery } from '../services/ai/aiAssistantService';
import { AppLanguage } from '../i18n';
import { MainNavTab } from '../types/astronaut';

interface VoiceConversationScreenProps {
  onNavigateTab?: (tab: MainNavTab) => void;
  onClose?: () => void;
}

export const VoiceConversationScreen: React.FC<VoiceConversationScreenProps> = ({
  onNavigateTab,
  onClose,
}) => {
  const [session, setSession] = useState<VoiceSessionState>(voiceService.getState());
  const [isProcessing, setIsProcessing] = useState(false);
  const pulseMicAnim = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef<any>(null);

  useEffect(() => {
    const unsubscribe = voiceService.subscribe((updated) => {
      setSession(updated);
    });
    return () => unsubscribe();
  }, []);

  // Pulsing animation for microphone button when active
  useEffect(() => {
    let animLoop: Animated.CompositeAnimation | null = null;
    if (session.isListening) {
      animLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseMicAnim, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseMicAnim, {
            toValue: 0.95,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      animLoop.start();
    } else {
      pulseMicAnim.setValue(1);
    }

    return () => {
      if (animLoop) animLoop.stop();
    };
  }, [session.isListening, pulseMicAnim]);

  const handleLanguageChange = (lang: AppLanguage) => {
    voiceService.setLanguage(lang);
  };

  /**
   * Processes a vocal query through the space medicine AI engine, speaks response aloud,
   * and records turn history.
   */
  const handleVocalQuery = async (queryText: string) => {
    if (!queryText.trim() || isProcessing) return;

    setIsProcessing(true);
    voiceService.recordMessage('user', queryText, session.activeLanguage);
    voiceService.setVoiceState('UNDERSTANDING');

    // Simulate multi-step cognitive pipeline state transitions
    setTimeout(() => {
      if (queryText.toLowerCase().includes('radiation') || queryText.toLowerCase().includes('nasa')) {
        voiceService.setVoiceState('RESEARCHING');
      } else {
        voiceService.setVoiceState('THINKING');
      }
    }, 400);

    try {
      const startTime = Date.now();
      const aiResponse = await processUserQuery(queryText, 'COMMANDER');
      const latency = Date.now() - startTime;

      // Speak response aloud using expo-speech in selected locale
      await voiceService.speakResponse(aiResponse.message, session.activeLanguage, () => {
        setIsProcessing(false);
      });
      voiceService.recordMessage('ai', aiResponse.message, session.activeLanguage, latency);
    } catch (err) {
      console.error('Voice processing error:', err);
      voiceService.setVoiceState('ERROR', 'Voice synthesis pipeline encountered an interruption.');
      setIsProcessing(false);
    }
  };

  const handleMicToggle = async () => {
    if (session.isSpeaking) {
      // User tapped mic while AI is speaking -> immediately interrupt AI
      await voiceService.stopSpeaking();
      return;
    }

    if (session.isListening) {
      voiceService.stopListening();
    } else {
      await voiceService.startListening((finalTranscript) => {
        handleVocalQuery(finalTranscript);
      });
    }
  };

  const handleStopSpeaking = async () => {
    await voiceService.stopSpeaking();
  };

  const handleQuickPrompt = (promptText: string) => {
    voiceService.injectSpokenQuery(promptText);
    handleVocalQuery(promptText);
  };

  const getStateLabel = () => {
    switch (session.voiceState) {
      case 'LISTENING':
        return 'ORBIT AI is listening to your speech...';
      case 'UNDERSTANDING':
        return 'Parsing spoken medical query & intent...';
      case 'RESEARCHING':
        return 'Querying NASA OSDR & RadLab radiation logs...';
      case 'THINKING':
        return 'Computing mathematical averages & trends...';
      case 'SPEAKING':
        return 'Speaking clinical response aloud...';
      case 'INTERRUPTED':
        return 'Audio interrupted. Ready for next query.';
      case 'ERROR':
        return 'Voice pipeline warning. Local audio active.';
      case 'IDLE':
      default:
        return 'Tap microphone or ask a space medicine question.';
    }
  };

  return (
    <SpaceBackground>
      <View style={styles.container}>
        {/* Top Mission Audio Nav Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => {
              if (onClose) onClose();
              else if (onNavigateTab) onNavigateTab('dashboard');
            }}
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.cyan} />
          </TouchableOpacity>

          {/* Language Selector Chips */}
          <View style={styles.langPills}>
            <TouchableOpacity
              style={[styles.langPill, session.activeLanguage === 'az' && styles.langPillActive]}
              onPress={() => handleLanguageChange('az')}
            >
              <Text style={styles.langFlag}>🇦🇿</Text>
              <Text style={[styles.langText, session.activeLanguage === 'az' && styles.langTextActive]}>
                AZ
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.langPill, session.activeLanguage === 'tr' && styles.langPillActive]}
              onPress={() => handleLanguageChange('tr')}
            >
              <Text style={styles.langFlag}>🇹🇷</Text>
              <Text style={[styles.langText, session.activeLanguage === 'tr' && styles.langTextActive]}>
                TR
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.langPill, session.activeLanguage === 'en' && styles.langPillActive]}
              onPress={() => handleLanguageChange('en')}
            >
              <Text style={styles.langFlag}>🇬🇧</Text>
              <Text style={[styles.langText, session.activeLanguage === 'en' && styles.langTextActive]}>
                EN
              </Text>
            </TouchableOpacity>
          </View>

          {/* Mute Toggle */}
          <TouchableOpacity
            style={[styles.muteBtn, session.isMuted && styles.muteBtnActive]}
            onPress={() => voiceService.toggleMute()}
          >
            <MaterialCommunityIcons
              name={session.isMuted ? 'volume-off' : 'volume-high'}
              size={20}
              color={session.isMuted ? COLORS.statusAlert : COLORS.cyan}
            />
          </TouchableOpacity>
        </View>

        {/* Center: Glowing Animated AI Orb & Waveform */}
        <View style={styles.orbCenterSection}>
          <AiVoiceOrb state={session.voiceState} audioLevel={session.audioLevel} size={180} />

          {/* Status Capsule */}
          <View style={styles.statusCapsule}>
            <View
              style={[
                styles.statusDot,
                session.voiceState === 'SPEAKING'
                  ? { backgroundColor: '#38BDF8' }
                  : session.voiceState === 'LISTENING'
                  ? { backgroundColor: COLORS.cyan }
                  : session.voiceState === 'THINKING' || session.voiceState === 'RESEARCHING'
                  ? { backgroundColor: '#A855F7' }
                  : { backgroundColor: COLORS.statusNormal },
              ]}
            />
            <Text style={styles.statusLabelText}>{getStateLabel()}</Text>
          </View>

          {/* Real-time Audio Waveform */}
          <AudioWaveform state={session.voiceState} audioLevel={session.audioLevel} height={36} />
        </View>

        {/* Live Conversation Subtitle / Transcript Box */}
        <View style={styles.transcriptCard}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.transcriptScroll}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {session.history.length === 0 && !session.currentTranscript && !isProcessing ? (
              <View style={styles.emptyPromptBox}>
                <MaterialCommunityIcons name="microphone-outline" size={20} color={COLORS.cyan} />
                <Text style={styles.emptyPromptText}>
                  &ldquo;ORBIT, how is my health today?&rdquo; or &ldquo;Calculate my radiation exposure&rdquo;
                </Text>
              </View>
            ) : null}

            {/* Conversation History */}
            {session.history.map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.msgRow,
                  msg.sender === 'user' ? styles.msgRowUser : styles.msgRowAi,
                ]}
              >
                <View
                  style={[
                    styles.msgBubble,
                    msg.sender === 'user' ? styles.msgBubbleUser : styles.msgBubbleAi,
                  ]}
                >
                  <Text style={styles.msgSenderTag}>
                    {msg.sender === 'user' ? 'COMMANDER' : 'ORBIT AI'}
                  </Text>
                  <Text style={styles.msgText}>{msg.text}</Text>
                  {msg.latencyMs ? (
                    <Text style={styles.msgLatency}>Latency: {msg.latencyMs}ms • TTS active</Text>
                  ) : null}
                </View>
              </View>
            ))}

            {/* Interim live speech transcript */}
            {session.currentTranscript ? (
              <View style={[styles.msgRow, styles.msgRowUser]}>
                <View style={[styles.msgBubble, styles.msgBubbleUser, { borderColor: COLORS.cyan }]}>
                  <Text style={styles.msgSenderTag}>SPEAKING NOW...</Text>
                  <Text style={styles.msgText}>{session.currentTranscript}</Text>
                </View>
              </View>
            ) : null}

            {isProcessing && (
              <View style={[styles.msgRow, styles.msgRowAi]}>
                <View style={[styles.msgBubble, styles.msgBubbleAi]}>
                  <ActivityIndicator size="small" color={COLORS.cyan} />
                  <Text style={[styles.msgText, { fontSize: 11, color: COLORS.cyan, marginTop: 4 }]}>
                    Synthesizing response & research citations...
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Quick Voice Prompt Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickPromptsScroll}>
          <TouchableOpacity
            style={styles.quickPromptChip}
            onPress={() => handleQuickPrompt('ORBIT, how is my health today?')}
          >
            <MaterialCommunityIcons name="heart-pulse" size={14} color={COLORS.cyan} />
            <Text style={styles.quickPromptText}>How is my health today?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickPromptChip}
            onPress={() => handleQuickPrompt('How much radiation have I accumulated?')}
          >
            <MaterialCommunityIcons name="radioactive" size={14} color="#F59E0B" />
            <Text style={styles.quickPromptText}>Radiation calculation</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickPromptChip}
            onPress={() => handleQuickPrompt('What does NASA say about sleep disruption in space?')}
          >
            <MaterialCommunityIcons name="bed-clock" size={14} color="#A855F7" />
            <Text style={styles.quickPromptText}>NASA sleep research</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickPromptChip}
            onPress={() => handleQuickPrompt('Compare my sleep this week with last week.')}
          >
            <MaterialCommunityIcons name="chart-bell-curve" size={14} color={COLORS.statusNormal} />
            <Text style={styles.quickPromptText}>Compare sleep records</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Bottom Control Deck */}
        <View style={styles.controlDeck}>
          {/* Stop / Interrupt Button */}
          {session.isSpeaking ? (
            <TouchableOpacity
              style={styles.interruptBtn}
              onPress={handleStopSpeaking}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="stop-circle" size={18} color={COLORS.statusAlert} />
              <Text style={styles.interruptText}>Stop Speaking</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => voiceService.clearHistory()}
            >
              <MaterialCommunityIcons name="broom" size={16} color={COLORS.textMuted} />
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          )}

          {/* Big Animated Center Microphone Button */}
          <Animated.View style={{ transform: [{ scale: pulseMicAnim }] }}>
            <TouchableOpacity
              style={[
                styles.bigMicBtn,
                session.isListening && styles.bigMicBtnListening,
                session.isSpeaking && styles.bigMicBtnSpeaking,
              ]}
              onPress={handleMicToggle}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={session.isSpeaking ? 'pause' : session.isListening ? 'waveform' : 'microphone'}
                size={36}
                color={COLORS.background}
              />
            </TouchableOpacity>
          </Animated.View>

          {/* End Session Button */}
          <TouchableOpacity
            style={styles.endBtn}
            onPress={() => {
              voiceService.stopListening();
              voiceService.stopSpeaking();
              if (onClose) onClose();
              else if (onNavigateTab) onNavigateTab('dashboard');
            }}
          >
            <MaterialCommunityIcons name="phone-hangup" size={18} color={COLORS.textSecondary} />
            <Text style={styles.endText}>End Call</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SpaceBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.md,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  langPills: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 18,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.2)',
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
  },
  langPillActive: {
    backgroundColor: 'rgba(0, 242, 254, 0.2)',
  },
  langFlag: {
    fontSize: 12,
  },
  langText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  langTextActive: {
    color: COLORS.cyan,
  },
  muteBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  muteBtnActive: {
    borderColor: COLORS.statusAlert,
  },
  orbCenterSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  statusCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.2)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabelText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  transcriptCard: {
    height: 160,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.15)',
    padding: SPACING.md,
  },
  transcriptScroll: {
    flex: 1,
  },
  emptyPromptBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyPromptText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  msgRow: {
    marginBottom: 8,
  },
  msgRowUser: {
    alignItems: 'flex-end',
  },
  msgRowAi: {
    alignItems: 'flex-start',
  },
  msgBubble: {
    maxWidth: '88%',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
  },
  msgBubbleUser: {
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    borderColor: 'rgba(0, 242, 254, 0.3)',
  },
  msgBubbleAi: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  msgSenderTag: {
    fontSize: 8.5,
    fontWeight: '900',
    color: COLORS.cyan,
    marginBottom: 2,
    letterSpacing: 0.8,
  },
  msgText: {
    fontSize: 11.5,
    color: COLORS.textPrimary,
    lineHeight: 16,
  },
  msgLatency: {
    fontSize: 8,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  quickPromptsScroll: {
    maxHeight: 38,
    marginVertical: 4,
  },
  quickPromptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  quickPromptText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  controlDeck: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: SPACING.md,
  },
  bigMicBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.cyan,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.cyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  bigMicBtnListening: {
    backgroundColor: '#38BDF8',
  },
  bigMicBtnSpeaking: {
    backgroundColor: '#A855F7',
  },
  interruptBtn: {
    alignItems: 'center',
    gap: 2,
  },
  interruptText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: COLORS.statusAlert,
  },
  clearBtn: {
    alignItems: 'center',
    gap: 2,
  },
  clearText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  endBtn: {
    alignItems: 'center',
    gap: 2,
  },
  endText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
});
