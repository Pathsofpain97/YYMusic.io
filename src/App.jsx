import React, { useState, useRef, useEffect, useCallback } from 'react';
import XPWindow from './components/XPWindow';
import Playlist from './components/Playlist';
import PlayerControls from './components/PlayerControls';
import SeekBar from './components/SeekBar';
import VolumeControl from './components/VolumeControl';
import CominatchaVisualizer from './components/CominatchaVisualizer';
import ZielonyNieJestTwoimWrogiemVisualizer from './components/ZielonyNieJestTwoimWrogiemVisualizer';
import AudioVisualizer from './components/AudioVisualizer';
import './App.css';

function App() {
  const [playlist, setPlaylist] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [statusText, setStatusText] = useState("Listo");
  const [currentVisualizer, setCurrentVisualizer] = useState('default');

  const audioRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setStatusText(`Cargando ${files.length} archivo(s)...`);
    const newTracks = [];

    Array.from(files).forEach(file => {
      if (file.type.startsWith('audio/')) {
        const objectURL = URL.createObjectURL(file);
        newTracks.push({ name: file.name, url: objectURL });
      } else {
        console.warn(`Archivo ${file.name} (${file.type}) no es un tipo de audio compatible, omitido.`);
      }
    });

    playlist.forEach(oldTrack => {
      if (!newTracks.some(newTrack => newTrack.url === oldTrack.url) && oldTrack.url) {
        URL.revokeObjectURL(oldTrack.url);
        console.log("Revoked (old):", oldTrack.url.substring(oldTrack.url.length - 10));
      }
    });

    setPlaylist(newTracks);
    setStatusText(`Listo. ${newTracks.length} canciones cargadas.`);

    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }

    if (currentTrackIndex === -1 && newTracks.length > 0) {
      setCurrentTrackIndex(0);
    }
  };

  const handleRemoveTrack = (indexToRemove) => {
    const newPlaylist = playlist.filter((_, index) => index !== indexToRemove);

    const trackToRemove = playlist[indexToRemove];
    if (trackToRemove?.url) {
      URL.revokeObjectURL(trackToRemove.url);
      console.log("Revoked (removed):", trackToRemove.url.substring(trackToRemove.url.length - 10));
    }

    setPlaylist(newPlaylist);
    if (newPlaylist.length === 0) {
      setCurrentTrackIndex(-1);
    } else if (indexToRemove <= currentTrackIndex && currentTrackIndex > 0) {
      setCurrentTrackIndex(currentTrackIndex - 1);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const loadTrack = useCallback((index) => {
    if (index >= 0 && index < playlist.length && audioRef.current) {
      setCurrentTrackIndex(index);
    }
  }, [playlist]);

  useEffect(() => {
    if (currentTrackIndex >= 0 && currentTrackIndex < playlist.length && audioRef.current) {
      const trackUrl = playlist[currentTrackIndex].url;
      const currentSrc = audioRef.current.currentSrc;

      if (currentSrc !== trackUrl) {
        audioRef.current.src = trackUrl;
        audioRef.current.load();
        setCurrentTime(0);
        setDuration(0);
      }
      setStatusText(`Cargado: ${playlist[currentTrackIndex].name}`);
    } else if (playlist.length === 0) {
      if (audioRef.current) audioRef.current.src = '';
      setCurrentTrackIndex(-1);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setStatusText("Listo");
    }
  }, [currentTrackIndex, playlist]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      if (currentTrackIndex === -1 && playlist.length > 0) {
        loadTrack(0);
        setTimeout(() => audioRef.current?.play().catch(e => console.error("Error al iniciar reproducción:", e)), 100);
      } else if (currentTrackIndex !== -1) {
        audioRef.current.play().catch(e => console.error("Error al reproducir:", e));
      }
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const handleNext = useCallback(() => {
    if (playlist.length === 0) return;
    const nextIndex = (currentTrackIndex + 1) % playlist.length;
    loadTrack(nextIndex);
    setTimeout(() => audioRef.current?.play().catch(e => console.error("Error al reproducir next:", e)), 50);
  }, [currentTrackIndex, playlist, loadTrack]);

  const handlePrev = () => {
    if (playlist.length === 0) return;
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      if (!isPlaying) audioRef.current.play().catch(e => console.error("Error al reiniciar pista:", e));
    } else {
      const prevIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
      loadTrack(prevIndex);
      setTimeout(() => audioRef.current?.play().catch(e => console.error("Error al reproducir prev:", e)), 50);
    }
  };

  const handleSeek = (eventOrValue) => {
    let value;
    if (typeof eventOrValue === 'object' && eventOrValue.target) {
      value = parseFloat(eventOrValue.target.value);
    } else {
      value = parseFloat(eventOrValue);
    }
    if (audioRef.current && !isNaN(value)) {
      audioRef.current.currentTime = value;
      setCurrentTime(value);
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
    setTimeout(() => audioRef.current?.play().catch(e => console.error("Error al reproducir selección:", e)), 50);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updatePlayState = () => setIsPlaying(true);
    const updatePauseState = () => setIsPlaying(false);
    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleTrackEnd = () => handleNext();

    audio.addEventListener('play', updatePlayState);
    audio.addEventListener('pause', updatePauseState);
    audio.addEventListener('ended', handleTrackEnd);
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('durationchange', updateDuration);

    return () => {
      audio.removeEventListener('play', updatePlayState);
      audio.removeEventListener('pause', updatePauseState);
      audio.removeEventListener('ended', handleTrackEnd);
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('durationchange', updateDuration);
    };
  }, [handleNext]);

  useEffect(() => {
    const urlsToManage = playlist.map(track => track.url);
    return () => {
      console.log("Limpiando URLs para playlist anterior...");
      urlsToManage.forEach(url => {
        if (url) {
          URL.revokeObjectURL(url);
          console.log("Revoked:", url.substring(url.length - 10));
        }
      });
    };
  }, [playlist]);

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds === Infinity) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const switchToCominatcha = () => {
    setCurrentVisualizer('cominatcha');
  };

  const switchToZielony = () => {
    setCurrentVisualizer('zielony');
  };

  const switchToDefaultVisualizer = () => {
    setCurrentVisualizer('default');
  };

  return (
    <div className="App">
      <audio ref={audioRef} />
      <input
        type="file"
        accept="audio/*"
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Playlist
            tracks={playlist}
            currentTrackIndex={currentTrackIndex}
            onTrackSelect={handleTrackSelect}
            onLoadClick={triggerFileInput}
            onRemoveTrack={handleRemoveTrack}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '0 10px' }}>
            <div style={{ padding: '10px', textAlign: 'center', minHeight: '30px', border: '1px solid #ccc' }}>
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
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={switchToCominatcha} className="xp-button-general">Cominatcha</button>
              <button onClick={switchToZielony} className="xp-button-general">Zielony</button>
              <button onClick={switchToDefaultVisualizer} className="xp-button-general">Default</button>
            </div>
            {currentVisualizer === 'cominatcha' && <CominatchaVisualizer audioRef={audioRef} />}
            {currentVisualizer === 'zielony' && <ZielonyNieJestTwoimWrogiemVisualizer audioRef={audioRef} />}
            {currentVisualizer === 'default' && <AudioVisualizer audioRef={audioRef} />}
          </div>
        </div>
        <div className="status-bar" style={{ background: '#f0f0f0', borderTop: '1px solid #ccc', padding: '3px 8px', fontSize: '11px', color: '#555' }}>
          {statusText}
        </div>
      </XPWindow>
    </div>
  );
}

export default App;