import './App.css';
import Dashboard from './components/Dashboard/Dashboard';
import Navbar from './components/Navbar/Navbar';
import Sidebar from './components/Sidebar/Sidebar';
import resume_img from './Assets/resume-top.png';
import interviewAI_img from './Assets/InterviewAi-top_img.png';
import autoApply_img from './Assets/autoApply-img.png';

import {
  BrowserRouter as Router,
  Route,
  Routes
} from "react-router-dom";
import { useState } from 'react';
import Interview from './components/Interview';
import Warmup from './components/Warmup';

function App() {


  const [isShow,setIsShow] = useState(false);

  const [appStyle,setAppStyle] = useState({
    display:"flex",
    flexDirection:"column",
    height:"100vh",
    backgroundColor:"#F7F7F7",
  })

  return (
    <Router>
      <div className="App" style={appStyle}>
      <Navbar setIsShow={setIsShow}/>
      <div className='main'>
      <Sidebar className="sidebar" isShow = {isShow} setIsShow={setIsShow}/>
      <Routes>
      <Route exact path="/"  element={<Dashboard heading="Resume Builder" caption="Welcome Prasanth! 👋" resumeBuilderShow="true" topImage={resume_img} setAppStyle = {setAppStyle} isShow = {isShow}/>}/>
      <Route exact path="/autoApply"  element={<Dashboard heading="Auto Apply" caption="Auto-apply to every job effortlessly." AutoApplyShow="true" topImage={autoApply_img} isShow = {isShow}/>}/>
      <Route exact path="/jobTracking"  element={<Dashboard heading="Job Tracking" caption="Auto-apply to every job effortlessly." AutoApplyShow="true" isShow = {isShow}/>} />
      <Route exact path="/interviewAi"  element={<Dashboard heading="Interview ai" caption="Ace Interviews with AI & Land Your Dream Job" topImage={interviewAI_img } interviewAIUpdatedShow="true" isShow = {isShow}/>} />
      <Route exact path="/interviewAi_updated"  element={<Dashboard heading="Interview ai" caption="Ace Interviews with AI & Land Your Dream Job" topImage={interviewAI_img } interviewAIShow="true" homePageUpdated="true" isShow = {isShow}/>} />
      <Route exact path="/networking"  element={<Dashboard heading="Networking" caption="Auto-apply to every job effortlessly." AutoApplyShow="true"/>} isShow = {isShow} />
      <Route exact path="/homePage"  element={<Dashboard heading="My Resumes" caption="Manage your resumes for different job applications" topImage={resume_img} homePage="true" isShow = {isShow}/>} />
      <Route exact path="/interview"  element={<Interview/>} />
      <Route exact path="/warmup" element={<Warmup/>} />
      </Routes>
      
      </div>
      
    </div>
    </Router>
    
  );
}

export default App;
