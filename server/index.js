import express from 'express'
import React from 'react'
import { resolve, join } from 'path'
import render, { serveStatic } from './render'
import HotReloader from './hot-reloader'
import Router from './router'
import axios from 'axios'
import parseArgs from 'minimist'
import glob from 'glob-promise'
import Document from './document'
import App from '../lib/app'
import { renderToString, renderToStaticMarkup } from 'react-dom/server'

require('babel-register')({
    presets: ['react', 'es2015']
})

global.SWRN_InServer = true

/**
 * 注册express路由
 * 包括静态资源、react-router、mock数据(api地址)
 */

export default class Server {
    constructor({ dir }) {
        this.dir = resolve(dir)
        this.server = express()
        this.router = new Router(this.dir)

        this.routes = []
    }

    async initRouter() {
        this.routes.map(item => {
            //获取动态页面渲染
            item.path && this.server.get(item.path, async (req, res) => {

                let _Component, _Document, _Main, pageSourcePath = join('bundles', item.page)
                if (process.env.NODE_ENV !== 'production') {

                    const documentPath = join(this.dir, `./.server/dist/page/document.js`)
                    const pagePath = join(this.dir, './.server/dist/', item.page)
                    const mainPath = join(this.dir, `./.server/dist/main.js`)

                    let documentFile = await glob(documentPath)
                    let mainFile = await glob(mainPath)

                    if (documentFile.length) {
                        delete require.cache[require.resolve(documentPath)]
                    }

                    if (mainFile.length) {
                        delete require.cache[require.resolve(mainPath)]
                    }

                    //这里需要删除require的缓存
                    delete require.cache[require.resolve(pagePath)]


                    _Document = documentFile.length ? require(documentPath) : require('./document')
                    _Component = require(pagePath)
                    _Main = mainFile.length ? require(mainPath) : null

                } else {

                    _Document = require(`./dist/page/document.js`)
                    _Component = require(`./dist/page/${item.page}.js`)

                }

                const Component = _Component.default || _Component
                const Document = _Document.default || _Document

                const query = req.params
                const route = item.page
                const initialProps = !Component.getInitialProps ? {} : await Component.getInitialProps({ req, res })

                let html, props = { ...initialProps, route, query, routes:this.routes }

                if (!!_Main) {
                    const Main = _Main.default || _Main
                    props = { ...props, Component, Main }
                    html = renderToStaticMarkup(React.createElement(App,props), props)
                } else {
                    html = render(Component, props)
                }

                //资源路径
                const sourcePath = `/swrn/`

                const _html = render(Document, {
                    sourcePath,
                    hasMain:!!_Main,
                    page: pageSourcePath,
                    comProps: props,
                    html
                })

                res.send('<!DOCTYPE html>' + _html)
            })

            //获取静态资源
            this.server.get(`/swrn/bundles${item.page}`, async (req, res) => { 
                const path = join(this.dir, '.server', `bundles/${item.page}`)
                return await serveStatic(req, res, path)
            })
        })

        this.server.get('/swrn/main.js', async (req, res) => {
            const path = join(this.dir, '.server', 'main.js')
            return await serveStatic(req, res, path)
        })
    }

    async prepare() {
        this.routes = await this.router.routers()
        await this.initRouter()
        await new HotReloader(this.server, this.dir, this.routes).start()
    }

    async start(prot, hostname) {
        await this.prepare()
        this.server.listen(4000, () => {
            console.log('http://localhost:4000')
        })
    }
}
