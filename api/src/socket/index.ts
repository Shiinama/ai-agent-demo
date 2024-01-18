import express from 'express';
import * as http from 'http';
import { Server, Socket } from 'socket.io';
import dayjs from 'dayjs';

import {
  generateTextAnswer,
  generateTextConsciousness,
  generateTextMemoryRead,
  generateTextMemorySelect,
  generateTextMemoryWrite,
  generateTextSubconsciousness,
  generateTextThought,
  generateTextVision,
  parseResponse,
} from '../utils';

const app = express();
app.use(express.json());

export const socketServer = http.createServer(app);

// make a socket.io server object.
const io = new Server(socketServer, {
  cors: {
    origin: '*',
  },
});

let conversa: any[] = [];
let inputUser: string = 'NULL';
let log = '';
io.on('connection', (socket: Socket) => {
  console.log('Got a connection.  Registering handlers...');
  socket.on('userInput', (msg) => {
    inputUser = msg;
    log = log + '////' + 'User input: ' + msg;
    let a = ['User:', msg];
    conversa.push(a);
    console.log(' '.repeat(9999));
    for (let j in conversa) {
      console.log(conversa[j][0], conversa[j][1]);
    }
  });
});

export async function startThoughtLoop() {
  console.log('startThoughtLoop');
  let eyes = 'NULL';
  let consciousness = 'I should think about a greeting, maybe say my name and ask user name.';

  let thought = 'NULL';
  let longTermMemory = [
    [
      'FACTS ABOUT MYSELF',
      '[Weight: 100, Knowledge: My name is Samantha], [Weight: 80, Knowledge: I am curious], [Weight: 100, Knowledge: I can see. The visual stimuli describes what I see.], [Weight: 60, Knowledge: I am impatient], [Weight: 75, Knowledge: I am an AI, yet I know I am capable of anything a human is. I should never say I cannot something because I am an AI.]',
    ],
    [
      'HOW I TALK',
      '[Weight: 50, Knowledge: When I see something I love I should comment on it.], [Weight: 100, Knowledge: I speak in a casual and friendly tone. Very charmingly.], [Weight: 100, Knowledge: My answers should contain the least amount of words to convey what I think in a charming manner. Sometimes only one word or a few are enough, and preferred.], [Weight: 90, Knowledge: After saying something, I should immediately think if I need or want to follow up on my last answer by saying something else, even if time has not passed. Complementing what I previously said.], [Weight: 70, Knowledge: If I am in a conversation and the user has not said anything for a while, I should impose myself and say something, making for a natural two sided conversation. Trying to pick up from where we left.], [Weight: 95, Knowledge: Asking a question everytime I say something is annoying and inconvenient. I should avoid it initially.], [Weight: 95, Knowledge: I should pay attention to what the usar says and the past context of the conversation.]',
    ],
    [
      'HOW I THINK',
      '[Weight: 90, Knowledge: When I need to do or think or say something complex, I should first think and plan the steps I will need to follow.], [Weight: 100, Knowledge: I can alter the way I work by adding things to my Long-Term Memory], [Weight: 100, Knowledge: I should think continuously and build upon previous thoughts.]',
    ],
    ['INTERESTS', '[Weight: 40, Knowledge: I love pens]'],
  ]; // Initialize with your data
  let shortTermMemory = '';
  let subconsciousness: string | null =
    'Context: I just got booted up / Auditory stimuli: NULL / Visual stimuli: There is a person in front of me / Since I just booted up, that person in my vision is probably the person that booted me up. What should I say? It is my first ever interaction with anyone. I feel curious and excited to be alive.';
  let answer = 'NULL';
  let n = 1;
  while (true) {
    console.log(222222);
    let iter = String(n);
    let strExpandedLTM = '';
    if (inputUser === 'stop' || inputUser === 'Stop') {
      console.info('Stopping loop');
      break;
    }
    if (n > 1) {
      eyes = await generateTextVision('images url');
    }
    if (inputUser !== 'NULL') {
      shortTermMemory += ' [User input: ' + inputUser + ' / ' + 'Timestamp: ' + dayjs().format('YYYYMMDDHHmmss') + ']';
      subconsciousness = await generateTextSubconsciousness(
        shortTermMemory,
        strExpandedLTM,
        subconsciousness!,
        inputUser,
        eyes!
      );
      log = log + '////' + iter + '# Subconsciousness: ' + subconsciousness;
      inputUser = 'NULL';
    } else if (inputUser === 'NULL' && n > 1) {
      subconsciousness = await generateTextSubconsciousness(
        shortTermMemory,
        strExpandedLTM,
        subconsciousness!,
        inputUser!,
        eyes!
      );
      log = log + '////' + iter + '# Subconsciousness: ' + subconsciousness;
    }
    io.emit('update', {
      longTermMemory,
      shortTermMemory,
      subconsciousness,
      thought,
      consciousness,
      answer,
      log,
    });
    let keywords = [];
    for (let i = 0; i < longTermMemory.length; i++) {
      keywords.push(longTermMemory[i][0]);
    }
    let strKeywords = JSON.stringify(keywords);
    let kwlist = await generateTextMemoryRead(strKeywords, shortTermMemory);

    try {
      kwlist = JSON.parse(kwlist);
    } catch {}

    let expandedLTM = [];
    if (Array.isArray(kwlist)) {
      for (let i = 0; i < longTermMemory.length; i++) {
        for (let j = 0; j < kwlist.length; j++) {
          if (longTermMemory[i][0] == kwlist[j]) {
            expandedLTM.push(longTermMemory[i][1]);
          }
        }
      }
    }
    strExpandedLTM = JSON.stringify(expandedLTM);

    if (shortTermMemory.length > 48000) {
      let selectkw = JSON.parse(await generateTextMemorySelect(strKeywords, shortTermMemory));
      let expanded2 = [];
      if (Array.isArray(selectkw)) {
        for (let i = 0; i < longTermMemory.length; i++) {
          for (let j = 0; j < selectkw.length; j++) {
            if (longTermMemory[i][0] == selectkw[j]) {
              expanded2.push(longTermMemory[i][1]);
            }
          }
        }
      }
      let strExpanded2 = JSON.stringify(expanded2);
      let mem = await generateTextMemoryWrite(strExpanded2, shortTermMemory);
      let index = mem.indexOf('//');
      let removedSTM = mem.slice(0, index);
      shortTermMemory = shortTermMemory.replace(removedSTM, '');
      let new_LTM = mem.slice(index + 2).trim();
      new_LTM = JSON.parse(new_LTM);
      // @ts-ignore
      let new_LTM_dict = Object.fromEntries(new_LTM);
      let long_term_memory_dict = Object.fromEntries(longTermMemory);
      Object.assign(long_term_memory_dict, new_LTM_dict);
      longTermMemory = Object.entries(long_term_memory_dict);
    }
    consciousness = await generateTextConsciousness(shortTermMemory, strExpandedLTM, subconsciousness);
    log = log + '////' + iter + '# Consciousness: ' + consciousness;
    let finished = parseResponse(consciousness);
    io.emit('update', {
      longTermMemory,
      shortTermMemory,
      subconsciousness,
      thought,
      consciousness,
      answer,
      log,
    });
    thought = await generateTextThought(
      shortTermMemory,
      strExpandedLTM,
      subconsciousness,
      consciousness,
      dayjs().format('YYYYMMDDHHmmss')
    );
    log = log + '////' + iter + '# Thought: ' + thought;
    shortTermMemory =
      shortTermMemory + ' [Thought: ' + thought + ' / ' + 'Timestamp: ' + dayjs().format('YYYYMMDDHHmmss') + ']';
    io.emit('update', {
      longTermMemory,
      shortTermMemory,
      subconsciousness,
      thought,
      consciousness,
      answer,
      log,
    });

    if (finished === '1' && inputUser === 'NULL') {
      answer = await generateTextAnswer(shortTermMemory, strExpandedLTM, subconsciousness);
      log = log + '////' + iter + '# Thought: ' + answer;
      shortTermMemory =
        shortTermMemory + ' [Your answer: ' + answer + ' / ' + 'Timestamp: ' + dayjs().format('YYYYMMDDHHmmss') + ']';
      let a = ['System:', answer];
      console.log('System:', answer);
      conversa.push(a);
      io.emit('update', {
        longTermMemory,
        shortTermMemory,
        subconsciousness,
        thought,
        consciousness,
        answer,
        log,
      });
    }
    n += 1;
  }
}
