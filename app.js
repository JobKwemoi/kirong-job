// ==========================
// KIRONG AI v2
// ==========================

const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const themeBtn = document.getElementById("themeBtn");
const thinking = document.getElementById("thinking");

let chatHistory = [];

// ==========================
// ADD MESSAGE
// ==========================

function addMessage(text, sender){

const message = document.createElement("div");

message.className = `message ${sender}`;

message.innerHTML = `<p>${text}</p>`;

chatBox.appendChild(message);

chatBox.scrollTop = chatBox.scrollHeight;

}

// ==========================
// THINKING
// ==========================

function showThinking(){

thinking.classList.remove("hidden");

}

function hideThinking(){

thinking.classList.add("hidden");

}

// ==========================
// SEND MESSAGE
// ==========================

async function sendMessage(){

const text = userInput.value.trim();

if(!text) return;

  if(isImagePrompt(text)){

hideThinking();

generateImage(text);

return;

}

addMessage(text,"user");

userInput.value="";

showThinking();

try{

const response = await fetch("/api/chat",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

message:text,

history:chatHistory

})

});

const data = await response.json();

hideThinking();

addMessage(data.text,"ai");

chatHistory.push({

role:"user",

content:text

});

chatHistory.push({

role:"assistant",

content:data.text

});

}catch(error){

hideThinking();

addMessage("⚠️ Something went wrong.","ai");

console.error(error);

}

}

// ==========================
// IMAGE GENERATOR
// ==========================

function generateImage(prompt){

const imageUrl =
`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt + ", ultra detailed, 4k, realistic")}`;

addMessage(

`
<p><strong>🎨 Image Generated</strong></p>

<img
src="${imageUrl}"
alt="Generated Image"
style="
margin-top:12px;
max-width:100%;
border-radius:15px;
">

<br><br>

<a
href="${imageUrl}"
target="_blank">

<button>

📥 Download Image

</button>

</a>

`

,"ai");

}

// ==========================
// DETECT IMAGE REQUEST
// ==========================

function isImagePrompt(text){

const prompt=text.toLowerCase();

return(

prompt.startsWith("image")||

prompt.startsWith("draw")||

prompt.startsWith("create image")||

prompt.startsWith("generate image")||

prompt.startsWith("paint")||

prompt.startsWith("illustrate")

);

}

// ==========================
// EVENTS
// ==========================

// Send button
sendBtn.addEventListener("click", sendMessage);

// Enter key
userInput.addEventListener("keydown",(e)=>{

if(e.key==="Enter"){

sendMessage();

}

});

// ==========================
// THEME
// ==========================

if(localStorage.getItem("theme")==="dark"){

document.body.classList.add("dark");

themeBtn.textContent="☀️";

}

themeBtn.addEventListener("click",()=>{

document.body.classList.toggle("dark");

const dark=document.body.classList.contains("dark");

themeBtn.textContent=dark?"☀️":"🌙";

localStorage.setItem("theme",dark?"dark":"light");

});

// ==========================
// QUICK BUTTONS
// ==========================

document.querySelectorAll(".quickBtn").forEach(btn=>{

btn.onclick=()=>{

userInput.value=btn.dataset.action+" ";

userInput.focus();

};

});

// ==========================
// CLEAR CHAT
// ==========================

document.getElementById("clearBtn").onclick=()=>{

chatBox.innerHTML=`
<div class="message ai">
<p>Hello 👋<br>I am Kirong AI.</p>
</div>
`;

chatHistory=[];

};

// ==========================
// EXPORT CHAT
// ==========================

document.getElementById("exportBtn").onclick=()=>{

const text=[...document.querySelectorAll(".message")]

.map(x=>x.innerText)

.join("\n\n");

const blob=new Blob([text],{

type:"text/plain"

});

const a=document.createElement("a");

a.href=URL.createObjectURL(blob);

a.download="KirongAI_Chat.txt";

a.click();

};

// ==========================
// LOCATION
// ==========================

document.getElementById("locationBtn").onclick=()=>{

if(!navigator.geolocation){

addMessage("Location not supported.","ai");

return;

}

navigator.geolocation.getCurrentPosition(pos=>{

addMessage(

`📍 Latitude: ${pos.coords.latitude.toFixed(4)}<br>
Longitude: ${pos.coords.longitude.toFixed(4)}`,

"ai"

);

});

};

// ==========================
// FILE UPLOAD
// ==========================

const fileInput=document.getElementById("fileInput");

document.getElementById("uploadBtn").onclick=()=>{

fileInput.click();

};

fileInput.onchange=()=>{

if(fileInput.files.length){

addMessage(

`📎 ${fileInput.files[0].name}`,

"user"

);

}

};
