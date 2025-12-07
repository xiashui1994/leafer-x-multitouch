import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MultiTouch } from '../src/index'
import { ILeafer } from '@leafer-ui/interface'

// Mock Touch class if not available in environment
if (typeof Touch === 'undefined') {
    global.Touch = class Touch {
        identifier: number
        target: EventTarget
        clientX: number
        clientY: number
        constructor(init: any) {
            this.identifier = init.identifier
            this.target = init.target
            this.clientX = init.clientX
            this.clientY = init.clientY
        }
    } as any
}

describe('MultiTouch', () => {
    let manager: MultiTouch
    let mockLeafer: any
    let mockElement: any

    beforeEach(() => {
        mockLeafer = {
            pick: vi.fn()
        }
        manager = new MultiTouch(mockLeafer as ILeafer)
        mockElement = { tag: 'Rect' }
    })

    it('should register and unregister elements', () => {
        manager.register(mockElement)
        expect(manager['elements'].has(mockElement)).toBe(true)

        manager.unregister(mockElement)
        expect(manager['elements'].has(mockElement)).toBe(false)
    })

    it('should find matching element directly', () => {
        manager.register(mockElement)
        const found = manager.findMatchingElement(mockElement)
        expect(found).toBe(mockElement)
    })

    it('should find matching element by bubbling', () => {
        const parent = { tag: 'Group' }
        const child = { tag: 'Rect', parent } as any
        manager.register(parent as any)

        const found = manager.findMatchingElement(child)
        expect(found).toBe(parent)
    })

    it('should handle touch start', () => {
        const onStart = vi.fn()
        manager.register(mockElement, { onStart })

        // Mock pick result
        mockLeafer.pick.mockReturnValue({ target: mockElement })

        const touch = new Touch({
            identifier: 1,
            target: {} as any,
            clientX: 100,
            clientY: 100
        })

        const event = {
            touches: [touch],
            changedTouches: [touch]
        } as any

        manager.handleTouchStart(event)

        expect(mockLeafer.pick).toHaveBeenCalledWith({ x: 100, y: 100 })
        expect(onStart).toHaveBeenCalled()
        expect(manager.getActiveTouchCount()).toBe(1)
    })

    it('should handle touch move', () => {
        const onMove = vi.fn()
        manager.register(mockElement, { onStart: vi.fn(), onMove })

        mockLeafer.pick.mockReturnValue({ target: mockElement })

        const touch = new Touch({
            identifier: 1,
            target: {} as any,
            clientX: 100,
            clientY: 100
        })

        // Start first
        manager.handleTouchStart({ touches: [touch] } as any)

        // Move
        const moveTouch = new Touch({
            identifier: 1,
            target: {} as any,
            clientX: 110,
            clientY: 110
        })

        manager.handleTouchMove({ touches: [moveTouch] } as any)

        expect(onMove).toHaveBeenCalled()
    })

    it('should handle touch end', () => {
        const onEnd = vi.fn()
        manager.register(mockElement, { onStart: vi.fn(), onEnd })

        mockLeafer.pick.mockReturnValue({ target: mockElement })

        const touch = new Touch({
            identifier: 1,
            target: {} as any,
            clientX: 100,
            clientY: 100
        })

        // Start
        manager.handleTouchStart({ touches: [touch] } as any)
        expect(manager.getActiveTouchCount()).toBe(1)

        // End
        manager.handleTouchEnd({ changedTouches: [touch] } as any)

        expect(onEnd).toHaveBeenCalled()
        expect(manager.getActiveTouchCount()).toBe(0)
    })
})
