import React from 'react';
import { BsTelephone } from 'react-icons/bs';
import { FaSurfing } from 'react-icons/fa';
import { IoCaretDown } from 'react-icons/io5';

const Front = () => {
    return (
        <div className="min-h-screen bg-white p-8">
            {/* Header Section */}
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-12">
                    <div className="relative">
                        <img
                            src="/api/placeholder/48/48"
                            alt="Profile"
                            className="rounded-full w-12 h-12"
                        />
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex-1">
                        <h1 className="text-2xl text-gray-800">Welcome!</h1>
                        <p className="text-gray-800 text-2xl font-semibold">Archit Bhuva</p>
                    </div>
                    <button className="px-4 py-2 text-blue-600 border border-blue-600 rounded-full hover:bg-blue-50">
                        Share profile
                    </button>
                </div>

                <h2 className="text-lg text-gray-700 mb-8">Here are some quick actions to get you started</h2>

                {/* Cards Container */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Easy Meetings Card */}
                    <div className="p-6 border rounded-lg bg-white shadow-sm">
                        <div className="flex flex-col items-center text-center">
                            <div className="mb-4">
                                {/* <FaSurfing className="text-6xl text-blue-500" /> */}
                                <img src={require('../img/1st.png')} alt="Profile" className="" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Easy meetings with anyone</h3>
                            <p className="text-gray-400 mb-6 font-semibold">
                                Share the invite with anyone even if they aren't on Skype. No sign ups or downloads required.
                            </p>
                            <button className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 flex items-center gap-2">
                                Meet Now
                                {/* <IoCaretDown /> */}
                            </button>
                        </div>
                    </div>

                    {/* Call Mobiles Card */}
                    <div className="p-6 border rounded-lg bg-white shadow-sm">
                        <div className="flex flex-col items-center text-center">
                            <div className="mb-4">
                                {/* <BsTelephone className="text-6xl text-gray-700" /> */}
                                <img src={require('../img/2nd.png')} alt="Profile" className="" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Call mobiles and landlines</h3>
                            <p className="text-gray-400 mb-6 font-semibold">
                                Skype to Skype calls are always free, but you can also call mobiles and landlines from Skype at great low rates.
                            </p>
                            <button className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700">
                                Open dial pad
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="mt-12 text-center text-gray-600">
                    <p className="mb-2">
                        You are signed in as kalathiyainfoarchit@gmail.com
                    </p>
                    <p className="text-sm">
                        Try{" "}
                        <a href="#" className="text-blue-600 hover:underline">
                            switching accounts
                        </a>{" "}
                        if you cannot see your contacts or conversation history.
                    </p>
                    <a href="#" className="text-blue-600 hover:underline text-sm block mt-2">
                        Learn more
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Front;