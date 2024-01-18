import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

interface UpdateData {
  longTermMemory: string[][];
  shortTermMemory: string;
  subconsciousness: string;
  thought: string;
  consciousness: string;
  answer: string;
  log: string;
}

const socket = io('http://localhost:4000');

const App = () => {
  const [input, setInput] = useState('');
  const [log, setLog] = useState('');

  useEffect(() => {
    socket.on('update', (data: UpdateData) => {
      console.log(data, '111');
      setLog(data.log);
    });

    return () => {
      socket.off('update');
    };
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value);
  };

  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    socket.emit('userInput', input);
    setInput('');
  };

  return (
    <div className="App">
      <form onSubmit={handleFormSubmit}>
        <input type="text" value={input} onChange={handleInputChange} />
        <button type="submit">Submit</button>
      </form>

      <pre>{log}</pre>
    </div>
  );
};

export default App;
