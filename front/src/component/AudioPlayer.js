import React, { useState, useRef, useEffect } from 'react';
import { IoIosPause } from "react-icons/io";
import { IoPlay } from "react-icons/io5";
import WaveSurfer from 'wavesurfer.js';

const AudioPlayer = ({ audioUrl }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState('0:00');
    const audioRef = useRef(null);
    const waveformRef = useRef(null);
    const wavesurferRef = useRef(null);

    useEffect(() => {
        // Initialize WaveSurfer
        wavesurferRef.current = WaveSurfer.create({
            container: waveformRef.current,
            waveColor: '#cbd5e1', 
            progressColor: '#3b82f6', 
            cursorColor: 'transparent',
            barWidth: 3,
            barGap: 2,  
            height: 64, 
            responsive: true,
        });

        // Load audio file
        wavesurferRef.current.load(audioUrl);

        // Update time display
        wavesurferRef.current.on('audioprocess', () => {
            const minutes = Math.floor(wavesurferRef.current.getCurrentTime() / 60);
            const seconds = Math.floor(wavesurferRef.current.getCurrentTime() % 60)
                .toString()
                .padStart(2, '0');
            setCurrentTime(`${minutes}:${seconds}`);
        });

        // playback finished
        wavesurferRef.current.on('finish', () => {
            setIsPlaying(false);
        });

        return () => {
            wavesurferRef.current.destroy();
        };
    }, [audioUrl]);

    const togglePlayPause = () => {
        if (wavesurferRef.current) {
            wavesurferRef.current.playPause();
            setIsPlaying(!isPlaying);
        }
    };

    return (
        <div className="min-w-[260px] bg-white rounded-lg shadow-sm p-2">
            <div className="flex items-center gap-3">
                <button
                    className="w-9 h-9 flex items-center justify-center bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                    onClick={togglePlayPause}
                >
                    {isPlaying ? <IoIosPause size={25} /> : <IoPlay size={15} className="ml-1" />}
                </button>

                <div className="flex-1" ref={waveformRef} />

                <span className="text-xs text-gray-500 min-w-[32px]">
                    {currentTime}
                </span>
            </div>
        </div>
    );
};

export default AudioPlayer;