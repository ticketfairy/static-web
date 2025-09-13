import { useState } from "react";

export const useSaveToVideos = () => {
  const [isSupported] = useState(() => {
    return 'showDirectoryPicker' in window || 'showSaveFilePicker' in window;
  });

  const saveToVideos = async (blob: Blob, filename?: string): Promise<void> => {
    const suggestedFilename = filename || `ticket-fairy-recording-${new Date().toISOString().split('T')[0]}.webm`;

    // Try File System Access API first (Chrome 86+)
    if ('showSaveFilePicker' in window) {
      try {
        const fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: suggestedFilename,
          types: [
            {
              description: 'Video files',
              accept: {
                'video/webm': ['.webm'],
                'video/mp4': ['.mp4'],
              },
            },
          ],
          startIn: 'videos', // Suggests Videos folder
        });

        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();

        return;
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          throw new Error('Save cancelled by user');
        }
        console.warn('File System Access API failed:', error);
        // Fall through to fallback method
      }
    }

    // Fallback: Regular download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = suggestedFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const saveToSpecificFolder = async (blob: Blob, filename?: string): Promise<void> => {
    const suggestedFilename = filename || `ticket-fairy-recording-${new Date().toISOString().split('T')[0]}.webm`;

    // Try Directory Picker (for selecting Videos folder specifically)
    if ('showDirectoryPicker' in window) {
      try {
        const dirHandle = await (window as any).showDirectoryPicker({
          startIn: 'videos',
        });

        const fileHandle = await dirHandle.getFileHandle(suggestedFilename, {
          create: true,
        });

        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();

        return;
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          throw new Error('Save cancelled by user');
        }
        console.warn('Directory picker failed:', error);
        // Fall through to regular save picker
      }
    }

    // Fallback to regular save picker
    return saveToVideos(blob, filename);
  };

  return {
    isSupported,
    saveToVideos,
    saveToSpecificFolder,
  };
};