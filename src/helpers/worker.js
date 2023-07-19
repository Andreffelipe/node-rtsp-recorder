const { parentPort, workerData } = require('worker_threads');
const { spawn } = require('child_process');

const thread = (url) => {
  const ffplayProcess = spawn('ffplay', [url], { detached: false });

  ffplayProcess.on('error', (error) => {
    console.error(error);
  });

  ffplayProcess.on('close', (code) => {
    if (code === 0) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  });
}

parentPort.postMessage(
  thread(workerData)
);