import React, { useState, useEffect, useRef  } from "react";
import { csvParse } from 'd3-dsv';

function App() {
  // Message Handling
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

  // CSV Handling
  const fileInputRef = useRef(null);
  const [data, setData] = useState(null)
  const [csvMessage, setCsvMessage] = useState('Click / drag & drop to upload a CSV file!');
  
  const processFiles = (files) => {
    const file = files[0];
    if (file.type !== 'text/csv') {
      console.log(file)
      setCsvMessage('Error: Please upload a valid CSV file.');
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      const csvText = e.target.result;

      // Parse the CSV text using d3-dsv
      try {
        const parsedData = csvParse(csvText); // Using d3-dsv's csvParse
        setData(parsedData);
        setCsvMessage(`CSV uploaded successfully! Filename: ${file.name}`);
      } catch (error) {
        setCsvMessage('Error parsing CSV file. Please ensure it is valid.');
        console.error('CSV Parsing Error:', error);
      }
    };

    reader.readAsText(file);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    processFiles(files);
  };

  const handleClick = () => {
    fileInputRef.current.click();
  };
  
  const handleFileChange = (event) => {
    const files = event.target.files;
    processFiles(files);
  };

  const renderCsvPreview = () => {
    if (!data || data.length === 0) return null;

    return (
      <div className="mt-10 max-w-5xl mx-auto my-10">
        <h2 className="text-xl font-bold mb-2">CSV Preview</h2>
        <div className="overflow-auto h-60 border border-gray-300 rounded-lg shadow-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                {Object.keys(data[0]).map((key) => (
                  <th key={key} className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((row, index) => (
                <tr key={index}>
                  {Object.values(row).map((value, idx) => (
                    <td key={idx} className="px-4 py-2 text-sm text-gray-700">
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  

  // Site
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="px-0 py-0 max-w-5xl w-full">
        {/* Header */}
        <h1 className="text-5xl font-bold mb-4 text-left">Data Visualization Assistant</h1>

        {/* CSV Upload Zone */}
        <div 
          className="flex items-center justify-center h-40 border-2 border-dotted border-black p-4 rounded my-10 transition-all duration-20 hover:bg-yellow-300 hover:border-yellow-500"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={handleClick}
        >
          <h3 className="font-medium italic">{csvMessage}</h3>
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          >
          
          </input>
        </div>

        {/* CSV Preview */}
        {renderCsvPreview()}

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