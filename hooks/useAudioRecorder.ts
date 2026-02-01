import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { useState } from "react";

export const useAudioRecorder = () => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync({
        android: {
          extension: ".wav",
          outputFormat: 0,
          audioEncoder: 0,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: ".wav",
          audioQuality: 0,
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
    }
  };

  const stopAndGetBase64 = async () => {
    if (!recording) return null;
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);

    if (uri) {
      return await FileSystem.readAsStringAsync(uri, { encoding: "base64" });
    }
    return null;
  };

  return { recording, startRecording, stopAndGetBase64 };
};
