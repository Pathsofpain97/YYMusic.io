import React from 'react';
import styles from '../styles/XpWindow.module.css';

// Componente interno simple para la barra de título
const TitleBar = ({ title, onClose, onMinimize, onMaximize }) => (
  <div className={styles.titleBar}>
    <span className={styles.title}>{title}</span>
    <div className={styles.titleBarControls}>
      {onMinimize && (
        <button onClick={onMinimize} className={styles.controlButton} aria-label="Minimizar">
          _
        </button>
      )}
      {onMaximize && (
        <button onClick={onMaximize} className={styles.controlButton} aria-label="Maximizar">
          □
        </button>
      )}
      {onClose && (
        <button onClick={onClose} className={`${styles.controlButton} ${styles.closeButton}`} aria-label="Cerrar">
          X
        </button>
      )}
    </div>
  </div>
);

// Componente principal de la ventana
function XPWindow({ title = "Ventana XP", children, onClose, onMinimize, onMaximize }) {
  return (
    <div className={styles.xpWindow}>
      <TitleBar
        title={title}
        onClose={onClose}
        onMinimize={onMinimize}
        onMaximize={onMaximize}
      />
      <div className={styles.windowBody}>
        {children}
      </div>
      {/* Podrías añadir una barra de estado aquí si la necesitas */}
      {/* <div className={styles.statusBar}>Barra de estado</div> */}
    </div>
  );
}

export default XPWindow;