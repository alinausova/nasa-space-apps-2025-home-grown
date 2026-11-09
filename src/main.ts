import './styles/app.css'
import { mount } from 'svelte'
import App from './App.svelte'
import { i18n } from './lib/i18n/locale.svelte'

i18n.init()

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
