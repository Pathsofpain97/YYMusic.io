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

        canvasCtx.clearRect(0, 0, width, height); // Limpiar el canvas

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
        if (!audioContext) {
          audioContext = new (window.AudioContext || window.webkitAudioContext)();
          source = audioContext.createMediaElementSource(audio);
          analyser = audioContext.createAnalyser();
          source.connect(analyser);
          analyser.connect(audioContext.destination);
          visualize();
        }
      };

      if (audio.readyState >= 2) { // Asegurarse de que el audio esté cargado parcialmente al menos
        setupAudio();
      } else {
        audio.addEventListener('loadeddata', setupAudio);
      }

      // Limpieza al desmontar el componente
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
      width={300} // Puedes ajustar el ancho
      height={100} // Puedes ajustar la altura
      style={{ border: '1px solid #ccc', marginTop: '10px' }}
    />
  );
}

export default AudioVisualizer;