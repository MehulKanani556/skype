import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Main from '../pages/main'


export default function AuthRoutes() {
    return (
        <div>
                <Routes>
                    <Route path="/" element={< Main/>} />
                </Routes>
        </div>
    )
}
