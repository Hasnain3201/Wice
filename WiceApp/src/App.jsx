import { useState } from 'react'
import React from "react";
import Wice_logo from assets/Wice_logo.jpg
import './App.css'

function App() {
  return (
    <>
    <img className="wice_logo" alt="Wicelogo" src={wicelogo1} />
    <text className= "welcome">Welcome to Wice!</text>
    <text className="slogan_bold"></text>
    <text className="slogan_normal"></text>
    <button className= "login_buttons">Client Login</button>
    <button className= "login_buttons">Employee Login</button>
    <button className= "learn_more_button">Learn More</button>
    <Text>New to Wice? <bold>Sign Up Now</bold></Text>
    </>
  )
}

export default App
