import glob from 'glob-promise'
import { resolve, join } from 'path'
import render from './render'

export default class Router {

    constructor(dir) { 
        this.dir = dir
    }

    async routers() { 
        let routers

        routers = await this.getConfigRoutes()
        if (!routers.length) {
            routers = await this.getRoutes()
        }    
        
        return routers
    }

    //这里获取的是默认路由
    async getRoutes() {

        let routes = await glob('routes.js', { cwd: this.dir })
        const mocks = await glob('mock/**/*.js', { cwd: this.dir })
        const pages = await glob('page/**/*.js', { cwd: this.dir })

        if (mocks.length) {
            require(join(this.dir, './mock'))(this.server)
        }

        if (routes.length) {
            routes = require(join(this.dir, './routes'))
        } else {
            routes = []
            pages.map(item => {
                let _path = item.substr(0, item.length - 3).substr(4)
                _path = _path.split("/")
                _path.shift()

                let path, page, pop = false

                if (_path[_path.length - 1] == 'index') {
                    _path.pop()
                    pop = true
                }

                if (_path.length) {
                    const join = _path.join('/')
                    path = `/${join}`
                    page = 'page/' + join + (pop ? "/index" : '') + '.js'
                } else {
                    path = '/'
                    page = 'page/index.js'
                }

                routes.push({
                    page,
                    path
                })
            })
        }

        return routes
    }

    //获取引用swrn/router的路由
    async getConfigRoutes() {
        global.SWRN_ROUTE = true
        let _Router
        const routePath = join(this.dir, `./.server/dist/main.js`)
        _Router = require(routePath)
        const Router = _Router.default || _Router

        const routerHtml = render(Router)

        const singleRouter = /swrn_route=[\'\"]?([^\'\"]*)[\'\"]?/i

        const _routers = routerHtml.match(/swrn_route=[\'\"]?([^\'\"]*)[\'\"]?/gi)

        const routers = []

        if (!!_routers==true) {
            _routers.map(item => {
                let _tmp = item.match(singleRouter)
                _tmp = JSON.parse(_tmp[1].replace(/&quot;/g, '"'))

                _tmp.page = _tmp.render
                delete _tmp.render

                routers.push(_tmp)

            })
        }    
        global.SWRN_ROUTE = false
        return routers
    }
}