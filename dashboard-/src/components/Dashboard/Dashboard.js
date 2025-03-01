import React, { useEffect, useState} from 'react'
import './Dashboard.css'
import illustration from './dashboard-img/illustrator.png'
import interview_illustration from './dashboard-img/interview-illustration.png'
import helpme_img from './dashboard-img/help me.png'
import comingSoon_img from './dashboard-img/commingSoon-img.png'
import notification_img from './dashboard-img/notification-img.png'
import cancel_img from './dashboard-img/cancel_img.png'
import upload_img from './dashboard-img/upload_img.png'
import scratchFile_img from './dashboard-img/scratchFile_img.png'
import back_img from './dashboard-img/back_img.png'
import uploadResume_img from './dashboard-img/uploadResume_img.png'
import rightTick_img from './dashboard-img/rightTick_img.png'
import card1_img from './dashboard-img/card1_img.png'
import share_img from './dashboard-img/share_img.png'
import cancelfeed_img from './dashboard-img/cancelfeed_img.png'
import feed_img from './dashboard-img/feedback_img.png'
import ratingStar_img from './dashboard-img/ratingStar_img.png'
import generalInterview_img from './dashboard-img/general-InterviewAI.png'
import specificInterview_img from './dashboard-img/specific-InterviewAI.png'
import dropdown_img from './dashboard-img/dropdown_img.png'
import { Link } from 'react-router-dom'
import Interview from '../Interview'
import { useNavigate } from "react-router-dom";

const Dashboard = (props) => {
  console.log("Props received:", props);


  const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const handleSubmit = async (e) => {
      e.preventDefault();
      setResult('Processing...');
      setError(null);
  
      const formData = new FormData(e.target);
  
      // 🔍 Debug: Log FormData content
      console.log("FormData content:");
      for (let [key, value] of formData.entries()) {
          console.log(`${key}:`, value);
      }
  
      // Check if required fields are missing
      const fileInput = document.getElementById("file");
      const file = fileInput.files[0];
      const jobTitle = formData.get("title");
      const description = formData.get("description");
  
      if (!file || !jobTitle || !description) {
          setError("Missing required fields");
          return;
      }
  
      formData.append("file", file); // Ensure file is correctly attached
  
      try {
          const response = await fetch("http://localhost:8000/process-all/", {
              method: "POST",
              body: formData, 
          });
  
          if (!response.ok) {
              const errorData = await response.json().catch(() => null);
              throw new Error(`HTTP error! Status: ${response.status}, Details: ${JSON.stringify(errorData) || "No details"}`);
          }
  
          const data = await response.json();
          setResult(data);
          console.log("Success:", data);
      } catch (error) {
          setError(error.message);
          console.error("Error:", error);
      }
  };


  {/*Navigation to Interview Page*/}
  const navigate = useNavigate();
const goToInterview = ()=> {
  //handleSubmit();   //specific details form data
  navigate('/warmup');
}

const [filename, setFilename] = useState("Uplode File");

{/*Selected Resumes - Resume Builder*/}
const [selectedFile, setSelectedFile] = useState(null);
const handleFileChange = (event) => {
  setSelectedFile(event.target.files[0]);
  setFilename(event.target.files[0].name);
  console.log("Selected file:", event.target.files[0]);
};

{/*save Details for specific company Interview - Interview AI*/}
const [specficCompanyResume,setSpecficCompanyResume ] = useState(null);
const holdFile = (event) => {
  setSpecficCompanyResume(event.target.files[0]);
  console.log("Selected file:", event.target.files[0]);
  setIFilename(event.target.files[0].name);
};



{/*User details for specific company interview - Interview AI*/}
const [Ifilename, setIFilename] = useState("Uplode File");
const [name,setName ] = useState(null);
const [role,setRole ] = useState(null);
const [company,setCompany ] = useState(null);
const [description,setDescription ] = useState(null);
console.log('Name:',name)
console.log('role',role)
console.log('company',company)
console.log('description',description)
console.log('Resume',specficCompanyResume)



/* function call at navigation to interview
const handleSubmit = async () => {
  
  const formData = new FormData();
  formData.append("role", role);
  formData.append("company", company);
  formData.append("description", description);
  if (specficCompanyResume) formData.append("specficCompanyResume", specficCompanyResume);
  const response = await fetch("http://localhost:8000/submit-interview/", {
      method: "POST",
      body: formData,
  });

  const data = await response.json();
  console.log(data);
};
*/



const [mode,setMode ] = useState(null);
const [experience,setExperience ] = useState(null);
const [category,setCategory ] = useState(null);
const [duriation,setDuriation ] = useState(null);

console.log('Mode:',mode)
console.log('experience',experience)
console.log('Category',category)
console.log('Duriation',duriation)


{/*card1 styles and function Started here*/}
  const [cardStyle,setCardStyle] = useState({
    display:"none",
    backgroundColor:"#FAFBFE",
    position:"absolute",
    transition:"0.5s ease in",
    zIndex: 1,
  })

  

  const openCard1 = () => {
    setCardStyle(prevState => ({
      ...prevState,            
      display: "block"       
    }));
      document.getElementById("overlay").style.display = "block";
  }

{/*Overlay when clicked on any option*/}
  const overLay = {
    display: "none", 
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100vh",
    backgroundColor: "rgba(0, 0, 0, 0.80)", // Dark overlay effect
    zIndex: 1,
    backdropFilter:"blur(0.5px)"
  };

  const closeCard1 = () => {
    setCardStyle(prevState => ({
      ...prevState,            
      display: "none"       
    }));
      document.getElementById("overlay").style.display = "none";
  }
  {/*card1 styles and function Ended here*/}


  {/*card2 (taking info from user) styles and function Started here*/}
  const [card2Style,setCard2Style] = useState({
    display:"none",
    backgroundColor:"#FAFBFE",
    position:"absolute",
    backgroundColor:"#FAFBFE",
    transition:"0.5s ease in",
    zIndex: 1,
  })

  const opencard2 = () => {
    closeCard1();
    setCard2Style(prevState => ({
      ...prevState,
      display:"block"
    }))
    document.getElementById("overlay").style.display = "block";
  }

  const closeCard2 = () => {
    setCard2Style(prevState => ({
      ...prevState,
      display:"none"
    }))
  }

  const goBack = () => {
    closeCard2();
    setCardStyle(prevState => ({
      ...prevState,            
      display: "block"       
    }));
      document.getElementById("overlay").style.display = "block";
  }



 {/*card3 (Taking mobile number from user) styles and function Started here*/}
  const [askNumber,setAskNumber] = useState({
    display:"none",
    backgroundColor:"#FAFBFE",
    position:"absolute",
    backgroundColor:"#FAFBFE",
    transition:"0.5s ease in",
    zIndex: 1,
  })

  const openCard3 = () => {
    setCard2Style(prevState => ({
      ...prevState,            
      display: "none"       
    }));
    document.getElementById("overlay").style.display = "none";
    setAskNumber(prevState => ({
      ...prevState,            
      display: "block"       
    }));
    document.getElementById("overlay").style.display = "block";
  }

  const closecard3 = () => {
    setAskNumber(prevState => ({
      ...prevState,            
      display: "none"       
    }));
    setCard2Style(prevState => ({
      ...prevState,
      display:"block"
    }))
    document.getElementById("overlay").style.display = "block";
  }

  const [nameMobile, setNameMobile] = useState("");
const [mobile, setMobile] = useState("");

const handleMobileSubmit = async (event) => {
  event.preventDefault();

  const payload = {
    name: nameMobile, // Match the backend's expected field name
    mobile: mobile,   // Keep this as is
  };

  try {
    const response = await fetch("http://localhost:8009/update_user/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload), // Convert payload to JSON string
    });

    const data = await response.json();

    if (response.ok) {
      // Reset the form fields
      setNameMobile(""); // Clear the name field
      setMobile("");     // Clear the mobile field

      // Open the homepage or perform other actions
      navigate('/homePage');
      setAskNumber(prevState => ({
        ...prevState,            
        display: "none"       
      }));
      document.getElementById("overlay").style.display = "none";
    } else {
      alert(data.detail || "An error occurred");
    }
  } catch (error) {
    alert("Failed to submit data. Please check your connection.");
    console.error("Error:", error);
  }
};
   

  const openHomepage = ()=> {
    setAskNumber(prevState => ({
      ...prevState,            
      display: "none"       
    }));
    document.getElementById("overlay").style.display = "none";
  }

  const [feedStyle,setfeedStyle] = useState({
    display:"none",
    backgroundColor:"#FAFBFE",
    position:"absolute",
    backgroundColor:"#FAFBFE",
    transition:"0.5s ease in",
    zIndex: 1,
  })
  



const [isfeedback,setIsfeedback] = useState(false);
  const openFeedback = ()=> {
   setIsfeedback(prev=> !prev)
    setfeedStyle(prevState=> ({
      ...prevState,
         display: prevState.display == 'block'?'none':'block',
    }))
    if(isfeedback === false) {
      document.getElementById("overlay").style.display = "block";
      
    }
    else {
      document.getElementById("overlay").style.display = "none";
      
    }
  }

{/*Interview Coach (Options)*/}

  const [intervieOptionsStyle,setInterviewOptionsStyle] = useState({
    display:"none",
    backgroundColor:"#FAFBFE",
    position:"absolute",
    transition:"0.5s ease in",
    zIndex: 1,
  })

  const openinterviewAiOptions = ()=> {
    setInterviewOptionsStyle(prevState=> ({
      ...prevState,
      display:"block",
    }))
    document.getElementById("overlay").style.display = "block";
  }

  const closeInterviewAIOptions = () => {
    setInterviewOptionsStyle(prevState=> ({
      ...prevState,
      display:"none",
    }))
    document.getElementById("overlay").style.display = "none";
  }

   const [specificDetailsStyle,setSpecificDetailsStyle] = useState({
    display:"none",
    backgroundColor:"#FAFBFE",
    position:"absolute",
    transition:"0.5s ease in",
    zIndex: 1,
   })

   const openSpecificDetails = () => {
    closeInterviewAIOptions();
    setSpecificDetailsStyle(prevState=> ({
      ...prevState,
      display:"block",
    }))
    document.getElementById("overlay").style.display = "block";
   }
  
   const closeInterviewAIDetails = () => {
    setSpecificDetailsStyle(prevState=> ({
      ...prevState,
      display:'none'
    }))
    openinterviewAiOptions();
   }

   const [moreDetailsStyle,setMoreDetailsStyle] = useState({
    display:"none",
    backgroundColor:"#FAFBFE",
    position:"absolute",
    transition:"0.5s ease in",
    zIndex: 1,
   })

const openMoreDetails = async () => {
  /*const formData = new FormData();
  formData.append("role", role);
  formData.append("company", company);
  formData.append("description", description);
  if (specficCompanyResume) formData.append("specficCompanyResume", specficCompanyResume);
  const response = await fetch("http://localhost:8000/submit-interview/", {
      method: "POST",
      body: formData,
  });

  const data = await response.json();
  console.log(data);*/
  setSpecificDetailsStyle(prevState=> ({
    ...prevState,
    display:'none'
  }))
  setMoreDetailsStyle(prevState=> ({
    ...prevState,
    display:'block',
  }))
  document.getElementById("overlay").style.display = "block";
}

  const [active1, setActive1] = useState('');
  const handleClick1 = (name) => {
    setActive1(name);
    setMode(name)
  };

  const [active2, setActive2] = useState('');
  const handleClick2 = (name) => {
    setActive2(name);
    setExperience(name)
  };

  const [active3, setActive3] = useState('');
  const handleClick3 = (name) => {
    setActive3(name);
    setCategory(name)
  };

  const [active4, setActive4] = useState('');
  const handleClick4 = (name) => {
    setActive4(name);
    setDuriation(name)
  };

  const closeMoreDetails = () => {
    openSpecificDetails();
    setMoreDetailsStyle(prevState=> ({
      ...prevState,
      display:'none',
    }))
    document.getElementById("overlay").style.display = "block";
  }

  const [response, setResponse] = useState(null);
  const [errors, setErrors] = useState(null);

  const handleInterviewSubmit = async (event) => {
      event.preventDefault();
      const formData = new FormData(event.target);

      try {
          const response = await fetch("http://127.0.0.1:8000/submit-interview/", {
              method: "POST",
              body: formData
          });

          const result = await response.json();
          setResponse(result);
          setError(null);
      } catch (error) {
          setError(error.message);
          setResponse(null);
      }
  };
   



return (
    <div className='dashboard'>
      <div className='greet'>
        <img src={props.topImage}/>
        <div>
        <h2>{props.heading}</h2>
        <p>{props.caption}</p>
        </div>
      </div>

      {props.resumeBuilderShow && <div className='content'>
        <img src={illustration}/>
        <p>Create a professional, standout resume tailored to <br/> your dream job with Job Spring!</p>
        <button onClick={openCard1}><a>Create New resume</a></button>
      </div>}
      <div id='overlay' style={overLay}>

        {/* Options Card*/}
      <div className='options' style={cardStyle}>
        <div className='header'>
          <h3>Create New Resume</h3>
          <img  className='close-btn' onClick={closeCard1} src={cancel_img}/>
        </div>
        <div className='cardContent'>
          <h3>How do you want to get started?</h3>
          <div className='twoOptions'>
            <div className='option' onClick={opencard2}>
              <img src={upload_img}/>
              <h3>Select a resume</h3>
              <p>Select from the existing library or upload a new file</p>
            </div>
            <div className=' disabledstate'>
              <img src={scratchFile_img}/>
              <h3>Start From Scratch</h3>
              <p>Build your resume using our resume builder</p>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Create New Resume Card*/}
        <div className='createNewResume' style={card2Style}>
         <div className='header2'>
         <img onClick={goBack} src={back_img}/>
         <h3>Create New Resume</h3>
         </div>
         
         <form onSubmit={handleSubmit} id="resumeForm" encType="multipart/form-data">
    <div className="fileSelect">
      <div className='fileDetails'>
        <p>Select file</p>
        <label className="upload-btn">
        {filename} <img src={uploadResume_img} alt="Upload" />
            <input
            className='fileInput' 
                type="file" 
                style={{ display: "none" }} 
                onChange={handleFileChange} 
                id="file" 
                name="file"  // ✅ Ensure name="file" matches backend
                accept=".pdf,.docx" 
                required 
            />
        </label>
        </div>
       
    </div>
    <div className="inputs">
        <label htmlFor='title'>Job title</label>
        <input id="title" name="title" type="text" placeholder="title" required />
        <label htmlFor='description'>Description</label>
        <textarea id="description" name="description" placeholder="description" required />
        <button className="submitBtn" type="submit" onClick={openCard3}>Optimize Resume</button>
    </div>
</form>

        </div>


        {/* Taking moblile number from user Card*/}
      <div className='askMblNumber' style={askNumber}>
        <div className='header3'>
          <img onClick={closecard3} className='close-btn' src={cancel_img} alt=''/>
        </div>
        <div className='detail-form'>
          <div>
          <h3>provide Your Phone Number</h3>
          <p>Enter your phone number to create and download your resume for free</p>
          </div>
          <form onSubmit={handleMobileSubmit} id="userForm">
    <label htmlFor="nameMobile">Enter Your Name</label>
    <input
      type="text"
      name="nameMobile"
      id="nameMobile"
      required
      placeholder="Enter Name"
      onChange={(e) => setNameMobile(e.target.value)}
    />

    <label htmlFor="mobile">Enter mobile number</label>
    <input
      type="text"
      required
      placeholder="Enter here"
      id="mobile"
      name="mobile"
      onChange={(e) => setMobile(e.target.value)}
    />

    <p>
      <img src={rightTick_img} alt="Checkmark" /> We’ll use your number to deliver your resume and updates.
    </p>

    <button className="submit-Btn" type="submit">Submit</button>
  </form>
        </div>
      </div>

      {/* feedback portion*/}
      <div className='feedback' style={feedStyle}>
        <div className='feed-header'>
          <div>-
            <button><img className='feed-img' src={feed_img}/></button>
            <h6>Feedback</h6>
          </div>
          <div>
            <img onClick={openFeedback} className='feed-cancel' src={cancel_img}/>
          </div>
        </div>
        <div className='feed-content'>
          <div className='feed-top'>
            <h3>Rate Your Experience</h3>
            <p>Your input is valuable in helping us better understand your needs and tailor our service accordingly.</p>
          </div>
          <div className='feed-mid'>
            <div className='rating-stars'>
              <img src={ratingStar_img }/>
              <img src={ratingStar_img }/>
              <img src={ratingStar_img }/>
              <img src={ratingStar_img }/>
              <img src={ratingStar_img }/>
            </div>
          </div>
          <div className='feed-bottom'>
          <p>Got suggestions? we’d love to hear them!</p>
            <textarea placeholder='Write here'></textarea>
            <button>Submit now</button>
          </div>
        </div>
      </div>

      {/* Home page portion*/}
      {props.homePage && <div className='home-page'>
        <h3>Your Optimized Resumes</h3>
        <div className='container'>
          <div className='Process-card'>
            <div className='card-top'>
              <div>
              <img src={card1_img} />
              <h3>Ux Designer</h3>
              <button>
                <p></p>
                <h6>Processing</h6>
              </button>
              </div>
              <div>
                Created Jan 12, 2025
              </div>
            </div>
            <div className='card-bottom'>
              <img src={share_img}/>
              <button>Download</button>
            </div>
          </div>
     
          <div className='Process-card ready'>
            <div className='card-top'>
              <div>
              <img src={card1_img} />
              <h3>{'Graphic Designer'.slice(0,12)}..</h3>
              <button className='ready-btn'>
                <h6>Ready</h6>
              </button>
              </div>
              <div>
                Created Jan 13, 2025
              </div>
            </div>
            <div className='card-bottom'>
              <img src={share_img}/>
              <button className='ready-download'>Download</button>
            </div>
          </div>

          
        </div>
      </div>}


      
      {props.homePageUpdated && <div className='home-page'>
        <h3>Your Interviews</h3>
        <div className='container'>
     
          <div className='Process-card ready'>
            <div className='card-top'>
              <div>
              <img src={props.topImage} />
              <h3>UX Designer</h3>
              <h6>jan 12,2025</h6>
              </div>
              <div>
                Google
              </div>
            </div>
            <div className='card-bottom'>
              <img src={share_img}/>
              <button className='ready-download'>Download</button>
            </div>
          </div>

          
        </div>
      </div>}


      

{/* InterView Updated AI */}
{props.interviewAIUpdatedShow && 
  <div className='interviewAI-content'>
  <img src={interview_illustration}/>
  <p>Start your journey with AI-driven interviews <br/> and feedback to boost your confidence.</p>
  <button onClick={openinterviewAiOptions}><a>Start Interview </a></button>
</div>

}

{/* InterView AI Options */}
<div className='interview-options' style={intervieOptionsStyle}>
        <div className='header'>
          <h3>Practice with interview ai</h3>
          <img onClick={closeInterviewAIOptions} src={cancel_img}/>
        </div>
        <div className='cardContent'>
          <h3>How do you want to get started?</h3>
          <div className='twoOptions'>
            <div className='option' onClick={openCard1}>
              <img src={generalInterview_img}/>
              <h3>General interview</h3>
              <p>Practice interviews for hands-on experience.</p>
            </div>
            <div className='option' onClick={openSpecificDetails}>
              <img src={specificInterview_img}/>
              <h3>Interview for specific companies</h3>
              <p>Practice for specific companies using details</p>
            </div>
          </div>
        </div>
      </div>


      {/* InterView AI specific Details */}
      <div className='specificInterview' style={specificDetailsStyle}>
        <div className='specDetails-header'>
          <h5>Interview Details</h5>
          <img onClick={closeInterviewAIDetails} src={cancel_img}/>
        </div>
        <form className='specDetailsForm'>
          <div>
          
            <div className='inputs top-input'>
            <label>Enter your name </label>
            <input placeholder='name' type='text' onChange={(event)=> setName(event.target.value)}></input>
            </div>
            <div className='selectFile'>
              <p>Select file</p>
              <label className="upload-btn specDetails" style={{color:'white'}}>
              {Ifilename.slice(0,12)+'..'} <img src={uploadResume_img} />
               <input type="file" style={{ display: "none" }} onChange={holdFile} />
              </label>
            </div>
          </div>
          <label htmlFor='role'>Enter your role </label>
            <select id='role' name='role' placeholder='role' onChange={(event)=> setRole(event.target.value)}>
              <option value='Web Developer'>Web Developer</option>
              <option value='Web Developer'>ML Developer</option>
              <option value='Web Developer'>UX Designer</option>
              <option value='Web Developer'>Data analytics</option>
              <option value='Web Developer'>Cyber Security</option>
            </select>
            
            <label htmlFor='company'>Company name </label>
            <select id='company' name='role' placeholder='company' onChange={(event)=> setCompany(event.target.value)}>
              <option value='Google'>Google</option>
              <option value='Facebook'>Facebook</option>
              <option value='Amazon'>Amazon</option>
              <option value='Nvidia'>Nvidia</option>
              <option value='Microsoft'>Microsoft</option>
            </select>

            <label>Description</label>
            <textarea placeholder='description' onChange={(event)=> setDescription(event.target.value)}></textarea>
            <button type='submit' onClick={openMoreDetails}>Next</button>
        </form>
        
      </div>
      



      {/* More Details */}
      <div className="more-details" style={moreDetailsStyle}>
      <div className="moreDetails-header">
        <img onClick={closeMoreDetails} src={back_img} alt="Back" />
        <p>Interview Details</p>
      </div>
      <div className="details-buttons">
        <div className="buttons-section">
          <p>Select mode</p>
          <div>
            <button onClick={() => handleClick1('Easy')} className={active1 === 'Easy' ? 'active' : ''} onChange={()=> setMode('Easy')} >Easy</button>
            <button onClick={() => handleClick1('Moderate')} className={active1 === 'Moderate' ? 'active' : ''} onChange={()=> setMode('Moderate')}>Moderate</button>
            <button onClick={() => handleClick1('Hard')} className={active1 === 'Hard' ? 'active' : ''}  onChange={()=> setMode('hard')}>Hard</button>
          </div>
        </div>
        <div className="buttons-section">
          <p>Work experience</p>
          <div>
            <button onClick={() => handleClick2('Fresher')} className={active2 === 'Fresher' ? 'active' : ''} onChange={()=> setExperience('Fresher')}>Fresher</button>
            <button onClick={() => handleClick2('Mid-level')} className='disabled'>Mid-level</button>
            <button onClick={() => handleClick2('Senior-level')} className='disabled'>Senior-level</button>
          </div>
        </div>
        <div className="buttons-section">
          <p>Select category</p>
          <div>
            <button onClick={() => handleClick3('Job')} className={active3 === 'Job' ? 'active' : ''} onChange={()=> setCategory('Job')} >Job</button>
            <button onClick={() => handleClick3('Internship')} className={active3 === 'Internship' ? 'active' : ''}  onChange={()=> setCategory('Internship')}>Internship</button>
          </div>
        </div>
        <div className="buttons-section">
          <p>Interview Duration</p>
          <div>
            <button onClick={() => handleClick4('5 mins')} className={active4 === '5 mins' ? 'active' : ''} onChange={()=> setDuriation('5 min')}>3 mins</button>
            <button onClick={() => handleClick4('15 mins')} className={active4 === '15 mins' ? 'active disabled' : 'disabled'}  onChange={()=> setDuriation('15 min')}>15 mins</button>
            <button onClick={() => handleClick4('25 mins')} className={active4 === '25 mins' ? 'active disabled' : 'disabled' } onChange={()=> setDuriation('25 min')}>25 mins</button>
          </div>
        </div>
        <div className="start-button">
          <button onClick={goToInterview}>Start interview</button>
        </div>
      </div>
    </div>






      {/* Coming Soon */}
      {props.AutoApplyShow && 
  <div className='coming-soon'>
    <img src={comingSoon_img} />
    <h3>Coming soon!</h3>
    <p>Auto-apply to every job effortlessly.<br/>
    Stay tuned for this amazing feature.</p>
    <button><img src={notification_img}/>Notify Me</button>
  </div>
}

      <div className='helpMe-btn'>
        <button onClick={openFeedback} className='feedback-btn'><img id='feedback-img' src = {isfeedback?cancelfeed_img:helpme_img}/></button>
      </div>
    </div>
  )

}
export default Dashboard
