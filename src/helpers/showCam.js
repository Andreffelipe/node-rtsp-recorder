const { Worker } = require('worker_threads');

function StreamWorker(url, timeout) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(`
      const { spawn } = require('child_process');
      const ffplayProcess = spawn('ffplay', [${url}]);

      ffplayProcess.on('error', (error) => {
        reject(error);
      });

      ffplayProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error('FFplay process exited with non-zero code.'));
        }
      });

      ${
        timeout
          ? `
          const timeoutMillis = ${timeout};
          const timeoutId = setTimeout(() => {
            ffplayProcess.kill();
            reject(new Error('FFplay process timed out.'));
          }, timeoutMillis);
  
          ffplayProcess.on('close', () => {
            clearTimeout(timeoutId);
          });
          `
          : ''
      }
    `);

    worker.on('error', (error) => {
      reject(error);
    });
  });
}

module.exports = StreamWorker