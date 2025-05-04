import React from 'react';
import styles from '../styles/Playlist.module.css';

function Playlist({ tracks = [], currentTrackIndex = -1, onTrackSelect, onLoadClick, onRemoveTrack }) {
  return (
    <div className={styles.playlistSection}>
      <h3 className={styles.playlistTitle}>Lista de Reproducción</h3>
      <ul className={styles.playlist}>
        {tracks.length === 0 ? (
          <li className={styles.emptyPlaylist}>No hay canciones cargadas.</li>
        ) : (
          tracks.map((track, index) => (
            <li
              key={`${track.name}-${index}`} // Clave única
              className={`${styles.playlistItem} ${index === currentTrackIndex ? styles.playing : ''}`}
            >
              <button
                className={styles.trackInfo}
                onClick={() => onTrackSelect(index)} // Llama a la función pasada por App
                title={`Reproducir ${track.name}`} // Muestra nombre completo al pasar el mouse
              >
                {track.name}
              </button>
              <button
                className={styles.removeButton}
                onClick={() => onRemoveTrack(index)}
                aria-label={`Eliminar ${track.name}`}
                title="Eliminar canción" // <-- Añadimos el atributo title
              >
                X
              </button>
            </li>
          ))
        )}
      </ul>
      <button onClick={onLoadClick} className={`${styles.loadButton} xp-button-general`}>
        Cargar Archivos MP3/Audio Disfruta!
      </button>
    </div>
  );
}

export default Playlist;