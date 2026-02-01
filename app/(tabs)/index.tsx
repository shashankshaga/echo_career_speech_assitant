import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

import { HelloWave } from "@/components/hello-wave";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

const RESUME_STORAGE_KEY = "stored_resume_text";

export default function HomeScreen() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<string>("");
  const [resumeText, setResumeText] = useState<string>("");
  const [hasResume, setHasResume] = useState(false);

  // Load saved resume on mount
  useEffect(() => {
    loadSavedResume();
  }, []);

  // Clean up recording on unmount
  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, []);

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
        setFeedback("Extracting text from PDF...");

        let content = "";

        if (file.mimeType === "text/plain") {
          // Plain text file - read directly
          content = await FileSystem.readAsStringAsync(file.uri);
        } else if (file.mimeType === "application/pdf") {
          // For PDF: Read as base64, then use a simple extraction
          const base64 = await FileSystem.readAsStringAsync(file.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          // Use pdf-parse via a local function
          content = await extractPDFText(base64);

          if (!content || content.trim().length === 0) {
            Alert.alert(
              "Unable to Extract Text",
              "Could not extract text from PDF. Please use a text file (.txt) or paste your resume manually.",
            );
            setIsProcessing(false);
            setFeedback("");
            return;
          }
        }

        // Save to AsyncStorage
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

  // Helper function to extract text from PDF base64
  async function extractPDFText(base64: string): Promise<string> {
    try {
      // Decode base64 to binary
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Simple PDF text extraction (basic approach)
      // This extracts text between BT and ET tags in PDF
      const decoder = new TextDecoder("utf-8");
      const text = decoder.decode(bytes);

      // Extract text content from PDF structure
      const textMatches = text.match(/\(([^)]+)\)/g);
      if (textMatches) {
        const extractedText = textMatches
          .map((match) => match.slice(1, -1)) // Remove parentheses
          .join(" ")
          .replace(/\\r\\n/g, "\n")
          .replace(/\\\(/g, "(")
          .replace(/\\\)/g, ")")
          .trim();

        return extractedText;
      }

      return "";
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

  async function stopAndAnalyze() {
    if (!recording) return;

    setRecording(null);
    setIsProcessing(true);
    setFeedback("Thinking...");

    console.log("=== STOP AND ANALYZE STARTED ===");

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      console.log("Step 1: Recording stopped, URI:", uri);

      if (uri) {
        console.log("Step 2: Converting audio to base64...");

        const base64Audio = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        console.log("Step 3: Base64 length:", base64Audio.length);
        console.log("Step 4: Sending request to OpenRouter...");

        const response = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer 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`, // 👈 Put your NEW key here
              "Content-Type": "application/json",
              "HTTP-Referer": "https://expo.dev",
              "X-Title": "Career Coach App",
            },
            body: JSON.stringify({
              model: "openai/gpt-4o-audio-preview",
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
                      text: "Listen to this interview answer and provide feedback.",
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

        console.log("Step 5: Response status:", response.status);

        const data = await response.json();

        if (data.error) {
          console.log("Step 8: ERROR in response:", JSON.stringify(data.error));
          setFeedback(
            `API Error: ${data.error.message || JSON.stringify(data.error)}`,
          );
        } else {
          console.log("Step 8: Success!");
          setFeedback(
            data.choices[0]?.message?.content || "Could not analyze audio.",
          );
        }
      }
    } catch (error) {
      console.log("=== ERROR CAUGHT ===");
      if (error instanceof Error) {
        console.log("Error message:", error.message);
      }

      setFeedback(
        `Error: ${error instanceof Error ? error.message : "Unknown error processing audio"}`,
      );
    } finally {
      setIsProcessing(false);
      console.log("=== STOP AND ANALYZE FINISHED ===");
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">Career Coach</ThemedText>
          <HelloWave />
        </ThemedView>

        <ThemedView style={styles.main}>
          {/* Resume Status */}
          <ThemedView style={styles.resumeStatus}>
            <ThemedText style={styles.statusText}>
              Resume: {hasResume ? "✅ Uploaded" : "❌ Not uploaded"}
            </ThemedText>
            {hasResume ? (
              <TouchableOpacity
                onPress={clearResume}
                style={styles.smallButton}
              >
                <ThemedText style={styles.smallButtonText}>Clear</ThemedText>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={uploadResume}
                style={styles.smallButton}
              >
                <ThemedText style={styles.smallButtonText}>
                  Upload Resume
                </ThemedText>
              </TouchableOpacity>
            )}
          </ThemedView>

          <ThemedText style={styles.instruction}>
            {recording
              ? "I'm listening... Tap stop when you're done."
              : "Tap the button below to record your interview answer."}
          </ThemedText>

          <TouchableOpacity
            style={[
              styles.recordButton,
              recording ? styles.recording : styles.idle,
            ]}
            onPress={recording ? stopAndAnalyze : startRecording}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.buttonText}>
                {recording ? "Stop Recording" : "Start Recording"}
              </ThemedText>
            )}
          </TouchableOpacity>

          {feedback ? (
            <ThemedView style={styles.feedbackBox}>
              <ThemedText type="subtitle">AI Feedback:</ThemedText>
              <ThemedText style={styles.feedbackText}>{feedback}</ThemedText>
            </ThemedView>
          ) : null}
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 80,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
  },
  main: {
    alignItems: "center",
    gap: 20,
  },
  resumeStatus: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "rgba(150, 150, 150, 0.1)",
    borderRadius: 12,
  },
  statusText: {
    fontSize: 14,
  },
  smallButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: "#007AFF",
    borderRadius: 8,
  },
  smallButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  instruction: {
    textAlign: "center",
    fontSize: 16,
    opacity: 0.8,
  },
  recordButton: {
    width: "100%",
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  idle: {
    backgroundColor: "#007AFF",
  },
  recording: {
    backgroundColor: "#FF3B30",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  feedbackBox: {
    width: "100%",
    padding: 20,
    borderRadius: 16,
    backgroundColor: "rgba(150, 150, 150, 0.1)",
    marginTop: 20,
  },
  feedbackText: {
    marginTop: 10,
    lineHeight: 22,
  },
});
