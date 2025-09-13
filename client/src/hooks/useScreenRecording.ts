import { useState, useRef, useCallback } from 'react';

export interface RecordingState {
  isRecording: boolean;
  isPreparing: boolean;
  hasPermissions: boolean;
  error: string | null;
  recordingTime: number;
  countdown: number;
  isCountingDown: boolean;
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
      streams.screenStream.getTracks().forEach(track => track.stop());
    }
    if (streams.webcamStream) {
      streams.webcamStream.getTracks().forEach(track => track.stop());
    }
    if (streams.combinedStream) {
      streams.combinedStream.getTracks().forEach(track => track.stop());
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }

    setStreams({
      screenStream: null,
      webcamStream: null,
      combinedStream: null,
    });

    setState(prev => ({
      ...prev,
      isRecording: false,
      isPreparing: false,
      recordingTime: 0,
      countdown: 3,
      isCountingDown: false,
    }));
  }, [streams]);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isPreparing: true, error: null }));

      if (!navigator.mediaDevices?.getDisplayMedia || !navigator.mediaDevices?.getUserMedia) {
        throw new Error('Screen recording is not supported in this browser. Please use Chrome or a Chromium-based browser.');
      }

      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: true
      });

      const webcamStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 }
        },
        audio: true
      });

      setStreams({
        screenStream,
        webcamStream,
        combinedStream: null,
      });

      setState(prev => ({
        ...prev,
        hasPermissions: true,
        isPreparing: false,
        error: null,
      }));

      return true;
    } catch (error) {
      let errorMessage = 'Failed to get recording permissions.';

      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Recording permissions were denied. Please allow screen sharing, camera, and microphone access.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No camera or microphone found. Please check your devices.';
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'Screen recording is not supported in this browser.';
        } else {
          errorMessage = error.message;
        }
      }

      setState(prev => ({
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
      setState(prev => ({ ...prev, isPreparing: true, error: null }));

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access is not supported in this browser.');
      }

      const webcamStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 }
        },
        audio: true
      });

      setStreams(prev => ({
        ...prev,
        webcamStream,
      }));

      setState(prev => ({
        ...prev,
        isPreparing: false,
        error: null,
      }));

      return true;
    } catch (error) {
      let errorMessage = 'Failed to get camera permissions.';

      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Camera permission was denied. Please allow camera access.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No camera found. Please check your camera connection.';
        } else {
          errorMessage = error.message;
        }
      }

      setState(prev => ({
        ...prev,
        error: errorMessage,
        isPreparing: false,
      }));

      return false;
    }
  }, []);

  const startCountdownAndRecord = useCallback(async (): Promise<void> => {
    if (!streams.webcamStream) {
      setState(prev => ({ ...prev, error: 'Camera not available. Please allow camera access first.' }));
      return;
    }

    // Start countdown
    setState(prev => ({ ...prev, isCountingDown: true, countdown: 3 }));

    countdownTimerRef.current = window.setInterval(() => {
      setState(prev => {
        const newCountdown = prev.countdown - 1;

        if (newCountdown <= 0) {
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
          return { ...prev, isCountingDown: false, countdown: 0 };
        }

        return { ...prev, countdown: newCountdown };
      });
    }, 1000);

    // Wait for countdown to finish, then request screen and start recording
    setTimeout(async () => {
      try {
        // Request screen permission
        setState(prev => ({ ...prev, isPreparing: true }));

        if (!navigator.mediaDevices?.getDisplayMedia) {
          throw new Error('Screen recording is not supported in this browser.');
        }

        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 }
          },
          audio: true
        });

        setStreams(prev => ({
          ...prev,
          screenStream,
        }));

        setState(prev => ({
          ...prev,
          hasPermissions: true,
          isPreparing: false,
        }));

        // Start recording
        await startRecording();
      } catch (error) {
        let errorMessage = 'Failed to get screen recording permissions.';

        if (error instanceof Error) {
          if (error.name === 'NotAllowedError') {
            errorMessage = 'Screen sharing permission was denied.';
          } else {
            errorMessage = error.message;
          }
        }

        setState(prev => ({
          ...prev,
          error: errorMessage,
          isPreparing: false,
          isCountingDown: false,
          countdown: 3,
        }));
      }
    }, 3000);
  }, [streams.webcamStream]);

  const createCombinedStream = useCallback((screenStream: MediaStream, webcamStream: MediaStream): MediaStream => {
    // For now, let's simplify and just use the screen stream with audio from both sources
    // We'll handle the webcam overlay separately in the UI
    const combinedStream = new MediaStream();

    // Add video track from screen
    screenStream.getVideoTracks().forEach(track => {
      combinedStream.addTrack(track);
    });

    // Add audio tracks from both sources
    screenStream.getAudioTracks().forEach(track => {
      combinedStream.addTrack(track);
    });

    webcamStream.getAudioTracks().forEach(track => {
      combinedStream.addTrack(track);
    });

    return combinedStream;
  }, []);

  const startRecording = useCallback(async (): Promise<void> => {
    if (!streams.screenStream || !streams.webcamStream) {
      setState(prev => ({ ...prev, error: 'Missing required streams. Please request permissions first.' }));
      return;
    }

    try {
      const combinedStream = createCombinedStream(streams.screenStream, streams.webcamStream);

      setStreams(prev => ({ ...prev, combinedStream }));

      // Try different codec options for better compatibility
      const options = [
        { mimeType: 'video/webm;codecs=vp9,opus' },
        { mimeType: 'video/webm;codecs=vp8,opus' },
        { mimeType: 'video/webm' },
        { mimeType: 'video/mp4' }
      ];

      let mediaRecorder = null;
      for (const option of options) {
        if (MediaRecorder.isTypeSupported(option.mimeType)) {
          try {
            mediaRecorder = new MediaRecorder(combinedStream, option);
            break;
          } catch (e) {
            continue;
          }
        }
      }

      if (!mediaRecorder) {
        mediaRecorder = new MediaRecorder(combinedStream);
      }

      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        console.log('Data available:', event.data.size);
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setState(prev => ({
          ...prev,
          error: 'Recording failed. Please try again.',
          isRecording: false,
        }));
      };

      mediaRecorder.onstart = () => {
        console.log('Recording started');
        setState(prev => ({
          ...prev,
          isRecording: true,
          recordingTime: 0,
          error: null,
        }));

        // Start the timer
        timerRef.current = window.setInterval(() => {
          setState(prev => ({
            ...prev,
            recordingTime: prev.recordingTime + 1,
          }));
        }, 1000);
      };

      mediaRecorder.onstop = () => {
        console.log('Recording stopped');
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };

      mediaRecorder.start(1000); // Record in 1-second chunks
      mediaRecorderRef.current = mediaRecorder;

      console.log('MediaRecorder started with type:', mediaRecorder.mimeType);

    } catch (error) {
      console.error('Failed to start recording:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to start recording',
      }));
    }
  }, [streams.screenStream, streams.webcamStream, createCombinedStream]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        console.log('No active recording to stop');
        resolve(null);
        return;
      }

      const recorder = mediaRecorderRef.current;

      recorder.onstop = () => {
        console.log('Recording stopped, creating blob from', recordedChunksRef.current.length, 'chunks');

        if (recordedChunksRef.current.length === 0) {
          console.warn('No recorded chunks available');
          resolve(null);
          return;
        }

        // Use the mimeType from the recorder if available
        const mimeType = recorder.mimeType || 'video/webm';
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });

        console.log('Created blob:', blob.size, 'bytes, type:', blob.type);

        setState(prev => ({ ...prev, isRecording: false }));
        resolve(blob);
      };

      console.log('Stopping recording...');
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
  };
};