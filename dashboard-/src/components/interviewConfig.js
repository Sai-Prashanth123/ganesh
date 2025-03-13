// Interview AI Configuration
export const DEFAULT_ENDPOINT = process.env.REACT_APP_INTERVIEW_ENDPOINT || 'https://api.openai.com/v1/chat/completions';
export const DEFAULT_API_KEY = process.env.REACT_APP_INTERVIEW_API_KEY || '';
export const DEFAULT_DEPLOYMENT = process.env.REACT_APP_INTERVIEW_DEPLOYMENT || 'gpt-4';

// Interview settings
export const INTERVIEW_DURATION = 30; // Duration in seconds
export const MAX_QUESTIONS = 5;
export const DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Hard'];

// Technical interview domains
export const INTERVIEW_DOMAINS = [
  'Web Development',
  'Data Science',
  'Machine Learning',
  'DevOps',
  'Cloud Computing',
  'Mobile Development',
  'Cybersecurity'
]; 