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
    if (streams.screenStream) {
      streams.screenStream.getTracks().forEach((track) => track.stop());
    }
    if (streams.webcamStream) {
      streams.webcamStream.getTracks().forEach((track) => track.stop());
    }
    if (streams.combinedStream) {
      streams.combinedStream.getTracks().forEach((track) => track.stop());
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    setStreams({
      screenStream: null,
      webcamStream: null,
      combinedStream: null,
    });

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

    try {
      // 1) Pull the video track from the screen
      const screenVideo = screenStream.getVideoTracks()[0];
      if (!screenVideo) {
        throw new Error("No video track in screen stream");
      }

      // 2) Create the combined stream starting with screen video
      const combinedStream = new MediaStream([screenVideo]);
      console.log("Added screen video track");

      // 3) Handle audio mixing with AudioContext for better quality
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const dest = audioCtx.createMediaStreamDestination();
      let hasAudio = false;

      // Add screen audio if present (system/tab audio)
      const screenAudios = screenStream.getAudioTracks();
      if (screenAudios.length > 0) {
        console.log("Adding screen audio");
        const screenSource = audioCtx.createMediaStreamSource(new MediaStream([screenAudios[0]]));
        screenSource.connect(dest);
        hasAudio = true;
      }

      // Add webcam audio if present (microphone)
      const webcamAudios = webcamStream.getAudioTracks();
      if (webcamAudios.length > 0) {
        console.log("Adding webcam audio");
        const webcamSource = audioCtx.createMediaStreamSource(new MediaStream([webcamAudios[0]]));
        webcamSource.connect(dest);
        hasAudio = true;
      }

      // Add the mixed audio track if we have any audio
      if (hasAudio) {
        const mixedAudioTrack = dest.stream.getAudioTracks()[0];
        if (mixedAudioTrack) {
          combinedStream.addTrack(mixedAudioTrack);
          console.log("Added mixed audio track");
        }
      }

      // Set content hint for better screen capture encoding
      try {
        screenVideo.contentHint = "motion";
      } catch (e) {
        console.warn("Could not set contentHint:", e);
      }

      console.log("Final combined stream:", {
        video: combinedStream.getVideoTracks().length,
        audio: combinedStream.getAudioTracks().length,
        total: combinedStream.getTracks().length,
      });

      return combinedStream;
    } catch (error) {
      console.error("Error creating combined stream with AudioContext, falling back to simple approach:", error);

      // Fallback to simple stream combination
      const fallbackStream = new MediaStream();

      // Add screen video
      const screenVideoTracks = screenStream.getVideoTracks();
      if (screenVideoTracks.length > 0) {
        fallbackStream.addTrack(screenVideoTracks[0]);
      }

      // Add screen audio if available
      const screenAudioTracks = screenStream.getAudioTracks();
      if (screenAudioTracks.length > 0) {
        fallbackStream.addTrack(screenAudioTracks[0]);
      } else {
        // If no screen audio, add webcam audio
        const webcamAudioTracks = webcamStream.getAudioTracks();
        if (webcamAudioTracks.length > 0) {
          fallbackStream.addTrack(webcamAudioTracks[0]);
        }
      }

      console.log("Fallback stream:", {
        video: fallbackStream.getVideoTracks().length,
        audio: fallbackStream.getAudioTracks().length,
      });

      return fallbackStream;
    }
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

      // Prepare the recording stream
      let recordingStream = streams.screenStream;
      let streamType = "screen-only";

      // If screen stream doesn't have audio, try combining with webcam
      if (streams.screenStream.getAudioTracks().length === 0 && streams.webcamStream.getAudioTracks().length > 0) {
        console.log("Screen has no audio, creating combined stream with webcam audio");
        recordingStream = createCombinedStream(streams.screenStream, streams.webcamStream);
        streamType = "combined";
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

      // Use most compatible formats first, then try MP4
      const options = [
        { mimeType: "video/webm;codecs=vp8" }, // Most compatible
        { mimeType: "video/webm" }, // Basic WebM
        { mimeType: "video/mp4" }, // MP4 (limited browser support)
        { mimeType: "video/webm;codecs=h264" }, // H.264 in WebM
        {}, // Browser default
      ];

      let mediaRecorder = null;
      let lastError = null;

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
          lastError = e;
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
              lastError = screenError;
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
        console.log("Data available - size:", event.data.size, "type:", event.data.type);
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
          console.log("Total chunks so far:", recordedChunksRef.current.length);
        } else {
          console.warn("Received empty data chunk");
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        setState((prev) => ({
          ...prev,
          error: "Recording failed. Please try again.",
          isRecording: false,
          isCountingDown: false,
        }));
      };

      mediaRecorder.onstart = () => {
        console.log("MediaRecorder started - beginning countdown display");
        setState((prev) => ({
          ...prev,
          isRecording: true,
          recordingTime: 0,
          error: null,
          isCountingDown: true,
          countdown: 3,
        }));

        // Start the countdown timer for visual display
        countdownTimerRef.current = window.setInterval(() => {
          setState((prev) => {
            const newCountdown = prev.countdown - 1;

            if (newCountdown <= 0) {
              if (countdownTimerRef.current) {
                clearInterval(countdownTimerRef.current);
                countdownTimerRef.current = null;
              }
              // Start the recording timer after countdown
              timerRef.current = window.setInterval(() => {
                setState((prevState) => ({
                  ...prevState,
                  recordingTime: prevState.recordingTime + 1,
                }));
              }, 1000);

              return { ...prev, isCountingDown: false, countdown: 0 };
            }

            return { ...prev, countdown: newCountdown };
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

      console.log("Starting MediaRecorder immediately...");

      // Set MediaRecorder reference first
      mediaRecorderRef.current = mediaRecorder;

      // Small delay to ensure everything is set up
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Ensure MediaRecorder is in the correct state
      if (mediaRecorder.state !== "inactive") {
        console.warn("MediaRecorder not in inactive state:", mediaRecorder.state);
        throw new Error("MediaRecorder is not ready to start");
      }

      try {
        // Start with time slice to ensure regular data capture
        mediaRecorder.start(1000); // Capture data every 1 second
        console.log("MediaRecorder started successfully with 1s time slice, mimeType:", mediaRecorder.mimeType);
      } catch (startError) {
        console.error("Failed to start MediaRecorder:", startError);
        throw new Error(`Failed to start recording: ${startError instanceof Error ? startError.message : "Unknown error"}`);
      }
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
        console.log("No active recording to stop");
        resolve(null);
        return;
      }

      const recorder = mediaRecorderRef.current;

      recorder.onstop = () => {
        console.log("Recording stopped, creating blob from", recordedChunksRef.current.length, "chunks");

        // Log chunk details for debugging
        recordedChunksRef.current.forEach((chunk, index) => {
          console.log(`Chunk ${index}: size=${chunk.size}, type=${chunk.type}`);
        });

        if (recordedChunksRef.current.length === 0) {
          console.warn("No recorded chunks available");
          resolve(null);
          return;
        }

        // Use the mimeType from the recorder if available
        const mimeType = recorder.mimeType || "video/webm";
        console.log("Creating blob with mimeType:", mimeType);

        const blob = new Blob(recordedChunksRef.current, { type: mimeType });

        console.log("Created blob:", blob.size, "bytes, type:", blob.type);

        // Validate the blob
        if (blob.size === 0) {
          console.error("Created blob is empty!");
          resolve(null);
          return;
        }

        setState((prev) => ({ ...prev, isRecording: false }));
        resolve(blob);
      };

      console.log("Stopping recording...");

      // Request any final data before stopping
      if (recorder.state === "recording") {
        try {
          recorder.requestData();
          console.log("Requested final data from MediaRecorder");
        } catch (e) {
          console.warn("Could not request final data:", e);
        }
      }

      recorder.stop();

      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
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
