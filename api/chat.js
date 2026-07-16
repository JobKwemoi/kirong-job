function getAIResponse(prompt, personality, userName){
  let prefix = '';
  if(personality === 'Teacher') prefix = `Teacher ${userName}: `;
  if(personality === 'Hustler') prefix = `Boss ${userName} let's get it: `;
  if(personality === 'Funny') prefix = `Yo ${userName} 😂 `;

  const lower = prompt.toLowerCase();
  if(lower.includes('cv') || lower.includes('resume')) return `${prefix}Send me your details and I'll build you a pro CV 💼`;
  if(lower.includes('job') || lower.includes('work')) return `${prefix}I got you ${userName}. What's your field and experience?`;
  if(lower.includes('interview')) return `${prefix}Let's prep for that interview ${userName}! What role are you targeting?`;
  if(lower.includes('code')) return `${prefix}Sure! What language and what do you want to build?`;
  if(lower.includes('email')) return `${prefix}Got it. Who is the email for and what's it about?`;
  if(lower.includes('contact')) return `${prefix}You can reach Kirong Job Kwemoi at: 0792442670 | 0736232188 | Facebook: Job White`;
  if(lower.includes('help')) return `${prefix}I'm Kirong AI. I'm here to help you 💜 What do you need?`;

  return `${prefix}About "${prompt}" - here's the breakdown:`;
}
