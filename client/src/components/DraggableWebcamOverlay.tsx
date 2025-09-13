import { Box, useColorModeValue } from "@chakra-ui/react";
import { useState, useRef, useEffect, useCallback } from "react";

interface DraggableWebcamOverlayProps {
  webcamStream: MediaStream | null;
  isVisible: boolean;
  size?: number;
  isRecording?: boolean;
  isCountingDown?: boolean;
  countdown?: number;
  onStop?: () => void;
}

interface Position {
  x: number;
  y: number;
}

export function DraggableWebcamOverlay({
  webcamStream,
  isVisible,
  size = 150,
  isRecording = false,
  isCountingDown = false,
  countdown = 3,
}: DraggableWebcamOverlayProps) {
  const [position, setPosition] = useState<Position>({
    x: window.innerWidth - size - 20,
    y: window.innerHeight - size - 20,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const shadowColor = useColorModeValue("rgba(0,0,0,0.3)", "rgba(255,255,255,0.3)");

  useEffect(() => {
    if (webcamStream && videoRef.current) {
      videoRef.current.srcObject = webcamStream;
      videoRef.current.play().catch(console.error);
    }
  }, [webcamStream]);

  useEffect(() => {
    const handleResize = () => {
      const maxX = window.innerWidth - size;
      const maxY = window.innerHeight - size;

      setPosition((prev) => ({
        x: Math.min(prev.x, maxX),
        y: Math.min(prev.y, maxY),
      }));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [size]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();

    // Only allow dragging, no click-to-stop functionality
    // (Recording is controlled by the separate Record/Stop button)
    setIsDragging(true);

    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      const maxX = window.innerWidth - size;
      const maxY = window.innerHeight - size;

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    },
    [isDragging, dragOffset.x, dragOffset.y, size]
  );

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, dragOffset, handleMouseMove]);

  if (!isVisible || !webcamStream) {
    return null;
  }

  return (
    <Box
      ref={containerRef}
      position="fixed"
      left={`${position.x}px`}
      top={`${position.y}px`}
      width={`${size}px`}
      height={`${size}px`}
      borderRadius="50%"
      overflow="hidden"
      cursor={isRecording ? "pointer" : isDragging ? "grabbing" : "grab"}
      zIndex={9999}
      border="3px solid white"
      boxShadow={`0 4px 12px ${shadowColor}`}
      transition={isDragging ? "none" : "all 0.2s ease"}
      userSelect="none"
      onMouseDown={handleMouseDown}
      _hover={{
        transform: "scale(1.05)",
        boxShadow: `0 6px 16px ${shadowColor}`,
      }}>
      <Box
        as="video"
        ref={videoRef}
        width="100%"
        height="100%"
        objectFit="cover"
        muted
        playsInline
        autoPlay
        style={{
          transform: "scaleX(-1)", // Mirror the video like a selfie camera
          pointerEvents: "none",
        }}
      />

      {/* Countdown Overlay */}
      {isCountingDown && (
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          bg="rgba(0,0,0,0.8)"
          color="white"
          width="80%"
          height="80%"
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRadius="50%"
          fontSize="4xl"
          fontWeight="bold"
          pointerEvents="none">
          {countdown}
        </Box>
      )}

      {/* Drag Overlay */}
      {isDragging && !isRecording && (
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          bg="rgba(0,0,0,0.7)"
          color="white"
          px={2}
          py={1}
          borderRadius="md"
          fontSize="xs"
          fontWeight="bold"
          pointerEvents="none">
          Move
        </Box>
      )}
    </Box>
  );
}
