import React from 'react';
import styles from '../styles/VolumeControl.module.css';

function VolumeControl({ volume = 1, onVolumeChange }) {
  return (
    <div className={styles.volumeContainer}>
      <span className={styles.volumeIcon} aria-label="Volumen">🔊</span>
      <input
        type="range"
        className={styles.volumeSlider}
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={onVolumeChange}
        aria-label="Control de volumen"
      />
    </div>
  );
}

export default VolumeControl;
