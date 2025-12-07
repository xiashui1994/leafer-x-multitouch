import { IUI } from '@leafer-ui/interface'

export interface TouchHandlers {
    onStart?: (touch: Touch, data: any) => void
    onMove?: (touch: Touch, data: any) => void
    onEnd?: (touch: Touch, data: any) => void
}

export interface TouchInfo {
    element: IUI
    handlers: TouchHandlers
    data: any
}

export interface TouchData {
    startX: number
    startY: number
    [key: string]: any
}
