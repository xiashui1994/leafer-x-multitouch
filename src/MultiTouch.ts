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
        this.touchMap = new Map()
        this.elements = new Map()
    }

    /**
     * 注册可交互元素
     * @param element - 要注册的 UI 元素
     * @param handlers - 触摸事件处理器
     */
    public register(element: IUI, handlers: TouchHandlers = {}): void {
        this.elements.set(element, handlers)
    }

    /**
     * 注销元素并清理相关触摸点
     * @param element - 要注销的 UI 元素
     */
    public unregister(element: IUI): void {
        this.elements.delete(element)

        // 清理该元素相关的所有触摸点,防止内存泄漏
        for (const [identifier, info] of this.touchMap.entries()) {
            if (info.element === element) {
                // 触发 onEnd 回调
                if (info.handlers.onEnd) {
                    try {
                        // 创建一个模拟的 Touch 对象用于回调
                        const mockTouch = {
                            identifier,
                            clientX: info.data.startX,
                            clientY: info.data.startY,
                        } as Touch
                        info.handlers.onEnd(mockTouch, info.data)
                    } catch (error) {
                        console.error('MultiTouch: Error in onEnd handler during unregister:', error)
                    }
                }
                this.touchMap.delete(identifier)
            }
        }
    }

    /**
     * 检查元素是否已注册
     * @param element - 要检查的 UI 元素
     * @returns 是否已注册
     */
    public hasElement(element: IUI): boolean {
        return this.elements.has(element)
    }

    /**
     * 查找匹配的注册元素（支持子元素向上查找）
     * @param target - 目标 UI 元素
     * @returns 匹配的注册元素,如果未找到则返回 null
     */
    public findMatchingElement(target: IUI): IUI | null {
        // 检查是否直接匹配
        if (this.elements.has(target)) {
            return target
        }

        // 向上遍历,检查父元素
        let current: IUI | null = target
        while (current?.parent) {
            current = current.parent
            if (this.elements.has(current)) {
                return current
            }
        }

        return null
    }

    /**
     * 处理 touchstart 事件
     * @param event - 原生触摸事件
     */
    public handleTouchStart(event: TouchEvent): void {
        for (const touch of Array.from(event.touches)) {
            // 如果已经在追踪,跳过
            if (this.touchMap.has(touch.identifier)) continue

            // 检测触摸点下的元素
            const pickResult: IPickResult = this.leafer.pick({ x: touch.clientX, y: touch.clientY })
            if (!pickResult?.target) continue

            // 查找匹配的注册元素
            const element = this.findMatchingElement(pickResult.target as IUI)
            if (!element) continue

            const handlers = this.elements.get(element)!

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
                try {
                    handlers.onStart(touch, touchData)
                } catch (error) {
                    console.error('MultiTouch: Error in onStart handler:', error)
                }
            }
        }
    }

    /**
     * 处理 touchmove 事件
     * @param event - 原生触摸事件
     */
    public handleTouchMove(event: TouchEvent): void {
        for (const touch of Array.from(event.touches)) {
            const info = this.touchMap.get(touch.identifier)
            if (!info) continue

            // 调用 onMove 回调
            if (info.handlers.onMove) {
                try {
                    info.handlers.onMove(touch, info.data)
                } catch (error) {
                    console.error('MultiTouch: Error in onMove handler:', error)
                }
            }
        }
    }

    /**
     * 处理 touchend / touchcancel 事件
     * @param event - 原生触摸事件
     */
    public handleTouchEnd(event: TouchEvent): void {
        for (const touch of Array.from(event.changedTouches)) {
            const info = this.touchMap.get(touch.identifier)
            if (!info) continue

            // 调用 onEnd 回调
            if (info.handlers.onEnd) {
                try {
                    info.handlers.onEnd(touch, info.data)
                } catch (error) {
                    console.error('MultiTouch: Error in onEnd handler:', error)
                }
            }

            // 清除追踪
            this.touchMap.delete(touch.identifier)
        }
    }

    /**
     * 获取指定触摸点的信息
     * @param identifier - 触摸点标识符
     * @returns 触摸点信息,如果不存在则返回 undefined
     */
    public getTouchInfo(identifier: number): TouchInfo | undefined {
        return this.touchMap.get(identifier)
    }

    /**
     * 获取指定元素的所有触摸点标识符
     * @param element - UI 元素
     * @returns 触摸点标识符数组
     */
    public getTouchesByElement(element: IUI): number[] {
        const identifiers: number[] = []
        for (const [identifier, info] of this.touchMap.entries()) {
            if (info.element === element) {
                identifiers.push(identifier)
            }
        }
        return identifiers
    }

    /**
     * 清除所有追踪的触摸点
     */
    public clear(): void {
        this.touchMap.clear()
    }

    /**
     * 获取当前活跃的触摸点数量
     * @returns 活跃触摸点数量
     */
    public getActiveTouchCount(): number {
        return this.touchMap.size
    }

    /**
     * 销毁管理器,清理所有资源
     * 在不再使用时调用此方法以释放内存
     */
    public destroy(): void {
        // 清理所有触摸点(触发 onEnd 回调)
        for (const [identifier, info] of this.touchMap.entries()) {
            if (info.handlers.onEnd) {
                try {
                    const mockTouch = {
                        identifier,
                        clientX: info.data.startX,
                        clientY: info.data.startY,
                    } as Touch
                    info.handlers.onEnd(mockTouch, info.data)
                } catch (error) {
                    console.error('MultiTouch: Error in onEnd handler during destroy:', error)
                }
            }
        }

        this.touchMap.clear()
        this.elements.clear()
    }
}
