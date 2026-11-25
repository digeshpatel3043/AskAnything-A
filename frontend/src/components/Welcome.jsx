import { FiBookOpen, FiMail, FiBriefcase, FiTrendingUp, FiCode, FiTarget } from "react-icons/fi";

export const SUGGESTIONS = [
  { icon: FiBookOpen, title: "Explain a difficult topic", prompt: "Explain a difficult topic in simple terms: how does the internet work? Use an analogy and a short summary." },
  { icon: FiMail, title: "Write a professional email", prompt: "Write a professional email asking my manager for feedback on my recent project. Include a subject line." },
  { icon: FiBriefcase, title: "Help me prepare for an interview", prompt: "Help me prepare for a job interview. Ask me common interview questions one at a time and give feedback on my answers." },
  { icon: FiTrendingUp, title: "Generate business ideas", prompt: "Generate 5 low-budget business ideas I can start as a student, with target customers and first steps." },
  { icon: FiCode, title: "Write Python code", prompt: "Write a Python function that checks whether a string is a palindrome, with comments and a few test cases." },
  { icon: FiTarget, title: "Create a marketing strategy", prompt: "Create a simple marketing strategy for a new local coffee shop, covering social media, offers and partnerships." },
];

export default function Welcome({ onPick, name }) {
  return (
    <div className="welcome">
      <div className="welcome-logo" aria-hidden="true">
        <span>A</span>
      </div>
      <h1>Hello{name && name !== "Guest" ? `, ${name}` : ""}! Welcome to AskAnything AI.</h1>
      <p>Your personal AI assistant. Ask anything, learn anything, create anything.</p>
      <div className="cards">
        {SUGGESTIONS.map(({ icon: Icon, title, prompt }) => (
          <button key={title} type="button" className="card" onClick={() => onPick(prompt)}>
            <Icon aria-hidden="true" />
            <span>{title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
