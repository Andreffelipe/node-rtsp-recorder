
declare class FileHandler {
    createDirIfNotExists(folderPath: string): void
    removeDirectory(folderPath: string, callback: (error: Error) => void): void
    getDirectorySize(
        folderPath: string,
        callback: (error: Error | null, size: number) => void
    ): void
}

declare class Recorder {
    constructor(config?: {
        name?: string
        url?: string
        timeLimit?: number
        setTimeout?: number
        showCam?: { show: boolean, timeout?: number }
        folder?: string
        type?: string
        directoryPathFormat?: string
        fileNameFormat?: string
        audioCodec?: string
        options?: { detached: boolean, stdio: string }
    })
    getDirectoryPath(): string
    getTodayPath(): string
    getMediaTypePath(): string
    getFilename(folderPath: string): string
    getExtenstion(): string
    getArguments(): string[]
    getChildProcess(fileName: string): any
    stopRecording(): void
    startRecording(): boolean
    captureImage(name: string, cb?: () => void, error?: (error: Error) => void,): void
    killStream(): void
    recordStream(): boolean
}

export { Recorder, FileHandler }
