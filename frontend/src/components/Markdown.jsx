import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { FiCheck, FiCopy } from "react-icons/fi";
import { copyText } from "../services/format";
import "highlight.js/styles/github-dark.css";

// Collect plain text from a hast node (the code inside a highlighted <pre>).
function nodeText(node) {
  if (!node) return "";
  if (node.type === "text") return node.value;
  return (node.children || []).map(nodeText).join("");
}

function CodeBlock({ node, children }) {
  const [copied, setCopied] = useState(false);
  const codeNode = node?.children?.[0];
  const classes = codeNode?.properties?.className || [];
  const lang = (classes.find((c) => String(c).startsWith("language-")) || "").replace("language-", "");

  const onCopy = async () => {
    if (await copyText(nodeText(codeNode).replace(/\n$/, ""))) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <div className="code-block">
      <div className="code-head">
        <span>{lang || "code"}</span>
        <button type="button" onClick={onCopy} aria-label="Copy code">
          {copied ? <FiCheck /> : <FiCopy />} {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre>{children}</pre>
    </div>
  );
}

const components = {
  pre: CodeBlock,
  table: ({ children }) => (
    <div className="table-wrap">
      <table>{children}</table>
    </div>
  ),
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noreferrer noopener">
      {children}
    </a>
  ),
};

export default function Markdown({ children }) {
  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { detect: true, ignoreMissing: true }]]}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
