import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import dayjs from 'dayjs'

function App() {
  console.log(dayjs().month());
  console.log(dayjs().day());

  return (
    <>
      Hello, this is an application for Responder.
    </>
  )
}

export default App
