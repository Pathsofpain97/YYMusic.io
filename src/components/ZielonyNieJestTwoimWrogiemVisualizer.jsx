import React, { useRef, useEffect } from 'react';

function ZielonyNieJestTwoimWrogiemVisualizer({ audioRef }) {
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
      const centerY = height / 2;

      const visualize = () => {
        if (!analyser) return;

        analyser.getByteTimeDomainData(dataArray);

        canvasCtx.clearRect(0, 0, width, height);
        canvasCtx.lineWidth = 3;
        canvasCtx.strokeStyle = 'lime';
        canvasCtx.beginPath();

        for (let i = 0; i < width; i++) {
          const index = Math.floor(i * dataArray.length / width);
          const normalizedValue = (dataArray[index] - 128) / 128.0;
          const y = centerY + normalizedValue * 80;

          if (i === 0) {
            canvasCtx.moveTo(i, y);
          } else {
            canvasCtx.lineTo(i, y);
          }
        }
        canvasCtx.stroke();

        requestAnimationFrame(visualize);
      };

      const setupAudio = () => {
        if (!audioRef.current || audioContext) return;
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
      style={{ border: '1px solid #777', backgroundColor: 'black', marginTop: '10px', width: '100%' }}
    />
  );
}

export default ZielonyNieJestTwoimWrogiemVisualizer;