import React from 'react';
import styles from '../styles/SeekBar.module.css';

function SeekBar({ currentTime = 0, duration = 0, onSeek, formatTime }) {

  const handleSeekChange = (event) => {
    onSeek(event); // Pasa el evento completo a App.jsx
  };

  return (
    <div className={styles.progressContainer}>
      <span className={styles.timeDisplay}>{formatTime(currentTime)}</span>
      <input
        type="range"
        className={styles.seekBar}
        min="0"
        max={duration || 0} // Asegura que max nunca sea NaN
        value={currentTime || 0} // Asegura que value nunca sea NaN
        step="1" // Buscar por segundos
        onChange={handleSeekChange}
        aria-label="Barra de progreso"
        disabled={duration === 0} // Deshabilitar si no hay duración
      />
      <span className={styles.timeDisplay}>{formatTime(duration)}</span>
    </div>
  );
}

export default SeekBar;