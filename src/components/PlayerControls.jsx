import React from 'react';
import styles from '../styles/PlayerControls.module.css'; // Importa el CSS Module

function PlayerControls({ isPlaying, onPlayPause, onStop, onNext, onPrev }) {
  return (
    <div className={styles.controlsContainer}> {/* Usa la clase del CSS Module */}
      <button onClick={onPrev} className={`${styles.xpButton} ${styles.controlIcon} ${styles.prev}`} aria-label="Anterior"></button>
      <button onClick={onPlayPause} className={`${styles.xpButton} ${styles.controlIcon} ${isPlaying ? styles.pause : styles.play}`} aria-label={isPlaying ? 'Pausar' : 'Reproducir'}></button>
      <button onClick={onStop} className={`${styles.xpButton} ${styles.controlIcon} ${styles.stop}`} aria-label="Detener"></button>
      <button onClick={onNext} className={`${styles.xpButton} ${styles.controlIcon} ${styles.next}`} aria-label="Siguiente"></button>
    </div>
  );
}

export default PlayerControls;
