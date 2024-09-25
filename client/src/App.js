import React, { useState, useEffect, useRef  } from "react";
import * as d3 from 'd3-dsv';
import { VegaLite } from 'react-vega'
const url = process.env.NODE_ENV === 'production' ? 'https://csci3360-assignment2.onrender.com/' : 'http://127.0.0.1:8000/';

function App() {
  // Message Handling
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([ ]);

  function sendMessage() { 
    if (message === "") {
      return;
    }
  
    // Add user message to chat log
    setMessages((prevMessages) => [...prevMessages, { sender: "You", text: message }]);
    setMessage("");
  
    // No CSV
    if (data === null) {
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: "System", text: "Please insert a CSV file to continue." },
      ]);
      return; 
    }
  
    // Has CSV -> FastAPI
    const sampleData = formattedData.slice(0, 10);
    console.log("Sample data:", sampleData);
    
    fetch(`${url}query`, {
      method: 'POST',
      body: JSON.stringify({ prompt: message, headers: headers, sample: sampleData }),
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response failed.');
      }
      return response.json();
    })
    .then(data => {
      // Check for error 
      const errorMessage = data.response.error;
      const description = data.response.description;
      
      if (errorMessage) {
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: "System", text: errorMessage },
        ]);
        return;
      } else if (description) {
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: "System", text: description },
        ]);
      }
      
      // Set Vega-Lite spec and data for the chart
      const spec = data.response;
  
      // Create a message for the chart
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: "System", chart: true, spec: spec, data: formattedData }, // Include chart data
      ]);
    })
    .catch(error => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: "System", text: `Error fetching data: ${error.message}` },
      ]);
      console.log("FastAPI end", url);
      console.log("NODE_ENV", process.env.NODE_ENV);
    });
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
  const [data, setData] = useState(null);
  const [formattedData, setFormattedData] = useState(null);
  const [csvMessage, setCsvMessage] = useState('Click / drag & drop to upload a CSV file!');
  const [headers, setHeaders] = useState(null)
  
  const processFiles = (files) => {
    const file = files[0];
    if (file.type !== 'text/csv' && file.type !== 'application/vnd.ms-excel') {
      console.log(file);
      setCsvMessage('Error: Please upload a valid CSV file.');
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      const csvText = e.target.result;

      // Parse the CSV text using d3-dsv
      try {
        const parsedData = d3.csvParse(csvText);
        setData(parsedData);
        setHeaders(parsedData.columns);
        setFormattedData(d3.csvParse(csvText, d3.autoType()));
        setCsvMessage(`CSV uploaded successfully! Filename: ${file.name}`);
      
        console.log('Columns:',parsedData.columns);
        console.log('Raw Data:', parsedData);
        console.log('AutoType', d3.csvParse(csvText, d3.autoType()));



      } catch (error) {
        setCsvMessage('Error parsing CSV file. Please ensure it is valid.');
        setData(null);
        setHeaders([]);
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

  const [isPreviewVisible, setIsPreviewVisible] = useState(false); 
  const renderCsvPreview = () => {
    if (!data || data.length === 0) return null;

    const limitedData = data.slice(0, 10);
    return (
      <div className="mt-10 max-w-5xl mx-5 my-10">
        <h2 className="text-xl font-bold mb-2">CSV Preview</h2>
        <div className="overflow-auto h-60 border border-gray-300 rounded-lg shadow-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                {Object.keys(limitedData[0]).map((key) => (
                  <th key={key} className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {limitedData.map((row, index) => (
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
    <div className="flex items-center justify-center pt-10 pb-20">
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
        {data && (
          <div className="flex justify-center my-10">
            <button
              onClick={() => setIsPreviewVisible(!isPreviewVisible)}
              className="mt-4 px-4 py-2 bg-black text-white rounded hover:bg-blue-800"
            >
              {isPreviewVisible ? 'Hide Preview' : 'Show Preview'}
            </button>
          </div>
        )}

        {/* Conditional Rendering of CSV Preview */}
        {isPreviewVisible && renderCsvPreview()}

        {/* Chatlog */}
        <div ref={chatLogRef} className="max-h-[40em] overflow-y-auto border px-4 py-8 rounded-lg border-black shadow-lg">
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
              <div className="chat-bubble">
                {msg.chart ? ( // Check if the message is a chart
                  <VegaLite
                    spec={{
                      ...msg.spec,
                      data: { values: msg.data } // Use the loaded CSV data
                    }}
                    onNewView={() => scrollToBottom()}
                  />
                ) : (
                  msg.text // Otherwise, render the text
                )}
              </div>
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