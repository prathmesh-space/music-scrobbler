import { useEffect, useRef } from 'react';

export default function WaveformVisualizer({ isRecording, analyzerData }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, width, height);

      if (isRecording && analyzerData) {
        const bufferLength = analyzerData.length;
        const barWidth = (width / bufferLength) * 2.5;
        let x = 0;

        analyzerData.forEach((value, i) => {
          const barHeight = (value / 255) * height * 0.8;
          const hue = (i / bufferLength) * 360;
          
          // Neon glow effect
          ctx.shadowBlur = 20;
          ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
          ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
          
          ctx.fillRect(x, height - barHeight, barWidth - 2, barHeight);
          x += barWidth;
        });
      } else {
        // Idle state - pulsing waves
        const time = Date.now() / 1000;
        for (let i = 0; i < width; i += 8) {
          const wave1 = Math.sin(i / 30 + time * 2) * 20;
          const wave2 = Math.sin(i / 50 + time * 3) * 15;
          const y = height / 2 + wave1 + wave2;
          
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#00ffff';
          ctx.fillStyle = '#00ffff';
          ctx.fillRect(i, y - 2, 4, 4);
        }
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording, analyzerData]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={200}
      style={{
        width: '100%',
        height: '200px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
        border: '2px solid rgba(0, 255, 255, 0.2)'
      }}
    />
  );
}
