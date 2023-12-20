/* @flow */

import type Router from '../index'
import { History } from './base'
import { cleanPath } from '../util/path'
import { START } from '../util/route'
import { setupScroll, handleScroll } from '../util/scroll'
import { pushState, replaceState, supportsPushState } from '../util/push-state'

export class HTML5History extends History {
  _startLocation: string

  constructor (router: Router, base: ?string) {
    super(router, base)

    this._startLocation = getLocation(this.base)
  }

  setupListeners () {
    if (this.listeners.length > 0) {
      return
    }

    const router = this.router
    const expectScroll = router.options.scrollBehavior // router的配置option对象是否存在scrollBehavior
    const supportsScroll = supportsPushState && expectScroll

    if (supportsScroll) {
      // listeners-add 1.监听数组添加setUpScroll()执行后返回的取消函数(handlePopState)
      this.listeners.push(setupScroll()) // setupScroll函数执行，会添加一个popstate监听
    }

    const handleRoutingEvent = () => {
      debugger
      const current = this.current

      // Avoiding first `popstate` event dispatched in some browsers but first
      // history route not updated since async guard at the same time.
      const location = getLocation(this.base)
      if (this.current === START && location === this._startLocation) {
        return
      }

      this.transitionTo(location, route => {
        if (supportsScroll) {
          handleScroll(router, route, current, true) // 回退前进时，handleScroll函数 isPop参数为true
        }
      })
    }
    // 注意popstate触发时机: 一个popstate事件，在前进和后退、history.go()或history.back()等方式进入页面时触发
    window.addEventListener('popstate', handleRoutingEvent)
    // listeners-add 2.监听数组添加新的取消popstate监听函数(handleRoutingEvent)
    this.listeners.push(() => {
      window.removeEventListener('popstate', handleRoutingEvent)
    })
  }

  go (n: number) {
    window.history.go(n)
  }

  push (location: RawLocation, onComplete?: Function, onAbort?: Function) {
    debugger
    const { current: fromRoute } = this
    this.transitionTo(location, route => {
      // 真正history pushState跳转的地方
      pushState(cleanPath(this.base + route.fullPath))
      // 处理页面滚动
      handleScroll(this.router, route, fromRoute, false) // push时，handleScroll函数 isPop参数为false
      onComplete && onComplete(route)
    }, onAbort)
  }

  replace (location: RawLocation, onComplete?: Function, onAbort?: Function) {
    const { current: fromRoute } = this
    this.transitionTo(location, route => {
      replaceState(cleanPath(this.base + route.fullPath))
      handleScroll(this.router, route, fromRoute, false) // replace时，handleScroll函数 isPop参数为false
      onComplete && onComplete(route)
    }, onAbort)
  }

  ensureURL (push?: boolean) {
    if (getLocation(this.base) !== this.current.fullPath) {
      const current = cleanPath(this.base + this.current.fullPath) // 得到要跳转的url
      push ? pushState(current) : replaceState(current)
    }
  }

  getCurrentLocation (): string {
    return getLocation(this.base)
  }
}

export function getLocation (base: string): string {
  let path = window.location.pathname // 例如 /a/app
  const pathLowerCase = path.toLowerCase()
  const baseLowerCase = base.toLowerCase()
  // base="/a" shouldn't turn path="/app" into "/a/pp"
  // https://github.com/vuejs/vue-router/issues/3555
  // so we ensure the trailing slash in the base
  if (base && ((pathLowerCase === baseLowerCase) ||
    (pathLowerCase.indexOf(cleanPath(baseLowerCase + '/')) === 0))) {
    path = path.slice(base.length)
  }
  return (path || '/') + window.location.search + window.location.hash
}
