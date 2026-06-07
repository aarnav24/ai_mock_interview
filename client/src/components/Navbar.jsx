import React from 'react'
import { motion } from "motion/react"
import { BsRobot, BsCoin } from "react-icons/bs"
import { HiOutlineLogout } from "react-icons/hi"
import { FaUserAstronaut } from "react-icons/fa"
import { useDispatch, useSelector } from 'react-redux'
import { RiRobot3Fill } from "react-icons/ri" 
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { ServerUrl } from '../App'
import { setUserData } from '../redux/userSlice'
import axios from 'axios'
import AuthModel from './AuthModel'

const Navbar = () => {
    const { userData } = useSelector((state)=>state.user)
    const [showCreditPopup, setShowCreditPopup] = useState(false)
    const [showUserPopup, setShowuserPopup] = useState(false)
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const [showAuth, setShowAuth] = useState(false)

    const handleLogout = async () => {
        try {
            await axios.get(ServerUrl + "/api/auth/logout", {withCredentials: true})
            dispatch(setUserData(null))
            setShowCreditPopup(false)
            setShowuserPopup(false)
            navigate("/")
        } catch (error) {
            console.error(error);
        }
    }

  return (
    <div className="bg-[#f3f3f3] flex justify-center px-4 pt-6">
        <motion.div 
        initial={{opacity:0, y:-40}}
        animate={{opacity:1, y:0}}
        transition={{duration: 0.4}}
        className="w-full max-w-6xl bg-white rounded-[24px] shadow-sm border border-gray-200 px-8 py-3 flex justify-between items-center relative">
            <div className="flex items-center gap-3 cursor-pointer">
                <div className="bg-black text-white p-2 rounded-lg">
                    <RiRobot3Fill size={20}/>
                </div>
                <h1 className="font-semibold hidden md:block">Naam</h1>
            </div>

            <div className="flex items-center gap-6 relative">
                <div className="relative">
                    <button 
                    onClick={() => {
                        if(!userData) {
                            setShowAuth(true)
                            return
                        }
                        setShowCreditPopup(!showCreditPopup)
                        setShowuserPopup(false)
                    }}
                    className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full text-md hover:bg-gray-200 transition cursor-pointer">
                        <BsCoin size={22}/>
                        {userData?.credits || 0}
                    </button>

                    {showCreditPopup && (
                        <div className="absolute right-[-50px] mt-4 w-64 bg-white shadow-xl border-gray-200 rounded-lg p-5 z-50">
                            <p className="text-sm text-gray-600 mb-4">Need more credits to continue interviews?</p>
                            <button 
                            onClick={() => navigate("/pricing")}
                            className="w-full bg-black text-white py-2 rounded-lg text-sm cursor-pointer">Buy more credits</button>
                        </div>
                    )}
                </div>

                <div className="relative">
                    <button 
                    onClick={() => {
                        if(!userData) {
                            setShowAuth(true)
                            return
                        }
                        setShowuserPopup(!showUserPopup)
                        setShowCreditPopup(false)
                    }}
                    className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center font-semibold cursor-pointer">
                        {userData ? userData?.name.slice(0,1).toUpperCase() : <FaUserAstronaut size={20} />}
                    </button>
                    
                    {showUserPopup && (
                        <div className="absolute right-0 mt-3 w-48 bg-white shadow-xl border mt-4 border-gray-200 rounded-xl p-4 z-50">
                            <p className="text-md text-blue-500 font-medium mb-1">{userData?.name}</p>
                                <button 
                                onClick={() => navigate("/history")}
                                className="w-full text-left text-sm py-3 hover:text-black text-gray-600 cursor-pointer">Interview History</button>
                                <button 
                                onClick={handleLogout}
                                className="w-full text-left text-sm py-2 flex items-center gap-2 text-red-500 cursor-pointer">
                                    <HiOutlineLogout size={20} /> Logout
                                </button>
                        </div>
                    )}
                </div>

            </div>

        </motion.div>

        {showAuth && <AuthModel onClose={() => setShowAuth(false)} />}
    </div>

  )
}

export default Navbar