import React, { useState, useRef, useEffect, useCallback } from 'react';
import XPWindow from './components/XPWindow';
import Playlist from './components/Playlist';
import PlayerControls from './components/PlayerControls';
import SeekBar from './components/SeekBar';
import VolumeControl from './components/VolumeControl';
import CominatchaVisualizer from './components/CominatchaVisualizer';
import ZielonyNieJestTwoimWrogiemVisualizer from './components/ZielonyNieJestTwoimWrogiemVisualizer';
import AudioVisualizer from './components/AudioVisualizer'; // Importa el AudioVisualizer
import './App.css'; // Estilos globales si los necesitas

function App() {
  const [playlist, setPlaylist] = useState([]); // { name: string, url: string }[]
  const [currentTrackIndex, setCurrentTrackIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [statusText, setStatusText] = useState("Listo");
  const [currentVisualizer, setCurrentVisualizer] = useState('default'); // Estado para la visualización actual, ahora por defecto es 'default'


  const audioRef = useRef(null); // Referencia al elemento <audio>
  const fileInputRef = useRef(null); // Referencia al input de archivo

  // --- Carga y Manejo de Archivos ---

  const handleFileChange = (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setStatusText(`Cargando ${files.length} archivo(s)...`);
    const newTracks = [];

    Array.from(files).forEach(file => {
      if (file.type === 'audio/mpeg') {
        const objectURL = URL.createObjectURL(file);
        newTracks.push({ name: file.name, url: objectURL });
      } else {
        console.warn(`Archivo ${file.name} no es MP3, omitido.`);
      }
    });

    // Limpiar URLs viejas que ya no están en la nueva lista (si se reemplaza)
    playlist.forEach(oldTrack => {
      if (!newTracks.some(newTrack => newTrack.url === oldTrack.url) && oldTrack.url) {
        URL.revokeObjectURL(oldTrack.url);
        console.log("Revoked (old):", oldTrack.url.substring(oldTrack.url.length - 10));
      }
    });

    setPlaylist(newTracks); // Reemplazar la playlist con las nuevas canciones
    setStatusText(`Listo. ${newTracks.length} canciones cargadas.`);

    // Limpiar el input para poder cargar los mismos archivos de nuevo
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }

    // Si no hay nada sonando y se cargaron canciones, preparar la primera
    if (currentTrackIndex === -1 && newTracks.length > 0) {
      setCurrentTrackIndex(0); // Preparar, pero no reproducir automáticamente
    }
  };

  const handleRemoveTrack = (indexToRemove) => {
    const newPlaylist = playlist.filter((_, index) => index !== indexToRemove);

    // Revocar la ObjectURL de la canción eliminada para liberar memoria
    const trackToRemove = playlist[indexToRemove];
    if (trackToRemove?.url) {
      URL.revokeObjectURL(trackToRemove.url);
      console.log("Revoked (removed):", trackToRemove.url.substring(trackToRemove.url.length - 10));
    }

    setPlaylist(newPlaylist);
    if (newPlaylist.length === 0) {
      setCurrentTrackIndex(-1); // Resetear la canción actual si la lista queda vacía
    } else if (indexToRemove <= currentTrackIndex && currentTrackIndex > 0) {
      setCurrentTrackIndex(currentTrackIndex - 1); // Ajustar el índice actual si se elimina una canción anterior o la actual
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // --- Carga y Selección de Pistas ---

  // Usamos useCallback para evitar recrear la función en cada render si no cambian las dependencias
  const loadTrack = useCallback((index) => {
    if (index >= 0 && index < playlist.length && audioRef.current) {
      setCurrentTrackIndex(index);
      // La URL se actualiza en el useEffect que depende de currentTrackIndex
    }
  }, [playlist]); // Depende de la playlist


  // --- Efecto para manejar la carga real en <audio> y limpieza ---
  useEffect(() => {
    if (currentTrackIndex >= 0 && currentTrackIndex < playlist.length && audioRef.current) {
      const trackUrl = playlist[currentTrackIndex].url;
      const currentSrc = audioRef.current.currentSrc; // URL cargada actualmente

      // Solo cargar si la URL es diferente a la actual para evitar recargas innecesarias
      if (currentSrc !== trackUrl) {
        audioRef.current.src = trackUrl;
        audioRef.current.load(); // Cargar la nueva fuente
        // Resetear tiempo y duración visualmente hasta que carguen metadatos
        setCurrentTime(0);
        setDuration(0);
        // Si queremos que empiece a sonar al seleccionar una nueva pista
        // audioRef.current.play().catch(e => console.error("Error al reproducir:", e));
      }
      setStatusText(`Cargado: ${playlist[currentTrackIndex].name}`);

    } else if (playlist.length === 0) {
      // Si la playlist está vacía, resetear todo
      if (audioRef.current) audioRef.current.src = '';
      setCurrentTrackIndex(-1);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setStatusText("Listo");
    }

    // No necesitamos limpiar (revokeObjectURL) aquí directamente,
    // lo haremos al desmontar el componente o al cambiar la lista *completamente*.
    // La limpieza principal de listeners está en otro useEffect.

  }, [currentTrackIndex, playlist]); // Ejecutar cuando cambie el índice o la playlist


  // --- Controles de Reproducción (Funciones) ---

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      if (currentTrackIndex === -1 && playlist.length > 0) {
        // Si no hay nada seleccionado, empieza por la primera
        loadTrack(0); // Carga la primera pista
        // El play real lo gatillará el evento 'canplay' o un pequeño delay
        setTimeout(() => audioRef.current?.play().catch(e => console.error("Error al iniciar reproducción:", e)), 100);
      } else if (currentTrackIndex !== -1) {
        audioRef.current.play().catch(e => console.error("Error al reproducir:", e));
      }
    }
    // setIsPlaying se actualizará mediante los eventos 'play' y 'pause' del <audio>
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const handleNext = useCallback(() => {
    if (playlist.length === 0) return;
    const nextIndex = (currentTrackIndex + 1) % playlist.length; // Loop
    loadTrack(nextIndex);
    // Opcional: iniciar reproducción automáticamente al pasar a la siguiente
    // Necesita un pequeño delay para asegurar que load() se complete
    setTimeout(() => audioRef.current?.play().catch(e => console.error("Error al reproducir next:", e)), 50);
  }, [currentTrackIndex, playlist, loadTrack]);

  const handlePrev = () => {
    if (playlist.length === 0) return;
    // Si la canción lleva más de 3 segundos, la reinicia
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      if (!isPlaying) audioRef.current.play().catch(e => console.error("Error al reiniciar pista:", e));
    } else {
      // Si no, va a la anterior
      const prevIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length; // Loop
      loadTrack(prevIndex);
      // Opcional: iniciar reproducción automáticamente
      setTimeout(() => audioRef.current?.play().catch(e => console.error("Error al reproducir prev:", e)), 50);
    }
  };

  const handleSeek = (eventOrValue) => {
    let value;
    if (typeof eventOrValue === 'object' && eventOrValue.target) {
      value = parseFloat(eventOrValue.target.value); // From range input event
    } else {
      value = parseFloat(eventOrValue); // Directly passed value
    }
    if (audioRef.current && !isNaN(value)) {
      audioRef.current.currentTime = value;
      setCurrentTime(value); // Update state immediately for responsiveness
    }
  };


  const handleVolumeChange = (event) => {
    const newVolume = parseFloat(event.target.value);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setVolume(newVolume);
  };

  const handleTrackSelect = (index) => {
    loadTrack(index);
    // Reproducir automáticamente al seleccionar de la lista
    setTimeout(() => audioRef.current?.play().catch(e => console.error("Error al reproducir selección:", e)), 50);
  };


  // --- Efecto para añadir y limpiar listeners del <audio> ---
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updatePlayState = () => setIsPlaying(true);
    const updatePauseState = () => setIsPlaying(false);
    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleTrackEnd = () => handleNext(); // Llama a la función next definida arriba

    // Añadir listeners
    audio.addEventListener('play', updatePlayState);
    audio.addEventListener('pause', updatePauseState);
    audio.addEventListener('ended', handleTrackEnd);
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    // También actualizar duración si cambia la fuente (loadedmetadata no siempre salta)
    audio.addEventListener('durationchange', updateDuration);

    // Función de limpieza: se ejecuta cuando el componente se desmonta
    // o antes de que el efecto se vuelva a ejecutar si cambian sus dependencias
    return () => {
      audio.removeEventListener('play', updatePlayState);
      audio.removeEventListener('pause', updatePauseState);
      audio.removeEventListener('ended', handleTrackEnd);
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('durationchange', updateDuration);
    };
  }, [handleNext]); // Re-attach listeners if handleNext changes (due to playlist change)

  // --- Efecto para limpiar Object URLs ---
  useEffect(() => {
    // Guardamos las URLs actuales en el momento que el efecto se monta o actualiza
    const urlsToManage = playlist.map(track => track.url);

    // La función de limpieza se ejecuta cuando el componente se desmonta
    // o cuando la 'playlist' cambia antes de ejecutar el efecto de nuevo
    return () => {
      console.log("Limpiando URLs para playlist anterior...");
      urlsToManage.forEach(url => {
        // Solo revocar si la URL existe (para evitar errores si el array tiene elementos sin URL)
        if (url) {
          URL.revokeObjectURL(url);
          console.log("Revoked:", url.substring(url.length - 10)); // Log corto
        }
      });
    };
  }, [playlist]); // Depende de la playlist


  // --- Formato de Tiempo ---
  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds === Infinity) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };


    // --- Funciones para cambiar la visualización ---
    const switchToCominatcha = () => {
      setCurrentVisualizer('cominatcha');
    };
  
    const switchToZielony = () => {
      setCurrentVisualizer('zielony');
    };

    const switchToDefaultVisualizer = () => {
      setCurrentVisualizer('default');
    };


  // --- Renderizado ---
  return (
    <div className="App">
    <audio ref={audioRef} />
    <input
      type="file"
      accept=".mp3"
      multiple
      ref={fileInputRef}
      onChange={handleFileChange}
      style={{ display: 'none' }}
    />

    <XPWindow
      title="Yin Yang Music ☯"
      onClose={() => console.log("Cerrar")}
      onMinimize={() => console.log("Minimizar")}
      onMaximize={() => console.log("Maximizar")}
    >
      <div style={{ display: 'flex', gap: '15px' }}>
        <Playlist
          tracks={playlist}
          currentTrackIndex={currentTrackIndex}
          onTrackSelect={handleTrackSelect}
          onLoadClick={triggerFileInput}
          onRemoveTrack={handleRemoveTrack}
        />
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column'}}>
          <div style={{ padding: '10px', textAlign: 'center', minHeight: '30px', border: '1px solid #ccc', marginBottom: '10px'}}>
            {currentTrackIndex !== -1 ? playlist[currentTrackIndex]?.name : "Nada reproduciendo..."}
          </div>
          <PlayerControls
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onStop={handleStop}
            onNext={handleNext}
            onPrev={handlePrev}
          />
          <SeekBar
            currentTime={currentTime}
            duration={duration}
            onSeek={handleSeek}
            formatTime={formatTime}
          />
          <VolumeControl
            volume={volume}
            onVolumeChange={handleVolumeChange}
          />

          {/* Controles para cambiar la visualización */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'center' }}>
            <button onClick={switchToCominatcha} className="xp-button-general">Cominatcha</button>
            <button onClick={switchToZielony} className="xp-button-general">Zielony</button>
            <button onClick={switchToDefaultVisualizer} className="xp-button-general">Default</button>
          </div>

          {/* Renderizado condicional de la visualización */}
          {currentVisualizer === 'cominatcha' && <CominatchaVisualizer audioRef={audioRef} />}
          {currentVisualizer === 'zielony' && <ZielonyNieJestTwoimWrogiemVisualizer audioRef={audioRef} />}
          {currentVisualizer === 'default' && <AudioVisualizer audioRef={audioRef} />}

        </div>
      </div>
      <div className="status-bar" style={{ background:'#f0f0f0', borderTop: '1px solid #ccc', padding: '3px 8px', fontSize: '11px', color: '#555', marginTop: '10px' }}>
        {statusText}
      </div>
    </XPWindow>
  </div>
  );
}

export default App;