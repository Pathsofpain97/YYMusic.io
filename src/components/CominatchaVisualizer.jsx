import React, { useRef, useEffect } from 'react';

function CominatchaVisualizer({ audioRef }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    const canvas = canvasRef.current;
    let audioContext;
    let analyser;
    let source;
    let dataArray;

    if (audio && canvas) {
      const canvasCtx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      const numLines = 30;
      const lineSpacing = width / (numLines + 1);
      const centerY = height / 2;

      const visualize = () => {
        if (!analyser) return;

        analyser.getByteTimeDomainData(dataArray);

        canvasCtx.clearRect(0, 0, width, height);

        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = 'cyan';

        for (let i = 0; i < numLines; i++) {
          const x = (i + 1) * lineSpacing;
          const amplitude = (dataArray[Math.floor(i * dataArray.length / numLines)] / 128.0) * 50;

          canvasCtx.beginPath();
          canvasCtx.moveTo(x, centerY - amplitude);
          canvasCtx.lineTo(x, centerY + amplitude);
          canvasCtx.stroke();
        }

        requestAnimationFrame(visualize);
      };

      const setupAudio = () => {
        if (!audioContext) {
          audioContext = new (window.AudioContext || window.webkitAudioContext)();
          source = audioContext.createMediaElementSource(audio);
          analyser = audioContext.createAnalyser();
          analyser.fftSize = 2048;
          dataArray = new Uint8Array(analyser.fftSize);
          source.connect(analyser);
          analyser.connect(audioContext.destination);
          visualize();
        }
      };

      if (audio.readyState >= 2) {
        setupAudio();
      } else {
        audio.addEventListener('loadeddata', setupAudio);
      }

      return () => {
        if (audio) {
          audio.removeEventListener('loadeddata', setupAudio);
        }
        if (audioContext) {
          audioContext.close();
        }
      };
    }
  }, [audioRef]);

  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth < 768 ? 280 : 300}
      height={window.innerWidth < 768 ? 120 : 150}
      style={{ border: '1px solid #555', backgroundColor: 'black', marginTop: '10px', width: '100%' }}
    />
  );
}

export default CominatchaVisualizer;