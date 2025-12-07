import { Leafer, Rect, Text, Group } from 'leafer-ui'
import { MultiTouch } from './src/index'

// 创建应用
const leafer = new Leafer({ view: window })

// 创建多指触控管理器
const pointer = new MultiTouch(leafer)

// 绑定触摸事件到 window
window.addEventListener('touchstart', (e) => {
    pointer.handleTouchStart(e)
    updateTouchCount()
})
window.addEventListener('touchmove', (e) => pointer.handleTouchMove(e))
window.addEventListener('touchend', (e) => {
    pointer.handleTouchEnd(e)
    updateTouchCount()
})
window.addEventListener('touchcancel', (e) => {
    pointer.handleTouchEnd(e)
    updateTouchCount()
})

// 添加鼠标事件支持(用于 PC 端测试)
let mouseIdentifier = 999
window.addEventListener('mousedown', (e) => {
    const mockTouchEvent = {
        touches: [{ identifier: mouseIdentifier, clientX: e.clientX, clientY: e.clientY, target: e.target }]
    } as any
    pointer.handleTouchStart(mockTouchEvent)
    updateTouchCount()
})
window.addEventListener('mousemove', (e) => {
    if (e.buttons === 1) {
        const mockTouchEvent = {
            touches: [{ identifier: mouseIdentifier, clientX: e.clientX, clientY: e.clientY, target: e.target }]
        } as any
        pointer.handleTouchMove(mockTouchEvent)
    }
})
window.addEventListener('mouseup', (e) => {
    const mockTouchEvent = {
        changedTouches: [{ identifier: mouseIdentifier, clientX: e.clientX, clientY: e.clientY, target: e.target }]
    } as any
    pointer.handleTouchEnd(mockTouchEvent)
    updateTouchCount()
})

// 添加标题
const title = new Text({
    x: 20,
    y: 20,
    text: 'leafer-x-multitouch 演示',
    fontSize: 28,
    fontWeight: 'bold',
    fill: '#333'
})

// 添加使用提示
const hint = new Text({
    x: 20,
    y: 60,
    text: '💡 使用多个手指(或鼠标)同时拖动两个方块试试!',
    fontSize: 16,
    fill: '#666'
})

// 添加触摸点计数器
const touchCounter = new Text({
    x: 20,
    y: 90,
    text: '当前触摸点: 0',
    fontSize: 14,
    fill: '#999'
})

// 更新触摸点计数
const updateTouchCount = () => {
    const count = pointer.getActiveTouchCount()
    touchCounter.text = `当前触摸点: ${count}`
    touchCounter.fill = count > 0 ? '#4B9EFF' : '#999'
}

leafer.add(title)
leafer.add(hint)
leafer.add(touchCounter)

// 创建第一个方块组 (红色)
const group1 = new Group({
    x: 50,
    y: 150
})

const box1 = new Rect({
    width: 100,
    height: 100,
    fill: '#FF4B4B',
    cornerRadius: 20
})

const label1 = new Text({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    text: '方块 1',
    fontSize: 14,
    fill: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    verticalAlign: 'middle'
})

group1.add(box1)
group1.add(label1)

// 创建第二个方块组 (蓝色)
const group2 = new Group({
    x: 200,
    y: 150
})

const box2 = new Rect({
    width: 100,
    height: 100,
    fill: '#4B9EFF',
    cornerRadius: 20
})

const label2 = new Text({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    text: '方块 2',
    fontSize: 14,
    fill: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    verticalAlign: 'middle'
})

group2.add(box2)
group2.add(label2)

leafer.add(group1)
leafer.add(group2)

// 注册交互逻辑 - 注册 Group,子元素的触摸会冒泡到 Group
const setupDrag = (group: Group) => {
    pointer.register(group, {
        onStart: (_touch, data) => {
            group.opacity = 0.5
            // 记录相对位置
            data.offsetX = group.x - data.startX
            data.offsetY = group.y - data.startY
        },
        onMove: (touch, data) => {
            // 更新 Group 位置,所有子元素自动跟随
            group.x = touch.clientX + data.offsetX
            group.y = touch.clientY + data.offsetY
        },
        onEnd: (_touch, _data) => {
            group.opacity = 1
        }
    })
}

setupDrag(group1)
setupDrag(group2)

// 添加底部说明
const footer = new Text({
    x: 20,
    y: window.innerHeight - 40,
    text: '📱 支持 Web、微信小游戏等多平台 | 点击文字或方块都能拖拽',
    fontSize: 12,
    fill: '#999'
})

leafer.add(footer)
