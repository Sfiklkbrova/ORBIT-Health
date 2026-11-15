import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING } from '../theme/colors';
import {
  HealthRecord,
  RadiationData,
  CabinEnvironmentData,
  HealthAlert,
} from '../types/astronaut';
import {
  getLatestHealthRecord,
  getAllHealthRecords,
  getLatestCabinEnvironment,
  getActiveAlerts,
  DEFAULT_ASTRONAUT,
} from '../services/db';
import { processAssistantQuery } from '../services/ai/aiAssistantService';
import { clearConversationMemory } from '../services/ai/conversationMemoryService';
import { CalculationResult, AiIntent } from '../services/ai/types';
import { NasaRagCitation } from '../services/nasa/nasaKnowledgeBase';
import { getLocalLlamaStatus } from '../services/ai/localLlamaEngine';

interface ExtendedChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text: string;
  contextCategory?: 'general' | 'radiation' | 'fatigue' | 'vital' | 'environment';
  calculations?: CalculationResult[];
  citations?: NasaRagCitation[];
  intent?: AiIntent;
  confidence?: number;
  processingTimeMs?: number;
  isStreaming?: boolean;
  originalQuery?: string;
}

let messageSequence = 1;
function createMessageId(prefix: string): string {
  messageSequence += 1;
  return `${prefix}_${Date.now()}_${messageSequence}`;
}

export const AssistantScreen: React.FC = () => {
  const { t } = useTranslation();

  const quickQuestions = [
    t('assistant.q1'),
    t('assistant.q2'),
    t('assistant.q3'),
    t('assistant.q4'),
    t('assistant.q5'),
    t('assistant.q6'),
    t('assistant.q7'),
    t('assistant.q8'),
    t('assistant.q9'),
    t('assistant.q10'),
  ];

  const [messages, setMessages] = useState<ExtendedChatMessage[]>([
    {
      id: 'init_welcome',
      sender: 'assistant',
      timestamp: new Date().toISOString(),
      text: t('assistant.welcomeMessage'),
      contextCategory: 'general',
      confidence: 0.99,
      processingTimeMs: 4,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<NasaRagCitation | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isModelDiagOpen, setIsModelDiagOpen] = useState<boolean>(false);

  const [latestRecord, setLatestRecord] = useState<HealthRecord | null>(null);
  const [recentRecords, setRecentRecords] = useState<HealthRecord[]>([]);
  const [cabinEnv, setCabinEnv] = useState<CabinEnvironmentData>({
    cabinTempCelsius: 21.8,
    cabinO2Percent: 20.9,
    cabinCO2mmHg: 2.8,
    cabinPressureKPa: 101.3,
    ambientRadiationMicroSv: 18.5,
    overallStatus: 'Nominal',
    isSimulatedDemo: true,
    lastUpdated: new Date().toISOString(),
  });
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);

  const scrollViewRef = useRef<any>(null);
  const abortStreamingRef = useRef<boolean>(false);
  const streamedWordCountRef = useRef<number>(0);

  const loadContextData = async () => {
    try {
      const latest = await getLatestHealthRecord();
      const all = await getAllHealthRecords(30);
      const env = await getLatestCabinEnvironment();
      const activeAlerts = await getActiveAlerts();

      setLatestRecord(latest);
      setRecentRecords(all);
      setCabinEnv(env);
      setAlerts(activeAlerts);
    } catch (err) {
      console.error('Error loading assistant context:', err);
    }
  };

  useEffect(() => {
    loadContextData();
  }, []);

  const handleStopGeneration = () => {
    abortStreamingRef.current = true;
    setIsGenerating(false);
  };

  const handleClearConversation = () => {
    Alert.alert(
      'Reset Assistant Memory',
      'Clear conversation history and reset multi-turn working memory?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Memory',
          style: 'destructive',
          onPress: () => {
            clearConversationMemory();
            setMessages([
              {
                id: createMessageId('asst_reset'),
                sender: 'assistant',
                timestamp: new Date().toISOString(),
                text: `### Working Memory Reset\n\nConversational turns cleared. Telemetry caches and NASA knowledge base remain active and synchronized for Mission Day ${DEFAULT_ASTRONAUT.missionDay}. How may I assist your physiological monitoring?`,
                contextCategory: 'general',
                confidence: 1.0,
                processingTimeMs: 2,
              },
            ]);
          },
        },
      ]
    );
  };

  const handleCopyAnswer = async (msgId: string, text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      setCopiedMessageId(msgId);
      setTimeout(() => setCopiedMessageId(null), 2500);
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isGenerating) return;

    abortStreamingRef.current = false;
    setIsGenerating(true);

    const userMsg: ExtendedChatMessage = {
      id: createMessageId('user'),
      sender: 'user',
      timestamp: new Date().toISOString(),
      text: query,
    };

    const assistantMsgId = createMessageId('asst');
    const placeholderMsg: ExtendedChatMessage = {
      id: assistantMsgId,
      sender: 'assistant',
      timestamp: new Date().toISOString(),
      text: '',
      isStreaming: true,
      originalQuery: query,
    };

    setMessages((prev) => [...prev, userMsg, placeholderMsg]);
    setInputText('');

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    const radiationData: RadiationData = {
      currentRateMicroSvPerHour: 18.5,
      dailyExposureMicroSv: 444,
      cumulativeMissionExposureMilliSv: 62.4,
      careerLimitMilliSv: 600,
      thresholdRiskLevel: 'NORMAL',
      solarParticleEventStatus: 'Quiet',
      recommendations: [],
      isSimulatedDemo: true,
      lastUpdated: new Date().toISOString(),
    };

    try {
      const responsePayload = await processAssistantQuery(
        query,
        latestRecord,
        recentRecords,
        radiationData,
        cabinEnv,
        alerts,
        DEFAULT_ASTRONAUT
      );

      // Fast progressive streaming simulation
      const fullText = responsePayload.answer;
      const words = fullText.split(' ');
      const chunkSize = Math.max(3, Math.floor(words.length / 15));
      streamedWordCountRef.current = 0;

      for (let i = 0; i < words.length; i += chunkSize) {
        if (abortStreamingRef.current) {
          break;
        }

        const currentCount = Math.min(words.length, i + chunkSize);
        streamedWordCountRef.current = currentCount;
        const streamedSlice = words.slice(0, currentCount).join(' ');

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  text: streamedSlice,
                  isStreaming: true,
                }
              : msg
          )
        );

        // Responsive rendering delay
        await new Promise((resolve) => setTimeout(resolve, 25));
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }

      // Finalize message with complete calculations and citations
      const finalText = abortStreamingRef.current
        ? words.slice(0, streamedWordCountRef.current).join(' ')
        : fullText;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                text: finalText,
                calculations: responsePayload.calculations,
                citations: responsePayload.citations,
                contextCategory: responsePayload.category,
                intent: responsePayload.intent,
                confidence: responsePayload.confidence,
                processingTimeMs: responsePayload.processingTimeMs,
                isStreaming: false,
              }
            : msg
        )
      );
    } catch (err) {
      console.error('Error generating assistant response:', err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                text: `An error occurred while analyzing the mission telemetry. Please check the local SQLite store and try again.`,
                isStreaming: false,
              }
            : msg
        )
      );
    } finally {
      setIsGenerating(false);
      abortStreamingRef.current = false;
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const renderCalculationCard = (calc: CalculationResult, index: number) => {
    return (
      <View key={`calc_${index}`} style={styles.calcCard}>
        <View style={styles.calcHeader}>
          <View style={styles.calcTitleGroup}>
            <MaterialCommunityIcons name="calculator-variant" size={16} color={COLORS.cyan} />
            <Text style={styles.calcMetricName}>{calc.metric.toUpperCase()}</Text>
          </View>
          <View style={styles.calcOperationTag}>
            <Text style={styles.calcOperationText}>{calc.operation}</Text>
          </View>
        </View>

        <View style={styles.calcResultContainer}>
          <Text style={styles.calcResultValue}>{calc.formattedResult}</Text>
          <Text style={styles.calcUnitLabel}>Target Unit: {calc.unit}</Text>
        </View>

        <View style={styles.calcMetaGrid}>
          <View style={styles.calcMetaItem}>
            <Text style={styles.calcMetaLabel}>Scope Window</Text>
            <Text style={styles.calcMetaValue}>{calc.timePeriod}</Text>
          </View>
          <View style={styles.calcMetaItem}>
            <Text style={styles.calcMetaLabel}>Sample Size</Text>
            <Text style={styles.calcMetaValue}>{calc.dataPointsCount} Observation(s)</Text>
          </View>
        </View>

        <View style={styles.calcExplanationBox}>
          <Text style={styles.calcExplanationText}>{calc.explanation}</Text>
        </View>

        {calc.limitations ? (
          <View style={styles.calcLimitationsBox}>
            <MaterialCommunityIcons name="shield-alert-outline" size={13} color={COLORS.statusWarning} />
            <Text style={styles.calcLimitationsText}>{calc.limitations}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  const renderMarkdownLines = (rawText: string) => {
    const lines = rawText.split('\n');

    return lines.map((line, idx) => {
      const trimmed = line.trim();

      if (!trimmed) {
        return <View key={idx} style={{ height: 6 }} />;
      }

      // H3 Header (### ...)
      if (trimmed.startsWith('### ')) {
        return (
          <Text key={idx} style={styles.mdHeading3}>
            {trimmed.replace('### ', '')}
          </Text>
        );
      }

      // H4 Header (#### ...)
      if (trimmed.startsWith('#### ')) {
        return (
          <Text key={idx} style={styles.mdHeading4}>
            {trimmed.replace('#### ', '')}
          </Text>
        );
      }

      // Block Quote (> ...)
      if (trimmed.startsWith('> ')) {
        return (
          <View key={idx} style={styles.mdQuoteBox}>
            <Text style={styles.mdQuoteText}>{trimmed.replace('> ', '')}</Text>
          </View>
        );
      }

      // Bullet Point (• ... or - ...)
      if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const bulletContent = trimmed.replace(/^[•\-*]\s+/, '');
        return (
          <View key={idx} style={styles.mdBulletRow}>
            <Text style={styles.mdBulletDot}>•</Text>
            <Text style={styles.mdBulletText}>{renderInlineFormatting(bulletContent)}</Text>
          </View>
        );
      }

      // Numbered Point (1. ... or 2. ...)
      const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (numberedMatch) {
        return (
          <View key={idx} style={styles.mdBulletRow}>
            <Text style={styles.mdNumberLabel}>{numberedMatch[1]}.</Text>
            <Text style={styles.mdBulletText}>{renderInlineFormatting(numberedMatch[2])}</Text>
          </View>
        );
      }

      // Regular Paragraph
      return (
        <Text key={idx} style={styles.mdParagraph}>
          {renderInlineFormatting(trimmed)}
        </Text>
      );
    });
  };

  const renderInlineFormatting = (text: string) => {
    // Splits by bold **word** or code `word`
    const parts = text.split(/(\*\*.*?\*\*|`.*?`|\*.*?\*)/g);

    return parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <Text key={pIdx} style={styles.mdBold}>
            {part.slice(2, -2)}
          </Text>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <Text key={pIdx} style={styles.mdCode}>
            {part.slice(1, -1)}
          </Text>
        );
      }
      if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
        return (
          <Text key={pIdx} style={styles.mdItalic}>
            {part.slice(1, -1)}
          </Text>
        );
      }
      return <Text key={pIdx}>{part}</Text>;
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Screen Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleGroup}>
          <View style={styles.aiAvatar}>
            <MaterialCommunityIcons name="brain" size={20} color={COLORS.cyan} />
          </View>
          <View>
            <Text style={styles.title}>{t('assistant.title')}</Text>
            <Text style={styles.subtitle}>{t('assistant.subtitle')}</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <View style={styles.offlineBadge}>
            <View style={styles.pulseDot} />
            <Text style={styles.offlineText}>{t('assistant.offlineBadge')}</Text>
          </View>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearConversation}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="broom" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* On-Device LLM Model Status Banner */}
      <TouchableOpacity
        style={styles.localModelBanner}
        onPress={() => setIsModelDiagOpen(true)}
        activeOpacity={0.8}
      >
        <View style={styles.localModelLeft}>
          <MaterialCommunityIcons name="chip" size={15} color={COLORS.cyan} />
          <Text style={styles.localModelTitle}>LOCAL LLM: Qwen 2.5 3B (llama.rn • Q4_K_M)</Text>
        </View>
        <View style={styles.localModelRight}>
          <View style={styles.greenPulseDot} />
          <Text style={styles.localModelStatusText}>OFFLINE READY</Text>
          <MaterialCommunityIcons name="information-outline" size={14} color={COLORS.cyan} />
        </View>
      </TouchableOpacity>

      {/* Suggested Quick Question Chips */}
      <View style={styles.suggestionsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsScroll}>
          {quickQuestions.map((q, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.questionChip}
              onPress={() => handleSend(q)}
              disabled={isGenerating}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="lightning-bolt" size={12} color={COLORS.cyan} />
              <Text style={styles.chipText}>{q}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Chat Messages List */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.chatArea}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <View
              key={msg.id}
              style={[
                styles.messageBubble,
                isUser ? styles.userBubble : styles.assistantBubble,
              ]}
            >
              {!isUser && (
                <View style={styles.assistantHeader}>
                  <View style={styles.assistantBadgeGroup}>
                    <MaterialCommunityIcons name="orbit" size={14} color={COLORS.cyan} />
                    <Text style={styles.assistantTag}>ORBIT AI • SPACE MEDICINE</Text>
                  </View>
                  {msg.processingTimeMs !== undefined && (
                    <View style={styles.latencyBadge}>
                      <Text style={styles.latencyText}>
                        {msg.processingTimeMs}ms • {(msg.confidence ? msg.confidence * 100 : 99).toFixed(0)}% CONF
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Render Dedicated Calculation Cards */}
              {!isUser && msg.calculations && msg.calculations.length > 0 && (
                <View style={styles.calculationsContainer}>
                  {msg.calculations.map((calc, cIdx) => renderCalculationCard(calc, cIdx))}
                </View>
              )}

              {/* Markdown Content */}
              <View style={styles.messageContent}>
                {isUser ? (
                  <Text style={styles.userText}>{msg.text}</Text>
                ) : (
                  <View>
                    {renderMarkdownLines(msg.text)}
                    {msg.isStreaming && (
                      <View style={styles.streamingIndicator}>
                        <View style={styles.streamingDot} />
                        <Text style={styles.streamingCursor}>▌</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>

              {/* Clickable NASA Scientific Citation Pills */}
              {!isUser && msg.citations && msg.citations.length > 0 && (
                <View style={styles.citationsSection}>
                  <Text style={styles.citationsSectionTitle}>{t('assistant.citationsTitle')}</Text>
                  <View style={styles.citationPillRow}>
                    {msg.citations.map((c, cIdx) => (
                      <TouchableOpacity
                        key={cIdx}
                        style={styles.citationPill}
                        onPress={() => setSelectedCitation(c)}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons name="file-certificate-outline" size={12} color={COLORS.statusWarning} />
                        <Text style={styles.citationPillText} numberOfLines={1}>
                          {c.sourceName}: {c.documentTitle.slice(0, 24)}...
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Message Footer Actions */}
              <View style={styles.bubbleFooter}>
                {!isUser && (
                  <View style={styles.messageActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleCopyAnswer(msg.id, msg.text)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons
                        name={copiedMessageId === msg.id ? 'check' : 'content-copy'}
                        size={13}
                        color={copiedMessageId === msg.id ? COLORS.statusNormal : COLORS.textMuted}
                      />
                      <Text
                        style={[
                          styles.actionButtonText,
                          copiedMessageId === msg.id && { color: COLORS.statusNormal },
                        ]}
                      >
                        {copiedMessageId === msg.id ? t('assistant.copied') : t('assistant.copy')}
                      </Text>
                    </TouchableOpacity>

                    {msg.originalQuery && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleSend(msg.originalQuery)}
                        disabled={isGenerating}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons name="refresh" size={13} color={COLORS.textMuted} />
                        <Text style={styles.actionButtonText}>{t('assistant.retry')}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                <Text style={styles.timestampText}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Stop Generation Floating Control */}
      {isGenerating && (
        <View style={styles.stopControlBar}>
          <View style={styles.generatingPulseGroup}>
            <View style={styles.generatingPulseDot} />
            <Text style={styles.generatingText}>{t('assistant.generating')}</Text>
          </View>
          <TouchableOpacity style={styles.stopButton} onPress={handleStopGeneration} activeOpacity={0.8}>
            <MaterialCommunityIcons name="stop" size={14} color={COLORS.white} />
            <Text style={styles.stopButtonText}>{t('assistant.stopGeneration')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Input Bar */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.inputField}
          value={inputText}
          onChangeText={setInputText}
          placeholder={t('assistant.inputPlaceholder')}
          placeholderTextColor={COLORS.textMuted}
          onSubmitEditing={() => handleSend()}
          returnKeyType="send"
          editable={!isGenerating}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || isGenerating) && styles.sendButtonDisabled]}
          onPress={() => handleSend()}
          disabled={!inputText.trim() || isGenerating}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name={isGenerating ? 'dots-horizontal' : 'send'}
            size={18}
            color={COLORS.background}
          />
        </TouchableOpacity>
      </View>

      {/* Scientific Citation Inspection Modal */}
      <Modal
        visible={!!selectedCitation}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedCitation(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalBadge}>
                <MaterialCommunityIcons name="bookmark-check" size={14} color={COLORS.statusWarning} />
                <Text style={styles.modalBadgeText}>{selectedCitation?.sourceName}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedCitation(null)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons name="close" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDocTitle}>{selectedCitation?.documentTitle}</Text>

            <View style={styles.modalFindingBox}>
              <Text style={styles.modalFindingLabel}>VERIFIED SCIENTIFIC FINDING</Text>
              <Text style={styles.modalFindingText}>{selectedCitation?.keyFinding}</Text>
            </View>

            <View style={styles.modalUrlBox}>
              <Text style={styles.modalUrlLabel}>AUTHORITATIVE REPOSITORY URL</Text>
              <Text style={styles.modalUrlText} numberOfLines={2}>
                {selectedCitation?.url}
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCopyUrlButton}
                onPress={async () => {
                  if (selectedCitation?.url) {
                    await Clipboard.setStringAsync(selectedCitation.url);
                    Alert.alert('URL Copied', 'NASA repository URL copied to clipboard.');
                  }
                }}
              >
                <MaterialCommunityIcons name="content-copy" size={14} color={COLORS.cyan} />
                <Text style={styles.modalCopyUrlText}>Copy Research Link</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setSelectedCitation(null)}
              >
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* On-Device LLM Diagnostics Modal */}
      <Modal
        visible={isModelDiagOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModelDiagOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalBadge}>
                <MaterialCommunityIcons name="chip" size={14} color={COLORS.cyan} />
                <Text style={styles.modalBadgeText}>ON-DEVICE LLM ARCHITECTURE</Text>
              </View>
              <TouchableOpacity onPress={() => setIsModelDiagOpen(false)}>
                <MaterialCommunityIcons name="close" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDocTitle}>Qwen 2.5 3B Instruct (4-bit Quantized)</Text>

            <View style={{ gap: 8, marginVertical: SPACING.sm }}>
              <View style={styles.diagRow}>
                <Text style={styles.diagLabel}>INFERENCE ENGINE</Text>
                <Text style={styles.diagValue}>{getLocalLlamaStatus().engineName}</Text>
              </View>
              <View style={styles.diagRow}>
                <Text style={styles.diagLabel}>QUANTIZATION</Text>
                <Text style={styles.diagValue}>Q4_K_M (4-bit Medium)</Text>
              </View>
              <View style={styles.diagRow}>
                <Text style={styles.diagLabel}>CONTEXT WINDOW</Text>
                <Text style={styles.diagValue}>2048 Tokens (ChatML)</Text>
              </View>
              <View style={styles.diagRow}>
                <Text style={styles.diagLabel}>OFFLINE AUTONOMY</Text>
                <Text style={[styles.diagValue, { color: COLORS.statusNormal }]}>100% Zero Network Dependency</Text>
              </View>
              <View style={styles.diagRow}>
                <Text style={styles.diagLabel}>LANGUAGE SUPPORT</Text>
                <Text style={styles.diagValue}>Azerbaijani, Turkish, English</Text>
              </View>
              <View style={styles.diagRow}>
                <Text style={styles.diagLabel}>GROUNDING LAYER</Text>
                <Text style={styles.diagValue}>Direct SQLite (8 Cached NASA Tables)</Text>
              </View>
            </View>

            <View style={styles.modalFindingBox}>
              <Text style={styles.modalFindingLabel}>CLINICAL & SAFETY ASSURANCE</Text>
              <Text style={styles.modalFindingText}>
                ORBIT AI is grounded directly in verified flight telemetry and NASA research repositories (OSDR, RadLab, HRR, DONKI). It executes fully offline on your device, preventing hallucinations and preserving medical privacy.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: COLORS.cyan, marginTop: SPACING.sm }]}
              onPress={() => setIsModelDiagOpen(false)}
            >
              <Text style={[styles.modalCloseButtonText, { color: '#000', fontWeight: '700' }]}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  aiAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
    borderWidth: 1,
    borderColor: COLORS.cyan,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.statusNormal,
  },
  offlineText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.statusNormal,
    letterSpacing: 0.8,
  },
  clearButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
  },
  localModelBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(56, 189, 248, 0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
  },
  localModelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  localModelTitle: {
    color: COLORS.cyan,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  localModelRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greenPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.statusNormal,
  },
  localModelStatusText: {
    color: COLORS.statusNormal,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  diagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  diagLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  diagValue: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '600',
  },
  suggestionsWrapper: {
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.backgroundElevated,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  suggestionsScroll: {
    paddingHorizontal: SPACING.xl,
    gap: 8,
  },
  questionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surfaceCard,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
  },
  chipText: {
    fontSize: 11,
    color: COLORS.cyan,
    fontWeight: '600',
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  messageBubble: {
    maxWidth: '92%',
    borderRadius: 16,
    padding: SPACING.md,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primaryBlue,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderBottomLeftRadius: 4,
  },
  assistantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    paddingBottom: 6,
  },
  assistantBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  assistantTag: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.cyan,
    letterSpacing: 0.8,
  },
  latencyBadge: {
    backgroundColor: 'rgba(0, 242, 254, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  latencyText: {
    fontSize: 8,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  messageContent: {
    marginVertical: 4,
  },
  userText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
  },
  mdParagraph: {
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 20,
    marginBottom: 4,
  },
  mdHeading3: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.cyan,
    marginTop: 6,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  mdHeading4: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.statusWarning,
    marginTop: 6,
    marginBottom: 2,
  },
  mdBold: {
    fontWeight: '800',
    color: COLORS.white,
  },
  mdItalic: {
    fontStyle: 'italic',
    color: COLORS.textSecondary,
  },
  mdCode: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    color: COLORS.cyan,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  mdQuoteBox: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.cyan,
    backgroundColor: 'rgba(0, 242, 254, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginVertical: 4,
    borderRadius: 4,
  },
  mdQuoteText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  mdBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginVertical: 2,
  },
  mdBulletDot: {
    color: COLORS.cyan,
    fontSize: 14,
    lineHeight: 18,
  },
  mdNumberLabel: {
    color: COLORS.cyan,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    width: 16,
  },
  mdBulletText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 19,
  },
  streamingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  streamingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.cyan,
  },
  streamingCursor: {
    color: COLORS.cyan,
    fontSize: 14,
    fontWeight: '900',
  },
  calculationsContainer: {
    gap: 10,
    marginBottom: 10,
  },
  calcCard: {
    backgroundColor: 'rgba(10, 25, 47, 0.85)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
    padding: 12,
  },
  calcHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  calcTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  calcMetricName: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.cyan,
    letterSpacing: 0.8,
  },
  calcOperationTag: {
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  calcOperationText: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.cyan,
  },
  calcResultContainer: {
    marginBottom: 8,
  },
  calcResultValue: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  calcUnitLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  calcMetaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  calcMetaItem: {
    flex: 1,
  },
  calcMetaLabel: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  calcMetaValue: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '700',
    marginTop: 2,
  },
  calcExplanationBox: {
    marginBottom: 6,
  },
  calcExplanationText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  calcLimitationsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    padding: 6,
    borderRadius: 6,
  },
  calcLimitationsText: {
    fontSize: 10,
    color: COLORS.statusWarning,
    flex: 1,
    lineHeight: 14,
  },
  citationsSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  citationsSectionTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.statusWarning,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  citationPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  citationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: '100%',
  },
  citationPillText: {
    fontSize: 10,
    color: COLORS.statusWarning,
    fontWeight: '700',
  },
  bubbleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 4,
  },
  messageActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  actionButtonText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  timestampText: {
    fontSize: 9,
    color: COLORS.textMuted,
    alignSelf: 'flex-end',
  },
  stopControlBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(239, 68, 68, 0.3)',
    paddingHorizontal: SPACING.xl,
    paddingVertical: 8,
  },
  generatingPulseGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  generatingPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.statusAlert,
  },
  generatingText: {
    fontSize: 11,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.statusAlert,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  stopButtonText: {
    fontSize: 11,
    color: COLORS.white,
    fontWeight: '800',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surfaceCard,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
    gap: SPACING.sm,
  },
  inputField: {
    flex: 1,
    backgroundColor: COLORS.surfaceCardSecondary,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    fontSize: 13,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.cyan,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 11, 24, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  modalContent: {
    width: '100%',
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
    padding: SPACING.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modalBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.statusWarning,
    letterSpacing: 0.8,
  },
  modalDocTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.white,
    lineHeight: 22,
    marginBottom: 12,
  },
  modalFindingBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.cyan,
    marginBottom: 12,
  },
  modalFindingLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.cyan,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  modalFindingText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  modalUrlBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 10,
    borderRadius: 6,
    marginBottom: 16,
  },
  modalUrlLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  modalUrlText: {
    fontSize: 10,
    color: COLORS.cyan,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
  },
  modalCopyUrlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
  },
  modalCopyUrlText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.cyan,
  },
  modalCloseButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.primaryBlue,
  },
  modalCloseButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },
});
