export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const generateRecordingFilename = (): string => {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  return `ticket-fairy-recording-${dateStr}-${timeStr}.webm`;
};

export const convertWebMToMp4 = async (webmBlob: Blob): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      const mp4Blob = new Blob([webmBlob], { type: 'video/mp4' });
      resolve(mp4Blob);
    } catch (error) {
      reject(error);
    }
  });
};

export const uploadVideoToServer = async (
  blob: Blob,
  filename: string,
  endpoint: string = '/api/upload-video'
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    const formData = new FormData();
    formData.append('video', blob, filename);

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed with status: ${response.status}`);
    }

    const result = await response.json();
    return { success: true, url: result.url };
  } catch (error) {
    console.error('Video upload failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error'
    };
  }
};

export const checkBrowserSupport = (): {
  isSupported: boolean;
  missingFeatures: string[];
} => {
  const missingFeatures: string[] = [];

  if (!navigator.mediaDevices) {
    missingFeatures.push('MediaDevices API');
  }

  if (!navigator.mediaDevices?.getDisplayMedia) {
    missingFeatures.push('Screen Capture API');
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    missingFeatures.push('Camera/Microphone API');
  }

  if (!window.MediaRecorder) {
    missingFeatures.push('MediaRecorder API');
  }

  if (!HTMLCanvasElement.prototype.captureStream) {
    missingFeatures.push('Canvas Stream Capture');
  }

  return {
    isSupported: missingFeatures.length === 0,
    missingFeatures
  };
};

export const getBrowserInfo = (): {
  name: string;
  isChrome: boolean;
  isSupported: boolean;
} => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isChrome = userAgent.includes('chrome') && !userAgent.includes('edg');
  const isEdge = userAgent.includes('edg');
  const isOpera = userAgent.includes('opr');
  const isBrave = userAgent.includes('brave');

  let name = 'Unknown';

  if (isChrome) name = 'Chrome';
  else if (isEdge) name = 'Edge';
  else if (isOpera) name = 'Opera';
  else if (isBrave) name = 'Brave';
  else if (userAgent.includes('firefox')) name = 'Firefox';
  else if (userAgent.includes('safari')) name = 'Safari';

  const chromiumBased = isChrome || isEdge || isOpera || isBrave;

  return {
    name,
    isChrome: chromiumBased,
    isSupported: chromiumBased
  };
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

export const createVideoThumbnail = (videoBlob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    video.addEventListener('loadedmetadata', () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      video.currentTime = 1;
    });

    video.addEventListener('seeked', () => {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
      resolve(thumbnail);
    });

    video.addEventListener('error', () => {
      reject(new Error('Failed to load video for thumbnail'));
    });

    video.src = URL.createObjectURL(videoBlob);
  });
};

export interface RecordingSettings {
  videoQuality: 'low' | 'medium' | 'high' | 'ultra';
  frameRate: number;
  audioBitrate: number;
  videoBitrate: number;
}

export const getRecordingSettings = (quality: RecordingSettings['videoQuality']): {
  video: MediaTrackConstraints;
  audio: MediaTrackConstraints;
} => {
  const settings = {
    low: {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 24 }
      },
      audio: {
        sampleRate: 44100,
        channelCount: 2
      }
    },
    medium: {
      video: {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30 }
      },
      audio: {
        sampleRate: 44100,
        channelCount: 2
      }
    },
    high: {
      video: {
        width: { ideal: 2560 },
        height: { ideal: 1440 },
        frameRate: { ideal: 30 }
      },
      audio: {
        sampleRate: 48000,
        channelCount: 2
      }
    },
    ultra: {
      video: {
        width: { ideal: 3840 },
        height: { ideal: 2160 },
        frameRate: { ideal: 60 }
      },
      audio: {
        sampleRate: 48000,
        channelCount: 2
      }
    }
  };

  return settings[quality];
};