function getAIResponse(prompt, personality, userName){
  let prefix = '';
  if(personality === 'Teacher') prefix = `Teacher ${userName}: `;
  if(personality === 'Hustler') prefix = `Boss ${userName} let's get it: `;
  if(personality === 'Funny') prefix = `Yo ${userName} 😂 `;

  const lower = prompt.toLowerCase();
  if(lower.includes('cv') || lower.includes('resume')) return `${prefix}Send me your details and I'll build you a pro CV 💼`;
  if(lower.includes('job') || lower.includes('work')) return `${prefix}I got you ${userName}. What's your field and experience?`;
  if(lower.includes('interview')) return `${prefix}Let's prep for that interview ${userName}! What role are you targeting?`;
  if(lower.includes('help')) return `${prefix}I'm here to help you land your dream job 💜 What do you need?`;

  return `${prefix}About "${prompt}" - here's the breakdown:`;
}
