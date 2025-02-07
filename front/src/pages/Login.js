import React, { useState } from 'react';

const Login = () => {
  const [isRightPanelActive, setIsRightPanelActive] = useState(false);

  const togglePanel = () => {
    setIsRightPanelActive(!isRightPanelActive);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4">
      <h2 className="text-2xl mb-8">Weekly Coding Challenge #1: Sign in/up Form</h2>
      
      <div className={`bg-white rounded-lg shadow-2xl relative overflow-hidden w-full max-w-4xl min-h-[480px] ${
        isRightPanelActive ? 'right-panel-active' : ''
      }`}>
        {/* Sign Up Container */}
        <div className={`absolute top-0 h-full transition-all duration-600 ease-in-out w-1/2 
          ${isRightPanelActive ? 'translate-x-full opacity-100 z-50' : 'opacity-0 z-10'}`}>
          <form className="bg-white flex flex-col items-center justify-center px-10 h-full">
            <h1 className="text-2xl font-bold mb-4">Create Account</h1>
            <div className="flex gap-4 my-4">
              <a href="#" className="border rounded-full w-10 h-10 flex items-center justify-center">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="border rounded-full w-10 h-10 flex items-center justify-center">
                <i className="fab fa-google-plus-g"></i>
              </a>
              <a href="#" className="border rounded-full w-10 h-10 flex items-center justify-center">
                <i className="fab fa-linkedin-in"></i>
              </a>
            </div>
            <span className="text-sm mb-4">or use your email for registration</span>
            <input 
              type="text" 
              placeholder="Name" 
              className="bg-gray-100 border-none px-4 py-2 mb-2 w-full rounded"
            />
            <input 
              type="email" 
              placeholder="Email" 
              className="bg-gray-100 border-none px-4 py-2 mb-2 w-full rounded"
            />
            <input 
              type="password" 
              placeholder="Password" 
              className="bg-gray-100 border-none px-4 py-2 mb-4 w-full rounded"
            />
            <button className="bg-red-500 text-white rounded-full px-12 py-3 font-bold uppercase tracking-wide hover:bg-red-600 transition-colors">
              Sign Up
            </button>
          </form>
        </div>

        {/* Sign In Container */}
        <div className={`absolute top-0 h-full transition-all duration-600 ease-in-out left-0 w-1/2 z-20
          ${isRightPanelActive ? 'translate-x-full' : ''}`}>
          <form className="bg-white flex flex-col items-center justify-center px-10 h-full">
            <h1 className="text-2xl font-bold mb-4">Sign in</h1>
            <div className="flex gap-4 my-4">
              <a href="#" className="border rounded-full w-10 h-10 flex items-center justify-center">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="border rounded-full w-10 h-10 flex items-center justify-center">
                <i className="fab fa-google-plus-g"></i>
              </a>
              <a href="#" className="border rounded-full w-10 h-10 flex items-center justify-center">
                <i className="fab fa-linkedin-in"></i>
              </a>
            </div>
            <span className="text-sm mb-4">or use your account</span>
            <input 
              type="email" 
              placeholder="Email" 
              className="bg-gray-100 border-none px-4 py-2 mb-2 w-full rounded"
            />
            <input 
              type="password" 
              placeholder="Password" 
              className="bg-gray-100 border-none px-4 py-2 mb-4 w-full rounded"
            />
            <a href="#" className="text-sm mb-4">Forgot your password?</a>
            <button className="bg-red-500 text-white rounded-full px-12 py-3 font-bold uppercase tracking-wide hover:bg-red-600 transition-colors">
              Sign In
            </button>
          </form>
        </div>

        {/* Overlay Container */}
        <div className={`absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-transform duration-600 ease-in-out z-100
          ${isRightPanelActive ? '-translate-x-full' : ''}`}>
          <div className={`bg-gradient-to-r from-red-500 to-red-600 text-white relative -left-full h-full w-[200%] transform 
            ${isRightPanelActive ? 'translate-x-1/2' : 'translate-x-0'} transition-transform duration-600 ease-in-out`}>
            
            {/* Overlay Left */}
            <div className={`absolute flex flex-col items-center justify-center px-10 text-center top-0 h-full w-1/2 transition-transform duration-600 ease-in-out
              ${isRightPanelActive ? 'translate-x-0' : '-translate-x-[20%]'}`}>
              <h1 className="text-2xl font-bold mb-4">Welcome Back!</h1>
              <p className="text-sm mb-4">To keep connected with us please login with your personal info</p>
              <button 
                onClick={togglePanel}
                className="border border-white bg-transparent text-white rounded-full px-12 py-3 font-bold uppercase tracking-wide hover:bg-white/10 transition-colors"
              >
                Sign In
              </button>
            </div>

            {/* Overlay Right */}
            <div className={`absolute flex flex-col items-center justify-center px-10 text-center top-0 right-0 h-full w-1/2 transition-transform duration-600 ease-in-out
              ${isRightPanelActive ? 'translate-x-[20%]' : 'translate-x-0'}`}>
              <h1 className="text-2xl font-bold mb-4">Hello, Friend!</h1>
              <p className="text-sm mb-4">Enter your personal details and start journey with us</p>
              <button 
                onClick={togglePanel}
                className="border border-white bg-transparent text-white rounded-full px-12 py-3 font-bold uppercase tracking-wide hover:bg-white/10 transition-colors"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;