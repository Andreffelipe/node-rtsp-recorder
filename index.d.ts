
declare class FileHandler {
    createDirIfNotExists(folderPath: string): void
    removeDirectory(folderPath: string, callback: (error: Error) => void): void
    getDirectorySize(
        folderPath: string,
        callback: (error: Error | null, size: number) => void
    ): void
}

declare class RTSPRecorder {
    constructor(config?: {
        name?: string
        url?: string
        timeLimit?: number
        folder?: string
        type?: string
        directoryPathFormat?: string
        fileNameFormat?: string
        audioCodec?: string
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
    captureImage(cb?: () => void, name?: string): void
    killStream(): void
    recordStream(): boolean
}

declare const rtspRecorder: typeof RTSPRecorder
export = rtspRecorder

declare const fileHandler: FileHandler
export = fileHandler