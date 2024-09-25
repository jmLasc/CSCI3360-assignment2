import React, { useState, useEffect, useRef  } from "react";

function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([ ]);

  function sendMessage() {
    if (message === "") {
      return;
    }

    // Add message to chat log
    setMessages((prevMessages) => [...prevMessages, { sender: "You", text: message }]);
    setMessage("");

    // Response
    setTimeout(() => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: "System", text: "I am a simple bot. I don't have any real responses yet!" },
      ]);
    }, 1000);
  }

  function handleMessage(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  }

  // Ref to the chat log container
  const chatLogRef = useRef(null);

  // Scroll to the bottom of the chat log
  const scrollToBottom = () => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  };

  // Scroll down whenever a new message is added
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Site
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="px-0 py-0 max-w-5xl w-full">
        {/* Header */}
        <h1 className="text-5xl font-bold mb-4 text-left">Data Visualization Assistant</h1>

        {/* CSV */}
        

        {/* Chatlog */}
        <div ref={chatLogRef} className="h-80 overflow-y-auto border px-4 py-8 rounded-lg border-black shadow-lg">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`chat ${msg.sender === "You" ? "chat-end" : "chat-start"}`}
            >

              <div className="chat-image avatar">
                <div className="w-10 flex items-center justify-center text-3xl">
                  {msg.sender === "System" ? (
                    <span role="img" aria-label="robot emoji">
                      🤖
                    </span>
                  ) : (
                    <span role="img" aria-label="human emoji">
                      🧑
                    </span>
                  )}
                </div>
              </div>

              <div className="chat-header">{msg.sender}</div>
              <div className="chat-bubble">{msg.text}</div>
            </div>
          ))}
        </div>

        {/* Input Box */}
        <div className="mt-5 flex gap-2">
          <input
            type="text"
            placeholder="Type your message here"
            value={message}
            className="input input-bordered w-full"
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleMessage}
          />
          <button className="btn" onClick={sendMessage}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;