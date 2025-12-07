# leafer-x-multitouch

> Leafer UI 的多点触控管理插件

[![npm version](https://img.shields.io/npm/v/leafer-x-multitouch.svg)](https://www.npmjs.com/package/leafer-x-multitouch)
[![license](https://img.shields.io/npm/l/leafer-x-multitouch.svg)](https://github.com/xiashui1994/leafer-x-multitouch/blob/main/LICENSE)

一个强大的多点触控管理插件,用于在 [Leafer UI](https://www.leaferjs.com/) 中处理多个可交互元素的多指触摸事件。支持 Web、微信小游戏等多平台。

## ✨ 特性

- 🎯 **多指独立追踪** - 每个触摸点独立管理,互不干扰
- 🎮 **游戏场景优化** - 完美支持虚拟摇杆、按钮等游戏控件
- 🔄 **事件冒泡支持** - 子元素触摸可向上查找注册的父元素
- 💾 **自定义数据存储** - 每个触摸点可存储自定义数据
- 🛡️ **错误处理** - 完整的错误捕获机制,防止回调异常中断流程
- 🧹 **内存管理** - 自动清理机制,防止内存泄漏
- 📦 **TypeScript** - 完整的类型定义
- 🌍 **多平台支持** - Web、微信小游戏、小程序等

## 📦 安装

```bash
npm install leafer-x-multitouch
# or
pnpm add leafer-x-multitouch
# or
yarn add leafer-x-multitouch
```

## 🚀 快速开始

### Web 环境

```typescript
import { Leafer, Rect } from 'leafer-ui'
import { MultiTouch } from 'leafer-x-multitouch'

// 创建应用
const leafer = new Leafer({ view: window })
const multiTouch = new MultiTouch(leafer)

// 绑定触摸事件
window.addEventListener('touchstart', (e) => multiTouch.handleTouchStart(e))
window.addEventListener('touchmove', (e) => multiTouch.handleTouchMove(e))
window.addEventListener('touchend', (e) => multiTouch.handleTouchEnd(e))

// 创建可拖拽的方块
const box = new Rect({
    x: 100,
    y: 100,
    width: 100,
    height: 100,
    fill: '#FF4B4B'
})

leafer.add(box)

// 注册拖拽交互
multiTouch.register(box, {
    onStart: (touch, data) => {
        box.opacity = 0.5
        // 记录相对位置
        data.offsetX = box.x - data.startX
        data.offsetY = box.y - data.startY
    },
    onMove: (touch, data) => {
        // 更新位置
        box.x = touch.clientX + data.offsetX
        box.y = touch.clientY + data.offsetY
    },
    onEnd: () => {
        box.opacity = 1
    }
})
```

### 微信小游戏

```typescript
import { Leafer, Rect } from 'leafer-ui'
import { MultiTouch } from 'leafer-x-multitouch'

// 创建 Canvas
const canvas = wx.createCanvas()
const leafer = new Leafer({ view: canvas })
const multiTouch = new MultiTouch(leafer)

// 绑定微信小游戏触摸事件
wx.onTouchStart((e) => multiTouch.handleTouchStart(e))
wx.onTouchMove((e) => multiTouch.handleTouchMove(e))
wx.onTouchEnd((e) => multiTouch.handleTouchEnd(e))

// 创建可拖拽的方块
const box = new Rect({
    x: 100,
    y: 100,
    width: 100,
    height: 100,
    fill: '#4B9EFF'
})

leafer.add(box)

// 注册拖拽交互
multiTouch.register(box, {
    onStart: (touch, data) => {
        box.opacity = 0.5
        data.offsetX = box.x - data.startX
        data.offsetY = box.y - data.startY
    },
    onMove: (touch, data) => {
        box.x = touch.clientX + data.offsetX
        box.y = touch.clientY + data.offsetY
    },
    onEnd: () => {
        box.opacity = 1
    }
})
```

## 📖 API 文档

### MultiTouch

#### 构造函数

```typescript
constructor(leafer: ILeafer)
```

#### 方法

##### `register(element, handlers)`

注册可交互元素

```typescript
multiTouch.register(element, {
    onStart?: (touch: Touch, data: TouchData) => void
    onMove?: (touch: Touch, data: TouchData) => void
    onEnd?: (touch: Touch, data: TouchData) => void
})
```

**参数:**
- `element` - 要注册的 UI 元素
- `handlers` - 触摸事件处理器
  - `onStart` - 触摸开始时触发
  - `onMove` - 触摸移动时触发
  - `onEnd` - 触摸结束时触发

**TouchData 属性:**
- `startX` - 触摸开始的 X 坐标
- `startY` - 触摸开始的 Y 坐标
- 可添加任意自定义属性

##### `unregister(element)`

注销元素并清理相关触摸点

```typescript
multiTouch.unregister(element)
```

##### `hasElement(element)`

检查元素是否已注册

```typescript
if (multiTouch.hasElement(box)) {
    console.log('Box is registered')
}
```

##### `getTouchInfo(identifier)`

获取指定触摸点的信息

```typescript
const info = multiTouch.getTouchInfo(1)
if (info) {
    console.log('Touch element:', info.element)
    console.log('Touch data:', info.data)
}
```

##### `getTouchesByElement(element)`

获取元素的所有触摸点标识符

```typescript
const identifiers = multiTouch.getTouchesByElement(box)
console.log(`Box has ${identifiers.length} active touches`)
```

##### `getActiveTouchCount()`

获取当前活跃的触摸点数量

```typescript
const count = multiTouch.getActiveTouchCount()
```

##### `clear()`

清除所有追踪的触摸点

```typescript
multiTouch.clear()
```

##### `destroy()`

销毁管理器,清理所有资源

```typescript
// 应用关闭时
multiTouch.destroy()
```

##### 事件处理方法

```typescript
handleTouchStart(event: TouchEvent): void
handleTouchMove(event: TouchEvent): void
handleTouchEnd(event: TouchEvent): void
```

## 🎮 游戏场景示例

### 同时操作摇杆和按钮

```typescript
// 左侧虚拟摇杆
multiTouch.register(joystick, {
    onStart: (touch, data) => {
        data.startPos = { x: joystick.x, y: joystick.y }
    },
    onMove: (touch, data) => {
        // 计算摇杆偏移
        const dx = touch.clientX - data.startX
        const dy = touch.clientY - data.startY
        // 更新角色移动
        player.move(dx, dy)
    },
    onEnd: () => {
        player.stop()
    }
})

// 右侧 A 按钮
multiTouch.register(buttonA, {
    onStart: () => player.jump()
})

// 右侧 B 按钮
multiTouch.register(buttonB, {
    onStart: () => player.attack()
})

// 现在可以同时:左手控制移动,右手点击跳跃/攻击
```

## 🔧 高级用法

### 事件冒泡

子元素的触摸会向上查找注册的父元素:

```typescript
const group = new Group()
const child = new Rect({ ... })
group.add(child)

// 只注册父元素
multiTouch.register(group, {
    onStart: () => console.log('Group or child touched')
})

// 触摸 child 也会触发 group 的回调
```

### 自定义数据存储

```typescript
multiTouch.register(element, {
    onStart: (touch, data) => {
        // 存储自定义数据
        data.initialRotation = element.rotation
        data.initialScale = element.scale
        data.customValue = 'anything'
    },
    onMove: (touch, data) => {
        // 使用存储的数据
        element.rotation = data.initialRotation + calculateAngle(touch)
    }
})
```

### 多点触控检测

```typescript
const identifiers = multiTouch.getTouchesByElement(element)
if (identifiers.length >= 2) {
    console.log('Multi-finger gesture detected')
    // 实现缩放、旋转等手势
}
```

## 📝 注意事项

1. **性能优化**
   - 避免在 `onMove` 中执行重计算
   - 使用节流/防抖优化高频事件
   - 及时调用 `destroy()` 释放资源

2. **错误处理**
   - 所有回调都有错误捕获,不会中断触摸流程
   - 错误会输出到 console.error

3. **内存管理**
   - `unregister()` 会自动清理相关触摸点
   - `destroy()` 会清理所有资源并触发 `onEnd` 回调

## 📄 License

[MIT](./LICENSE)
