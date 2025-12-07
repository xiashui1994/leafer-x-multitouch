import { ILeafer, IUI, IPickResult } from '@leafer-ui/interface'
import { TouchInfo, TouchHandlers, TouchData } from './types'

/**
 * 多指触摸管理器
 * 用于处理游戏中多个可交互元素的多指触摸事件
 */
export class MultiTouch {
    public leafer: ILeafer
    private touchMap: Map<number, TouchInfo>
    private elements: Map<IUI, TouchHandlers>

    constructor(leafer: ILeafer) {
        this.leafer = leafer
        this.touchMap = new Map() // key: touch.identifier, value: { element, handlers, data }
        this.elements = new Map() // key: element, value: handlers
    }

    /**
     * 注册可交互元素
     */
    public register(element: IUI, handlers: TouchHandlers = {}): void {
        this.elements.set(element, handlers)
    }

    /**
     * 注销元素
     */
    public unregister(element: IUI): void {
        this.elements.delete(element)
    }

    /**
     * 查找匹配的注册元素（支持子元素向上查找）
     */
    public findMatchingElement(target: IUI): IUI | null {
        // 检查是否直接匹配
        if (this.elements.has(target)) {
            return target
        }

        // 向上遍历，检查父元素
        let current: IUI | null = target
        while (current && current !== (this.leafer as unknown as IUI)) {
            if (this.elements.has(current)) {
                return current
            }
            current = current.parent
        }

        return null
    }

    /**
     * 处理 touchstart 事件
     */
    public handleTouchStart(event: TouchEvent): void {
        for (let i = 0; i < event.touches.length; i++) {
            const touch = event.touches[i]

            // 如果已经在追踪，跳过
            if (this.touchMap.has(touch.identifier)) continue

            // 检测触摸点下的元素
            const pickResult: IPickResult = this.leafer.pick({ x: touch.clientX, y: touch.clientY })
            if (!pickResult || !pickResult.target) continue

            // 查找匹配的注册元素
            const element = this.findMatchingElement(pickResult.target as IUI)
            if (!element) continue

            const handlers = this.elements.get(element)

            if (!handlers) continue

            // 创建触摸数据（用于存储自定义数据）
            const touchData: TouchData = {
                startX: touch.clientX,
                startY: touch.clientY,
            }

            // 记录触摸点
            this.touchMap.set(touch.identifier, {
                element,
                handlers,
                data: touchData,
            })

            // 调用 onStart 回调
            if (handlers.onStart) {
                handlers.onStart(touch, touchData)
            }
        }
    }

    /**
     * 处理 touchmove 事件
     */
    public handleTouchMove(event: TouchEvent): void {
        for (let i = 0; i < event.touches.length; i++) {
            const touch = event.touches[i]
            const info = this.touchMap.get(touch.identifier)

            if (!info) continue

            // 调用 onMove 回调
            if (info.handlers.onMove) {
                info.handlers.onMove(touch, info.data)
            }
        }
    }

    /**
     * 处理 touchend / touchcancel 事件
     */
    public handleTouchEnd(event: TouchEvent): void {
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i]
            const info = this.touchMap.get(touch.identifier)

            if (!info) continue

            // 调用 onEnd 回调
            if (info.handlers.onEnd) {
                info.handlers.onEnd(touch, info.data)
            }

            // 清除追踪
            this.touchMap.delete(touch.identifier)
        }
    }

    /**
     * 清除所有追踪的触摸点
     */
    public clear(): void {
        this.touchMap.clear()
    }

    /**
     * 获取当前活跃的触摸点数量
     */
    public getActiveTouchCount(): number {
        return this.touchMap.size
    }
}
