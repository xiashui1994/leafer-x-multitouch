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

    it('should check if element is registered', () => {
        expect(manager.hasElement(mockElement)).toBe(false)

        manager.register(mockElement)
        expect(manager.hasElement(mockElement)).toBe(true)

        manager.unregister(mockElement)
        expect(manager.hasElement(mockElement)).toBe(false)
    })

    it('should get touch info by identifier', () => {
        manager.register(mockElement, { onStart: vi.fn() })
        mockLeafer.pick.mockReturnValue({ target: mockElement })

        const touch = new Touch({
            identifier: 1,
            target: {} as any,
            clientX: 100,
            clientY: 100
        })

        manager.handleTouchStart({ touches: [touch] } as any)

        const info = manager.getTouchInfo(1)
        expect(info).toBeDefined()
        expect(info?.element).toBe(mockElement)
        expect(info?.data.startX).toBe(100)
        expect(info?.data.startY).toBe(100)

        expect(manager.getTouchInfo(999)).toBeUndefined()
    })

    it('should get touches by element', () => {
        manager.register(mockElement, { onStart: vi.fn() })
        mockLeafer.pick.mockReturnValue({ target: mockElement })

        const touch1 = new Touch({
            identifier: 1,
            target: {} as any,
            clientX: 100,
            clientY: 100
        })

        const touch2 = new Touch({
            identifier: 2,
            target: {} as any,
            clientX: 200,
            clientY: 200
        })

        manager.handleTouchStart({ touches: [touch1, touch2] } as any)

        const identifiers = manager.getTouchesByElement(mockElement)
        expect(identifiers).toHaveLength(2)
        expect(identifiers).toContain(1)
        expect(identifiers).toContain(2)
    })

    it('should clean up touches when unregistering element', () => {
        const onEnd = vi.fn()
        manager.register(mockElement, { onStart: vi.fn(), onEnd })
        mockLeafer.pick.mockReturnValue({ target: mockElement })

        const touch = new Touch({
            identifier: 1,
            target: {} as any,
            clientX: 100,
            clientY: 100
        })

        manager.handleTouchStart({ touches: [touch] } as any)
        expect(manager.getActiveTouchCount()).toBe(1)

        // Unregister should clean up touches and call onEnd
        manager.unregister(mockElement)
        expect(onEnd).toHaveBeenCalled()
        expect(manager.getActiveTouchCount()).toBe(0)
    })

    it('should destroy and clean up all resources', () => {
        const onEnd1 = vi.fn()
        const onEnd2 = vi.fn()
        const element2 = { tag: 'Rect2' }

        manager.register(mockElement, { onStart: vi.fn(), onEnd: onEnd1 })
        manager.register(element2 as any, { onStart: vi.fn(), onEnd: onEnd2 })

        mockLeafer.pick.mockReturnValue({ target: mockElement })

        const touch1 = new Touch({
            identifier: 1,
            target: {} as any,
            clientX: 100,
            clientY: 100
        })

        manager.handleTouchStart({ touches: [touch1] } as any)

        mockLeafer.pick.mockReturnValue({ target: element2 })
        const touch2 = new Touch({
            identifier: 2,
            target: {} as any,
            clientX: 200,
            clientY: 200
        })

        manager.handleTouchStart({ touches: [touch2] } as any)

        expect(manager.getActiveTouchCount()).toBe(2)

        // Destroy should clean up everything
        manager.destroy()
        expect(onEnd1).toHaveBeenCalled()
        expect(onEnd2).toHaveBeenCalled()
        expect(manager.getActiveTouchCount()).toBe(0)
        expect(manager.hasElement(mockElement)).toBe(false)
        expect(manager.hasElement(element2 as any)).toBe(false)
    })

    it('should handle errors in callbacks gracefully', () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

        const onStart = vi.fn(() => {
            throw new Error('Test error')
        })

        manager.register(mockElement, { onStart })
        mockLeafer.pick.mockReturnValue({ target: mockElement })

        const touch = new Touch({
            identifier: 1,
            target: {} as any,
            clientX: 100,
            clientY: 100
        })

        // Should not throw, error should be caught
        expect(() => {
            manager.handleTouchStart({ touches: [touch] } as any)
        }).not.toThrow()

        expect(consoleErrorSpy).toHaveBeenCalled()
        consoleErrorSpy.mockRestore()
    })
})
