import React from 'react';
import AppContainer from '../src/app'
import ReactDOM from 'react-dom';
//import { AppContainer } from 'react-hot-loader'
import configureStore from '../src/store'

const appContainer = document.getElementById('wrap')
const appObj = document.getElementById('data')
const appData = JSON.parse(appObj.getAttribute("data-state"))
appObj.remove()

appData.first = true
const store = configureStore(appData)

ReactDOM.render(
    <AppContainer store={store}/>
    ,
    appContainer
)