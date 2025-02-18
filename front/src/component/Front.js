import React from 'react';
import { IMG_URL } from "../utils/baseUrl";

const Front = ({ data }) => {
    return (
        <div className=" bg-white p-8">
            {/* Header Section */}
            <div className="max-w-4xl mx-auto justify-items-center">
                <div className="flex items-center gap-4 mb-12 justify-items-center">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-gray-300 overflow-hidden mt-4 border border-gray-500">
                            {data?.photo && data?.photo != "null" ? (
                                <>
                                    <img src={`${IMG_URL}${data?.photo.replace(
                                        /\\/g,
                                        "/"
                                    )}`} alt="Profile" className="object-cover w-full h-full" />
                                </>
                            ) : (
                                <div className="w-full h-full text-white text-3xl font-bold capitalize grid place-content-center">{data?.userName && data?.userName.includes(' ') ? data?.userName.split(' ')[0][0] + data?.userName.split(' ')[1][0] : data?.userName[0]}</div>
                            )}
                        </div>
                    </div>
                    <div className="flex-1">
                        <h1 className="text-2xl text-gray-800">Welcome!</h1>
                        <p className="text-gray-800 text-2xl font-semibold">{data?.userName}</p>
                    </div>
                </div>

                <h2 className="text-lg text-gray-700 mb-8 text-center">Here are some quick actions to get you started</h2>

                <div className="grid md:grid-cols-1 gap-6 justify-items-center">
                    <div className="p-6 border rounded-lg bg-white shadow-sm">
                        <div className="flex flex-col items-center text-center">
                            <div className="mb-4">

                                <img src={require('../img/1st.png')} alt="Profile" className="" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Easy Chating with anyone</h3>
                            {/* <button className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 flex items-center gap-2">
                                Chat Now
                            </button> */}
                            <p className="text-gray-400 mb-6 font-semibold">
                                Select anyone and start chatting with them.
                            </p>
                        </div>
                    </div>


                </div>

                <div className="mt-12 text-center text-gray-600">
                    <p className="mb-2">
                        You are signed in as <b>{data?.email}</b>
                    </p>

                </div>
            </div>
            {/* <div className=" bg-white p-8 flex items-center justify-center">
                <div className="max-w-4xl mx-auto flex flex-col items-center justify-center">
                    <div className="flex items-center gap-4 mb-12">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-gray-300 overflow-hidden mt-4">
                                <img src={require('../img/profile.jpg')} alt="Profile" className="" />
                            </div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>
                    </div>
                    <div className="flex-1 text-center">
                        <h1 className="text-2xl text-gray-800">Welcome!</h1>
                        <p className="text-gray-800 text-2xl font-semibold">Archit Bhuva</p>
                    </div>
                </div>
            </div> */}
        </div>
    );
};

export default Front;