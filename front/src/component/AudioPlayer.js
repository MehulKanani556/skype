import React, { useState, useRef } from 'react';
import { IoIosPause } from "react-icons/io";
import { IoPlay } from "react-icons/io5";

const AudioPlayer = ({ audioUrl }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState('0:00');
    const audioRef = useRef(null);

    const togglePlayPause = () => {
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            // Ensure that play is not called if pause is in progress
            audioRef.current.play().catch(error => {
                console.error("Error trying to play audio:", error);
            });
        }
        setIsPlaying(!isPlaying);
    };

    const updateTime = () => {
        if (audioRef.current.duration) {
            const minutes = Math.floor(audioRef.current.currentTime / 60);
            const seconds = Math.floor(audioRef.current.currentTime % 60)
                .toString()
                .padStart(2, '0');
            setCurrentTime(`${minutes}:${seconds}`);
            
            // Update the progress bar width
            const progressBar = document.querySelector('.progress-bar');
            if (progressBar) {
                progressBar.style.width = `${(audioRef.current.currentTime / audioRef.current.duration) * 100}%`;
            }
        }
    };

    return (
        <div className="min-w-[260px] bg-white rounded-lg shadow-sm p-2">
            <div className="flex items-center gap-3">
                <button 
                    className="w-9 h-9 flex items-center justify-center bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                    onClick={togglePlayPause}
                >
                    {isPlaying ? <IoIosPause size={15} /> : <IoPlay size={15} className="ml-1" />}
                </button>
               
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-gray-300 transition-all duration-100 progress-bar"
                        style={{
                            width: `${(audioRef.current?.currentTime / (audioRef.current?.duration || 1)) * 100}%`
                        }}
                    />
                </div>

                <span className="text-xs text-gray-500 min-w-[32px]">
                    {currentTime}
                </span>
            </div>

            <audio
                ref={audioRef}
                src={audioUrl}
                onTimeUpdate={updateTime}
                onEnded={() => setIsPlaying(false)}
            />
        </div>
    );
};

export default AudioPlayer;