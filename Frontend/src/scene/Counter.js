import { Scene } from 'phaser'
import vite from '../assets/vite.png'
import phaser from '../assets/phaser.png'
import button from '../assets/button.png'

export const namespace = {
  counter: 0
}

export const add = (text) => {
  namespace.counter += 1
  text.setText(`Count is ${namespace.counter}`)
}

export default class Counter extends Scene {
  constructor() {
    super('Counter')
  }

  preload() {
    this.load.image('vite', vite)
    this.load.image('phaser', phaser)
    this.load.image('button', button)
  }

  create() {
    const vite = this.add.image(250, 150, 'vite').setInteractive()
    const phaser = this.add.image(550, 150, 'phaser').setInteractive()

    vite.on('pointerdown', () => {
      window.open('https://vitejs.dev', '_blank')
    }).on('pointerover', function (pointer) {
      document.body.style.cursor = 'pointer';
      vite.setTint(0xffff00)
    }).on('pointerout', function (pointer) {
      document.body.style.cursor = 'default';
      vite.clearTint()
    })

    phaser.on('pointerdown', () => {
      window.open('https://phaser.io/', '_blank')
    }).on('pointerover', function (pointer) {
      document.body.style.cursor = 'pointer';
      phaser.setTint(0xffff00)
    }).on('pointerout', function (pointer) {
      document.body.style.cursor = 'default';
      phaser.clearTint()
    })

    this.add.text(400, 320, 'Hello, Vite Phaser!', {
      fontSize: '32px',
      color: '#fff',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    const counterText = this.add.text(400, 380, `Count is ${namespace.counter}`, {color: '#fff'}).setOrigin(0.5)

    const button = this.add.image(400, 450, 'button').setInteractive()

    button
    .on('pointerdown', () => {
      button.setScale(.9)
      add(counterText)
    })
    .on('pointerup', () => {
      button.setScale(1)
    })
    .on('pointerover', function (pointer) {
      document.body.style.cursor = 'pointer';
      button.setTint(0xffff00)
    })
    .on('pointerout', function (pointer) {
      document.body.style.cursor = 'default';
      button.clearTint()
    })

    this.add.text(400, 520, 'Click on the Vite or Phaser logo to learn more', {color: '#fff', fontSize: '18px'}).setAlpha(.5).setOrigin(0.5)
  }

  update() {}
}
