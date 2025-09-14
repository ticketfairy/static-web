import { useEffect, useState, useRef } from 'react';
import { Box } from '@chakra-ui/react';

interface Sparkle {
  id: number;
  x: number;
  y: number;
  opacity: number;
  scale: number;
  rotation: number;
  emoji: string;
  createdAt: number;
}

const SPARKLE_EMOJIS = ['✨', '⭐', '🌟', '💫', '✨', '⭐', '🌟', '💫'];
const MAX_SPARKLES = 15;
const FADE_DURATION = 1500; // 1.5 seconds
const TRAIL_DISTANCE = 40; // Minimum distance between sparkles

export default function SparkleTrail() {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const lastSparkleRef = useRef<{ x: number; y: number } | null>(null);
  const sparkleIdRef = useRef(0);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      // Check if we should create a new sparkle based on distance
      const shouldCreateSparkle = !lastSparkleRef.current || 
        Math.sqrt(
          Math.pow(mouseX - lastSparkleRef.current.x, 2) + 
          Math.pow(mouseY - lastSparkleRef.current.y, 2)
        ) > TRAIL_DISTANCE;

      if (shouldCreateSparkle) {
        const now = Date.now();
        const newSparkle: Sparkle = {
          id: sparkleIdRef.current++,
          x: mouseX,
          y: mouseY,
          opacity: 1,
          scale: Math.random() * 0.6 + 0.4, // Random scale between 0.4 and 1
          rotation: Math.random() * 360,
          emoji: SPARKLE_EMOJIS[Math.floor(Math.random() * SPARKLE_EMOJIS.length)],
          createdAt: now
        };

        setSparkles(prev => {
          const newSparkles = [...prev, newSparkle];
          return newSparkles.length > MAX_SPARKLES ? newSparkles.slice(-MAX_SPARKLES) : newSparkles;
        });

        lastSparkleRef.current = { x: mouseX, y: mouseY };
      }
    };

    const animateSparkles = () => {
      const now = Date.now();
      
      setSparkles(prev => 
        prev
          .map(sparkle => {
            const age = now - sparkle.createdAt;
            const progress = age / FADE_DURATION;
            
            return {
              ...sparkle,
              opacity: Math.max(0, 1 - progress),
              scale: sparkle.scale * Math.max(0.3, 1 - progress * 0.7),
              rotation: sparkle.rotation + age * 0.05
            };
          })
          .filter(sparkle => sparkle.opacity > 0)
      );

      animationRef.current = requestAnimationFrame(animateSparkles);
    };

    // Start animation loop
    animationRef.current = requestAnimationFrame(animateSparkles);

    // Add mouse move listener
    window.addEventListener('mousemove', handleMouseMove);

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      width="100vw"
      height="100vh"
      pointerEvents="none"
      zIndex={9999}
    >
      {sparkles.map((sparkle) => (
        <Box
          key={sparkle.id}
          position="absolute"
          left={`${sparkle.x - 12}px`}
          top={`${sparkle.y - 12}px`}
          fontSize="24px"
          opacity={sparkle.opacity}
          transform={`scale(${sparkle.scale}) rotate(${sparkle.rotation}deg)`}
          userSelect="none"
          style={{
            textShadow: '0 0 15px rgba(255, 255, 255, 0.9), 0 0 30px rgba(255, 255, 255, 0.5)',
            filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.8))',
            transition: 'none' // Disable CSS transitions for smooth animation
          }}
        >
          {sparkle.emoji}
        </Box>
      ))}
    </Box>
  );
}
