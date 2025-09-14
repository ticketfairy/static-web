import { useState, useRef, useCallback } from "react";

export interface RecordingState {
  isRecording: boolean;
  isPreparing: boolean;
  hasPermissions: boolean;
  error: string | null;
  recordingTime: number;
  countdown: number;
  isCountingDown: boolean;
  showPermissionsPopup: boolean;
  showReadyModal: boolean;
}

export interface MediaStreams {
  screenStream: MediaStream | null;
  webcamStream: MediaStream | null;
  combinedStream: MediaStream | null;
}

export interface UseScreenRecordingReturn {
  state: RecordingState;
  streams: MediaStreams;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  requestPermissions: () => Promise<boolean>;
  requestWebcamOnly: () => Promise<boolean>;
  startCountdownAndRecord: () => Promise<void>;
  cleanup: () => void;
  showPermissionsPopup: () => void;
  hidePermissionsPopup: () => void;
  requestScreenAndStart: () => Promise<void>;
}

export const useScreenRecording = (): UseScreenRecordingReturn => {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isPreparing: false,
    hasPermissions: false,
    error: null,
    recordingTime: 0,
    countdown: 3,
    isCountingDown: false,
    showPermissionsPopup: false,
    showReadyModal: false,
  });

  const [streams, setStreams] = useState<MediaStreams>({
    screenStream: null,
    webcamStream: null,
    combinedStream: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);

  const cleanup = useCallback(() => {
    // Clear timers first to prevent any race conditions
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    // Stop media streams
    if (streams.screenStream) {
      streams.screenStream.getTracks().forEach((track) => track.stop());
    }
    if (streams.webcamStream) {
      streams.webcamStream.getTracks().forEach((track) => track.stop());
    }
    if (streams.combinedStream) {
      streams.combinedStream.getTracks().forEach((track) => track.stop());
    }

    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;

    // Reset streams
    setStreams({
      screenStream: null,
      webcamStream: null,
      combinedStream: null,
    });

    // Reset state
    setState((prev) => ({
      ...prev,
      isRecording: false,
      isPreparing: false,
      recordingTime: 0,
      countdown: 3,
      isCountingDown: false,
      showPermissionsPopup: false,
      showReadyModal: false,
    }));
  }, [streams]);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      setState((prev) => ({ ...prev, isPreparing: true, error: null }));

      if (!navigator.mediaDevices?.getDisplayMedia || !navigator.mediaDevices?.getUserMedia) {
        throw new Error("Screen recording is not supported in this browser. Please use Chrome or a Chromium-based browser.");
      }

      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: true,
      });

      const webcamStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 },
        },
        audio: true,
      });

      setStreams({
        screenStream,
        webcamStream,
        combinedStream: null,
      });

      setState((prev) => ({
        ...prev,
        hasPermissions: true,
        isPreparing: false,
        error: null,
      }));

      return true;
    } catch (error) {
      let errorMessage = "Failed to get recording permissions.";

      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          errorMessage = "Recording permissions were denied. Please allow screen sharing, camera, and microphone access.";
        } else if (error.name === "NotFoundError") {
          errorMessage = "No camera or microphone found. Please check your devices.";
        } else if (error.name === "NotSupportedError") {
          errorMessage = "Screen recording is not supported in this browser.";
        } else {
          errorMessage = error.message;
        }
      }

      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isPreparing: false,
        hasPermissions: false,
      }));

      cleanup();
      return false;
    }
  }, [cleanup]);

  const requestWebcamOnly = useCallback(async (): Promise<boolean> => {
    try {
      setState((prev) => ({ ...prev, isPreparing: true, error: null }));

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera access is not supported in this browser.");
      }

      const webcamStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 },
        },
        audio: true,
      });

      setStreams((prev) => ({
        ...prev,
        webcamStream,
      }));

      setState((prev) => ({
        ...prev,
        isPreparing: false,
        error: null,
        hasPermissions: true, // Set hasPermissions to true so webcam circle shows
        showPermissionsPopup: true, // Show permissions popup after webcam is ready
      }));

      return true;
    } catch (error) {
      let errorMessage = "Failed to get camera permissions.";

      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          errorMessage = "Camera permission was denied. Please allow camera access.";
        } else if (error.name === "NotFoundError") {
          errorMessage = "No camera found. Please check your camera connection.";
        } else {
          errorMessage = error.message;
        }
      }

      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isPreparing: false,
      }));

      return false;
    }
  }, []);

  const createCombinedStream = useCallback((screenStream: MediaStream, webcamStream: MediaStream): MediaStream => {
    console.log("Creating combined stream...");
    console.log("Screen stream tracks:", {
      video: screenStream.getVideoTracks().length,
      audio: screenStream.getAudioTracks().length,
    });
    console.log("Webcam stream tracks:", {
      video: webcamStream.getVideoTracks().length,
      audio: webcamStream.getAudioTracks().length,
    });

    // Use simple stream combination instead of AudioContext to avoid stream issues
    console.log("🔧 Creating simple combined stream (avoiding AudioContext)");

    const combinedStream = new MediaStream();

    // Add screen video track
    const screenVideoTracks = screenStream.getVideoTracks();
    if (screenVideoTracks.length > 0) {
      combinedStream.addTrack(screenVideoTracks[0]);
      console.log("✅ Added screen video track");

      // Set content hint for better encoding
      try {
        screenVideoTracks[0].contentHint = "motion";
      } catch (e) {
        console.warn("Could not set contentHint:", e);
      }
    }

    // Always prioritize microphone audio from webcam for user voice
    const webcamAudioTracks = webcamStream.getAudioTracks();
    const screenAudioTracks = screenStream.getAudioTracks();

    if (webcamAudioTracks.length > 0) {
      combinedStream.addTrack(webcamAudioTracks[0]);
      console.log("✅ Added webcam microphone audio track (priority for user voice)");

      // If we also have screen audio (system audio), we could add it too
      // but for now, prioritize microphone audio to avoid conflicts
      if (screenAudioTracks.length > 0) {
        console.log("ℹ️ Screen audio available but using microphone audio instead");
      }
    } else if (screenAudioTracks.length > 0) {
      // Fallback to screen audio if no microphone
      combinedStream.addTrack(screenAudioTracks[0]);
      console.log("✅ Added screen audio track (fallback - no microphone)");
    } else {
      console.log("⚠️ No audio tracks available from either source");
    }

    console.log("🎯 Simple combined stream created:", {
      video: combinedStream.getVideoTracks().length,
      audio: combinedStream.getAudioTracks().length,
      active: combinedStream.active,
    });

    return combinedStream;
  }, []);

  const showPermissionsPopup = useCallback(() => {
    setState((prev) => ({ ...prev, showPermissionsPopup: true }));
  }, []);

  const hidePermissionsPopup = useCallback(() => {
    setState((prev) => ({ ...prev, showPermissionsPopup: false }));
  }, []);

  const requestScreenAndStart = useCallback(async (): Promise<void> => {
    console.log("requestScreenAndStart called");

    if (!streams.webcamStream) {
      console.error("No webcam stream available");
      setState((prev) => ({ ...prev, error: "Camera not available. Please allow camera access first." }));
      return;
    }

    try {
      console.log("Hiding permissions popup and requesting screen permission...");
      // Hide permissions popup first
      setState((prev) => ({ ...prev, showPermissionsPopup: false, isPreparing: true }));

      // Request screen permission immediately
      if (!navigator.mediaDevices?.getDisplayMedia) {
        throw new Error("Screen recording is not supported in this browser.");
      }

      console.log("Calling getDisplayMedia...");
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: true,
      });

      console.log("Screen stream obtained:", !!screenStream);
      setStreams((prev) => {
        console.log("Setting screen stream:", !!screenStream);
        return {
          ...prev,
          screenStream,
        };
      });

      console.log("Showing ready modal...");
      setState((prev) => ({
        ...prev,
        isPreparing: false,
        showReadyModal: true, // Now show ready modal after screen permission granted
      }));
    } catch (error) {
      let errorMessage = "Failed to get screen recording permissions.";

      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          errorMessage = "Screen sharing permission was denied.";
        } else {
          errorMessage = error.message;
        }
      }

      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isPreparing: false,
        showPermissionsPopup: false,
        showReadyModal: false,
      }));

      // If screen permission was denied, clean up and reset to initial state
      if (error instanceof Error && error.name === "NotAllowedError") {
        // Clean up webcam stream to return to initial state
        if (streams.webcamStream) {
          streams.webcamStream.getTracks().forEach((track) => track.stop());
        }
        setStreams((prev) => ({
          ...prev,
          webcamStream: null,
        }));
      }
    }
  }, [streams.webcamStream]);

  const startCountdownAndRecord = useCallback(async (): Promise<void> => {
    console.log("startCountdownAndRecord called with streams:", {
      webcamStream: !!streams.webcamStream,
      screenStream: !!streams.screenStream,
    });

    // Hide ready modal first
    setState((prev) => ({ ...prev, showReadyModal: false }));

    if (!streams.webcamStream || !streams.screenStream) {
      console.error("Missing streams:", { webcamStream: !!streams.webcamStream, screenStream: !!streams.screenStream });
      setState((prev) => ({ ...prev, error: "Camera or screen not available. Please allow permissions first." }));
      return;
    }

    try {
      // START RECORDING IMMEDIATELY to prevent screen share from being closed by browser
      console.log("Starting recording immediately to maintain screen share...");

      // Prepare the recording stream with proper audio handling
      let recordingStream: MediaStream;
      let streamType = "screen-only";

      // Check if screen stream has audio (system audio)
      const hasScreenAudio = streams.screenStream.getAudioTracks().length > 0;
      const hasWebcamAudio = streams.webcamStream.getAudioTracks().length > 0;

      console.log("🎵 Audio availability:", { hasScreenAudio, hasWebcamAudio });

      if (hasWebcamAudio) {
        // Create combined stream with microphone audio
        console.log("🎯 Creating combined stream with microphone audio");
        recordingStream = createCombinedStream(streams.screenStream, streams.webcamStream);
        streamType = "combined-with-microphone";

        // Update the streams state with the combined stream
        setStreams((prev) => ({
          ...prev,
          combinedStream: recordingStream,
        }));
      } else {
        // Use screen stream only if no microphone audio
        console.log("🎯 Using screen stream only (no microphone audio available)");
        recordingStream = streams.screenStream;
        streamType = "screen-only";
      }

      console.log(`Using ${streamType} stream for recording:`, {
        video: recordingStream.getVideoTracks().length,
        audio: recordingStream.getAudioTracks().length,
      });

      // Validate the recording stream
      if (recordingStream.getTracks().length === 0) {
        throw new Error("No tracks available in recording stream");
      }

      if (recordingStream.getVideoTracks().length === 0) {
        throw new Error("No video tracks available for recording");
      }

      // Check MediaRecorder state if it exists
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        console.log("Stopping existing MediaRecorder before creating new one");
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }

      // Prioritize MP4 format for MOV compatibility
      const options = [
        { mimeType: "video/mp4" }, // MP4 (best for MOV compatibility)
        { mimeType: "video/webm;codecs=h264" }, // H.264 in WebM (good fallback)
        { mimeType: "video/webm;codecs=vp8" }, // VP8 WebM (fallback)
        { mimeType: "video/webm" }, // Basic WebM (last resort)
        {}, // Browser default
      ];

      let mediaRecorder: MediaRecorder | null = null;
      let lastError: Error | null = null;

      for (const option of options) {
        try {
          console.log("Trying MediaRecorder with option:", option);

          if (option.mimeType && !MediaRecorder.isTypeSupported(option.mimeType)) {
            console.log("MIME type not supported:", option.mimeType);
            continue;
          }

          mediaRecorder = new MediaRecorder(recordingStream, option);
          console.log("MediaRecorder created successfully with:", option);
          break;
        } catch (e) {
          console.warn("Failed to create MediaRecorder with option:", option, e);
          lastError = e instanceof Error ? e : new Error(String(e));
          continue;
        }
      }

      if (!mediaRecorder) {
        console.warn("Failed to create MediaRecorder with primary stream, trying fallback approaches...");
        // Fallback: try with just the screen stream if we were using combined
        if (streamType === "combined") {
          for (const option of options) {
            try {
              if (option.mimeType && !MediaRecorder.isTypeSupported(option.mimeType)) {
                continue;
              }
              mediaRecorder = new MediaRecorder(streams.screenStream, option);
              console.log("MediaRecorder created with screen-only fallback:", option);
              break;
            } catch (screenError) {
              lastError = screenError instanceof Error ? screenError : new Error(String(screenError));
              continue;
            }
          }
        }
      }

      if (!mediaRecorder) {
        throw new Error(
          `Failed to create MediaRecorder with any configuration: ${lastError instanceof Error ? lastError.message : "Unknown error"}`
        );
      }

      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        console.log("📹 Data available - size:", event.data.size, "bytes, type:", event.data.type);
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
          console.log("📦 Total chunks stored:", recordedChunksRef.current.length, "- Latest chunk size:", event.data.size);
        } else {
          console.warn("⚠️ Received empty data chunk - this may indicate a recording issue");
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error("❌ MediaRecorder error:", event);
        console.error("❌ MediaRecorder state when error occurred:", mediaRecorder?.state);
        console.error("❌ Stream status when error occurred:", {
          screenActive: streams.screenStream?.active,
          webcamActive: streams.webcamStream?.active,
          recordingStreamActive: recordingStream.active,
        });
        setState((prev) => ({
          ...prev,
          error: "Recording failed. Please try again.",
          isRecording: false,
          isCountingDown: false,
        }));
      };

      mediaRecorder.onstart = () => {
        console.log("🎬 MediaRecorder started - recording is now active!");

        // Clear any existing recording timer before starting new one
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        setState((prev) => ({
          ...prev,
          isRecording: true,
          recordingTime: 0,
          error: null,
          isCountingDown: false, // Countdown is already done
        }));

        // Start the recording timer immediately since countdown is already complete
        timerRef.current = window.setInterval(() => {
          setState((prevState) => {
            const newRecordingTime = prevState.recordingTime + 1;

            // Request data every 5 seconds to ensure we're getting chunks
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording" && newRecordingTime % 5 === 0) {
              try {
                mediaRecorderRef.current.requestData();
                console.log("🔄 Requested data chunk at", newRecordingTime, "seconds");
              } catch (e) {
                console.warn("Could not request data:", e);
              }
            }

            return {
              ...prevState,
              recordingTime: newRecordingTime,
            };
          });
        }, 1000);
      };

      mediaRecorder.onstop = () => {
        console.log("MediaRecorder stopped");
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
      };

      console.log("🎬 Preparing MediaRecorder - will start after countdown...");
      console.log("📊 Stream status before countdown:", {
        screenActive: streams.screenStream?.active,
        screenTracks: streams.screenStream?.getTracks().length,
        webcamActive: streams.webcamStream?.active,
        webcamTracks: streams.webcamStream?.getTracks().length,
        recordingStreamActive: recordingStream.active,
        recordingStreamTracks: recordingStream.getTracks().length,
      });

      // Set MediaRecorder reference first
      mediaRecorderRef.current = mediaRecorder;

      console.log("⏱️ Starting 3-second countdown before recording begins...");

      // Ensure MediaRecorder is in the correct state
      if (mediaRecorder.state !== "inactive") {
        console.warn("⚠️ MediaRecorder not in inactive state:", mediaRecorder.state);
        throw new Error("MediaRecorder is not ready to start");
      }

      // Final stream validation before starting
      console.log("🔍 Final stream validation:");
      console.log("- Screen stream active:", streams.screenStream?.active);
      console.log(
        "- Screen stream tracks:",
        streams.screenStream?.getTracks().map((t) => ({ kind: t.kind, enabled: t.enabled, readyState: t.readyState }))
      );
      console.log("- Recording stream active:", recordingStream.active);
      console.log(
        "- Recording stream tracks:",
        recordingStream.getTracks().map((t) => ({ kind: t.kind, enabled: t.enabled, readyState: t.readyState }))
      );

      if (!recordingStream.active) {
        console.error("❌ Recording stream is not active!");

        // Try to reactivate by checking individual tracks
        const inactiveTracks = recordingStream.getTracks().filter((track) => track.readyState === "ended");
        if (inactiveTracks.length > 0) {
          console.error(
            "❌ Found inactive tracks:",
            inactiveTracks.map((t) => ({ kind: t.kind, readyState: t.readyState }))
          );
        }

        // Try using the original screen stream directly if it's still active
        if (streams.screenStream?.active) {
          console.log("🔄 Attempting to use original screen stream as fallback");
          recordingStream = streams.screenStream;

          // Recreate MediaRecorder with the active stream
          console.log("🔄 Recreating MediaRecorder with active stream");
          for (const option of options) {
            try {
              if (option.mimeType && !MediaRecorder.isTypeSupported(option.mimeType)) {
                continue;
              }
              mediaRecorder = new MediaRecorder(recordingStream, option);
              console.log("✅ MediaRecorder recreated with active stream:", option);
              break;
            } catch (e) {
              console.warn("Failed to recreate MediaRecorder:", e);
              continue;
            }
          }
        } else {
          throw new Error("Recording stream became inactive before starting");
        }
      }

      // Start countdown display and then start recording after countdown completes
      setState((prev) => ({
        ...prev,
        isRecording: false, // Not actually recording yet, just showing countdown
        recordingTime: 0,
        error: null,
        isCountingDown: true,
        countdown: 3,
      }));

      // Start the countdown timer
      countdownTimerRef.current = window.setInterval(() => {
        setState((prev) => {
          const newCountdown = prev.countdown - 1;

          if (newCountdown <= 0) {
            // Clear countdown timer
            if (countdownTimerRef.current) {
              clearInterval(countdownTimerRef.current);
              countdownTimerRef.current = null;
            }

            // NOW START THE ACTUAL RECORDING
            console.log("🚀 Countdown complete - starting MediaRecorder now!");

            try {
              // FINAL stream check right before starting
              console.log("🔍 FINAL check - Stream active:", recordingStream.active, "Tracks:", recordingStream.getTracks().length);

              if (!recordingStream.active) {
                console.error("❌ CRITICAL: Stream became inactive during countdown!");
                setState((prevState) => ({
                  ...prevState,
                  error: "Stream closed during countdown. Please try again.",
                  isCountingDown: false,
                  countdown: 3,
                }));
                return { ...prev, isCountingDown: false, countdown: 0 };
              }

              // Try different time slice approaches for better compatibility
              console.log("🚀 Attempting to start MediaRecorder with mimeType:", mediaRecorder.mimeType);

              // Start with most reliable approach first - no time slice
              try {
                mediaRecorder.start(); // Start without time slice for maximum compatibility
                console.log("✅ MediaRecorder started successfully without time slice");
              } catch (noTimeSliceError) {
                console.warn("⚠️ Failed without time slice, trying 1s:", noTimeSliceError);
                try {
                  mediaRecorder.start(1000); // Capture data every 1 second
                  console.log("✅ MediaRecorder started successfully with 1s time slice");
                } catch (oneSecError) {
                  console.warn("⚠️ Failed with 1s time slice, trying 500ms:", oneSecError);
                  mediaRecorder.start(500); // Capture data every 500ms
                  console.log("✅ MediaRecorder started successfully with 500ms time slice");
                }
              }
            } catch (startError) {
              console.error("❌ Failed to start MediaRecorder:", startError);
              console.error("❌ Stream status at failure:", {
                active: recordingStream.active,
                tracks: recordingStream.getTracks().map((t) => ({ kind: t.kind, readyState: t.readyState })),
              });
              setState((prevState) => ({
                ...prevState,
                error: `Failed to start recording: ${startError instanceof Error ? startError.message : "Unknown error"}`,
                isCountingDown: false,
                countdown: 3,
              }));
            }

            return { ...prev, isCountingDown: false, countdown: 0 };
          }

          return { ...prev, countdown: newCountdown };
        });
      }, 1000);
    } catch (error) {
      console.error("Failed to start recording:", error);
      setState((prev) => ({
        ...prev,
        error: "Failed to start recording. Please try again.",
        isRecording: false,
        isCountingDown: false,
        countdown: 3,
      }));
    }
  }, [streams.webcamStream, streams.screenStream, createCombinedStream]);

  // Simple wrapper for startCountdownAndRecord
  const startRecording = useCallback(async (): Promise<void> => {
    await startCountdownAndRecord();
  }, [startCountdownAndRecord]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") {
        console.log("❌ No active recording to stop");
        resolve(null);
        return;
      }

      const recorder = mediaRecorderRef.current;
      console.log("🛑 Stopping recording... Current state:", recorder.state);
      console.log("📊 Current chunks before stop:", recordedChunksRef.current.length);

      recorder.onstop = () => {
        console.log("⏹️ Recording stopped, creating blob from", recordedChunksRef.current.length, "chunks");

        // Log chunk details for debugging
        let totalSize = 0;
        recordedChunksRef.current.forEach((chunk, index) => {
          totalSize += chunk.size;
          console.log(`📦 Chunk ${index}: size=${chunk.size} bytes, type=${chunk.type}`);
        });
        console.log("📏 Total data size:", totalSize, "bytes");

        if (recordedChunksRef.current.length === 0) {
          console.error("❌ No recorded chunks available - recording may have failed");
          resolve(null);
          return;
        }

        // Use the mimeType from the recorder if available, prefer MP4 for MOV compatibility
        const mimeType = recorder.mimeType || "video/mp4";
        console.log("🎬 Creating blob with mimeType:", mimeType);

        const blob = new Blob(recordedChunksRef.current, { type: mimeType });

        console.log("✅ Created blob:", blob.size, "bytes, type:", blob.type);

        // Validate the blob
        if (blob.size === 0) {
          console.error("❌ Created blob is empty!");
          resolve(null);
          return;
        }

        setState((prev) => ({ ...prev, isRecording: false }));
        resolve(blob);
      };

      // Request any final data before stopping - with multiple attempts
      if (recorder.state === "recording") {
        try {
          console.log("🔄 Requesting final data from MediaRecorder...");
          recorder.requestData();

          // Wait a bit for the final data to be processed
          setTimeout(() => {
            console.log("📊 Chunks after requestData:", recordedChunksRef.current.length);
            recorder.stop();
          }, 100);
        } catch (e) {
          console.warn("⚠️ Could not request final data:", e);
          recorder.stop();
        }
      } else {
        recorder.stop();
      }

      // Stop timers
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    });
  }, []);

  return {
    state,
    streams,
    startRecording,
    stopRecording,
    requestPermissions,
    requestWebcamOnly,
    startCountdownAndRecord,
    cleanup,
    showPermissionsPopup,
    hidePermissionsPopup,
    requestScreenAndStart,
  };
};
