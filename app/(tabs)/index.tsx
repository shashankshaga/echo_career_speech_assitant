import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

const RESUME_STORAGE_KEY = "stored_resume_text";

export default function HomeScreen() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<string>("");
  const [resumeText, setResumeText] = useState<string>("");
  const [hasResume, setHasResume] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  useEffect(() => {
    loadSavedResume();
  }, []);

  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync().catch((error) => {
          console.log("Cleanup error (safe to ignore):", error);
        });
      }
    };
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (recording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [recording]);

  async function loadSavedResume() {
    try {
      const saved = await AsyncStorage.getItem(RESUME_STORAGE_KEY);
      if (saved) {
        setResumeText(saved);
        setHasResume(true);
        console.log("Resume loaded from storage");
      }
    } catch (error) {
      console.error("Error loading resume:", error);
    }
  }

  async function uploadResume() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "text/plain"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];

        setIsProcessing(true);
        setFeedback("Extracting text from document...");

        let content = "";

        if (file.mimeType === "text/plain") {
          content = await FileSystem.readAsStringAsync(file.uri);
        } else if (file.mimeType === "application/pdf") {
          const base64 = await FileSystem.readAsStringAsync(file.uri, {
            encoding: "base64",
          });
          content = await extractPDFText(base64);

          if (!content || content.trim().length < 10) {
            Alert.alert(
              "Unable to Extract Text",
              "Could not extract text from this PDF. Please try:\n\n1. A different PDF\n2. Converting to .txt file\n3. Copy/paste text manually",
            );
            setIsProcessing(false);
            setFeedback("");
            return;
          }
        }

        await AsyncStorage.setItem(RESUME_STORAGE_KEY, content);
        setResumeText(content);
        setHasResume(true);

        Alert.alert("Success", `Resume saved! (${content.length} characters)`);
        setFeedback("");
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Error uploading resume:", error);
      Alert.alert("Error", "Failed to upload resume");
      setIsProcessing(false);
      setFeedback("");
    }
  }

  async function extractPDFText(base64: string): Promise<string> {
    try {
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      let pdfString = "";
      for (let i = 0; i < bytes.length; i++) {
        pdfString += String.fromCharCode(bytes[i]);
      }

      const matches = pdfString.match(/\(([^)]+)\)/g);

      if (!matches) {
        return "";
      }

      const text = matches
        .map((match) => match.slice(1, -1))
        .join(" ")
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "")
        .replace(/\\t/g, " ")
        .replace(/\\\(/g, "(")
        .replace(/\\\)/g, ")")
        .replace(/\\\\/g, "\\")
        .replace(/\s+/g, " ")
        .trim();

      console.log("Extracted text length:", text.length);
      console.log("Preview:", text.substring(0, 100));

      return text;
    } catch (error) {
      console.error("PDF extraction error:", error);
      return "";
    }
  }

  async function clearResume() {
    try {
      await AsyncStorage.removeItem(RESUME_STORAGE_KEY);
      setResumeText("");
      setHasResume(false);
      Alert.alert("Success", "Resume cleared");
    } catch (error) {
      console.error("Error clearing resume:", error);
    }
  }

  async function startRecording() {
    if (!hasResume) {
      Alert.alert("No Resume", "Please upload your resume first!");
      return;
    }

    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== "granted") {
        alert("Permission to access microphone is required!");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync({
        isMeteringEnabled: true,
        android: {
          extension: ".wav",
          outputFormat: Audio.AndroidOutputFormat.DEFAULT,
          audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: ".wav",
          outputFormat: Audio.IOSOutputFormat.LINEARPCM,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {},
      });

      setRecording(recording);
    } catch (err) {
      console.error("Failed to start recording", err);
      alert("Recording failed to start. Check your console for details.");
    }
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  function copyFeedback() {
    if (feedback) {
      Clipboard.setString(feedback);
      Alert.alert(
        "Copied!",
        "Feedback copied to clipboard. Go to Analytics to paste it into a contact.",
      );
    }
  }

  async function stopAndAnalyze() {
    if (!recording) return;

    setRecording(null);
    setIsProcessing(true);
    setFeedback("Thinking...");

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (uri) {
        const base64Audio = await FileSystem.readAsStringAsync(uri, {
          encoding: "base64",
        });

        const response = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer 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`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://expo.dev",
              "X-Title": "Career Coach App",
            },
            body: JSON.stringify({
              model: "openai/gpt-audio",
              modalities: ["text"],
              messages: [
                {
                  role: "system",
                  content: `You are an expert career coach. Here is the user's resume for context:\n\n${resumeText}\n\nAnalyze their interview answer for confidence, pacing, filler words, and how well it aligns with their background.`,
                },
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: "Listen to this interview answer and provide feedback using his resume and what he could have said better by showing examples.",
                    },
                    {
                      type: "input_audio",
                      input_audio: { data: base64Audio, format: "wav" },
                    },
                  ],
                },
              ],
            }),
          },
        );

        const data = await response.json();

        if (data.error) {
          setFeedback(
            `API Error: ${data.error.message || JSON.stringify(data.error)}`,
          );
        } else {
          setFeedback(
            data.choices[0]?.message?.content || "Could not analyze audio.",
          );
        }
      }
    } catch (error) {
      setFeedback(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <ThemedText style={styles.brandText}>
            INTEL - Your Personal Career Coach
          </ThemedText>
          <ThemedText style={styles.titleText}>INTEL COACH</ThemedText>
        </View>

        <View style={styles.main}>
          <ThemedView style={styles.resumeStatus}>
            <View>
              <ThemedText style={styles.label}>UPLOAD_RESUME</ThemedText>
              <ThemedText style={styles.statusText}>
                {hasResume ? "RESUME: ACTIVE" : "RESUME: NO_DATA"}
              </ThemedText>
            </View>
            <TouchableOpacity
              onPress={hasResume ? clearResume : uploadResume}
              style={styles.smallButton}
            >
              <ThemedText style={styles.smallButtonText}>
                {hasResume ? "CLEAR" : "UPLOAD"}
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>

          <ThemedText style={styles.instruction}>
            {recording
              ? `RECORDING: ${formatTime(recordingTime)}`
              : "READY_FOR_COMMUNICATION"}
          </ThemedText>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={recording ? stopAndAnalyze : startRecording}
            disabled={isProcessing}
            style={styles.recordButtonContainer}
          >
            <LinearGradient
              colors={
                recording ? ["#FF1A1A", "#800000"] : ["#FF6B00", "#FF9500"]
              }
              style={styles.recordButton}
            >
              {isProcessing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={recording ? styles.stopIcon : styles.startIcon} />
              )}
            </LinearGradient>
          </TouchableOpacity>

          {feedback ? (
            <ThemedView style={styles.feedbackBox}>
              <ThemedText style={styles.feedbackLabel}>
                INTEL_REPORT_
              </ThemedText>
              <ThemedText style={styles.feedbackText}>{feedback}</ThemedText>

              <TouchableOpacity
                onPress={copyFeedback}
                style={styles.copyButton}
              >
                <ThemedText style={styles.copyButtonText}>
                  📋 COPY TO CLIPBOARD
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          ) : null}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050505",
  },
  scrollContent: {
    paddingTop: 80,
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  header: {
    marginBottom: 30,
  },
  brandText: {
    color: "#FF6B00",
    fontSize: 10,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    letterSpacing: 3,
    marginBottom: 4,
  },
  titleText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -1,
    paddingTop: 15,
  },
  main: {
    alignItems: "center",
    gap: 30,
  },
  resumeStatus: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#111",
    borderLeftWidth: 3,
    borderLeftColor: "#FF6B00",
  },
  label: {
    color: "#666",
    fontSize: 9,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  statusText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  smallButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FF6B00",
    borderRadius: 2,
  },
  smallButtonText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
  },
  instruction: {
    textAlign: "center",
    fontSize: 12,
    color: "#444",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  recordButtonContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    padding: 6,
    borderWidth: 1,
    borderColor: "#222",
  },
  recordButton: {
    width: "100%",
    height: "100%",
    borderRadius: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  startIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FFF",
  },
  stopIcon: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: "#FFF",
  },
  feedbackBox: {
    width: "100%",
    padding: 24,
    backgroundColor: "#111",
    borderTopWidth: 1,
    borderTopColor: "#222",
  },
  feedbackLabel: {
    color: "#FF6B00",
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 12,
  },
  feedbackText: {
    color: "#AAA",
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 16,
  },
  copyButton: {
    backgroundColor: "#FF6B00",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 4,
    alignItems: "center",
    marginTop: 8,
  },
  copyButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },
});
