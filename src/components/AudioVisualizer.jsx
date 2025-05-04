import React, { useRef, useEffect } from 'react';

function AudioVisualizer({ audioRef }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    const canvas = canvasRef.current;
    let audioContext;
    let analyser;
    let source;

    if (audio && canvas) {
      const canvasCtx = canvas.getContext('2d');

      const visualize = () => {
        if (!analyser) return;

        const bufferLength = analyser.fftSize;
        const dataArray = new Uint8Array(bufferLength);

        const width = canvas.width;
        const height = canvas.height;

        canvasCtx.clearRect(0, 0, width, height);

        analyser.getByteTimeDomainData(dataArray);

        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = 'rgb(0, 0, 0)';
        canvasCtx.beginPath();

        const sliceWidth = width * 1.0 / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = v * height / 2;

          if (i === 0) {
            canvasCtx.moveTo(x, y);
          } else {
            canvasCtx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        canvasCtx.lineTo(width, height / 2);
        canvasCtx.stroke();

        requestAnimationFrame(visualize);
      };

      const setupAudio = () => {
        if (!audioRef.current || audioContext) return; // Añadido check para audioRef.current
        if (!audioContext) {
          audioContext = new (window.AudioContext || window.webkitAudioContext)();
          source = audioContext.createMediaElementSource(audio);
          analyser = audioContext.createAnalyser();
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
      width={window.innerWidth < 768 ? 280 : 300} // Ajusta ancho para móviles
      height={window.innerWidth < 768 ? 80 : 100} // Ajusta altura para móviles
      style={{ border: '1px solid #ccc', marginTop: '10px', width: '100%' }}
    />
  );
}

export default AudioVisualizer;