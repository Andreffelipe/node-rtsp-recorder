//   recorder.js
//   node-rtsp-recorder
//
//   Created by Sahil Chaddha on 24/08/2018.
//

const moment = require('moment')
const childProcess = require('node:child_process')
const path = require('node:path')
const FileHandler = require('./fileHandler')
const { Worker } = require('worker_threads');
const fh = new FileHandler()

const RTSPRecorder = class {
  constructor(config = {}) {
      this.config = config
      this.name = config.name
      this.url = config.url
      this.timeLimit = config.timeLimit || 60
      this.setTimeout = config.setTimeout || 3000
      this.showCam = config.showCam || { show: false, timeout: undefined }
      this.folder = config.folder || 'media/'
      this.categoryType = config.type || 'video'
      this.directoryPathFormat = config.directoryPathFormat || 'MMM-Do-YY'
      this.fileNameFormat = config.fileNameFormat || 'YYYY-M-D-h-mm-ss'
      this.audioCodec = config.audioCodec || 'copy'
      this.options = config.options || { detached: false }
      fh.createDirIfNotExists(this.getDirectoryPath())
      // fh.createDirIfNotExists(this.getTodayPath())
      this.startStream()
  }

  getDirectoryPath() {
      return path.join(this.folder, (this.name ? this.name : ''))
  }

  getTodayPath() {
      return path.join(this.getDirectoryPath(), moment().format(this.directoryPathFormat))
  }

  getMediaTypePath() {
      return path.join(this.getTodayPath(), this.categoryType)
  }

  getFilename(folderPath) {
      return path.join(folderPath, moment().format(this.fileNameFormat) + this.getExtenstion())
  }

  getExtenstion() {
      if (this.categoryType === 'audio') {
          return '.avi'
      }
      if (this.categoryType === 'image') {
          return '.jpg'
      }

      return '.mp4'
  }

  getArguments() {
      if (this.categoryType === 'audio') {
          return ['-vn', '-acodec', 'copy']
      }
      if (this.categoryType === 'image') {
          return ['-vframes', '1']
      }
      return ['-acodec', this.audioCodec, '-vcodec', 'copy']
  }

  getChildProcess(fileName) {
      // var args = ['-rtsp_transport', 'tcp', '-timeout', this.setTimeout, '-y', '-i', this.url]
      var args = ['-i', this.url]
      const mediaArgs = this.getArguments()
      mediaArgs.forEach((item) => {
          args.push(item)
      })
      args.push(fileName)
      // console.log('ffmpeg', args, this.options)
      return childProcess.spawn('ffmpeg', args, this.options)
  }

  stopRecording() {
      this.disableStreaming = true
      if (this.timer) {
          clearTimeout(this.timer)
          this.timer = null
      }
      if (this.writeStream) {
          this.killStream()
      }
  }

  startRecording() {
      if (!this.url) {
          console.log('URL Not Found.')
          return true
      }
      this.recordStream()
  }

  captureImage(name, cb, error) {
      if (!name) {
          const folderPath = this.getMediaTypePath()
          fh.createDirIfNotExists(folderPath)
          name = this.getFilename(folderPath)
      }

      const writeStream = this.getChildProcess(name)

      writeStream.once('exit', () => {
          if (cb) {
              cb()
          }
      })

      writeStream.on('close', (code) => {
          if (code !== 0) {
              error(`ps process exited with code ${code}`);
          }
      })

      writeStream.once('error', (error) => {
          if (cb) {
              error(error)
          }
      })

  }

  killStream() {
      this.writeStream.kill()
  }

  recordStream() {
      if (this.categoryType === 'image') {
          return
      }
      const self = this
      if (this.timer) {
          clearTimeout(this.timer)
      }

      if (this.writeStream && this.writeStream.binded) {
          return false
      }

      if (this.writeStream && this.writeStream.connected) {
          this.writeStream.binded = true
          this.writeStream.once('exit', () => {
              self.recordStream()
          })
          this.killStream()
          return false
      }

      this.writeStream = null
      const folderPath = this.getMediaTypePath()
      fh.createDirIfNotExists(folderPath)
      const fileName = this.getFilename(folderPath)
      this.writeStream = this.getChildProcess(fileName)

      this.writeStream.once('exit', () => {
          if (self.disableStreaming) {
              return true
          }
          self.recordStream()
      })
      this.timer = setTimeout(self.killStream.bind(this), this.timeLimit * 1000)

      console.log('Start record ' + fileName)
  }

  startStream() {
      console.log(this.showCam)
      if (this.showCam.show) {
          this.streamWorker(this.url, this.showCam.timeout)
              .then(() => {
                  console.log('FFplay process exited successfully.');
              })
              .catch((error) => {
                  console.error('An error occurred:', error);
              });
      }
  }

  streamWorker(url, timeout) {
      return new Promise((resolve, reject) => {
          const worker = new Worker(path.join(__dirname, 'worker.js'), {
              workerData: url
          });

          worker.on('message', (message) => {
              if (message === 'exit') {
                  resolve();
              }
          });

          worker.on('error', (error) => {
              reject(error);
          });

          worker.on('exit', (code) => {
              if (code !== 0) {
                  reject(new Error('FFplay process exited with non-zero code.'));
              }
          });

          if (timeout) {
              setTimeout(() => {
                  worker.terminate();
                  reject(new Error('FFplay process timed out.'));
              }, timeout);
          }
      });
  }

}

module.exports = RTSPRecorder