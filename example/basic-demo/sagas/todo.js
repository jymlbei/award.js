
import { call, put, take, takeEvery, takeLatest,delay } from 'redux-saga/effects'
import { RECEIVE_TODO } from '../actions'
import axios from 'axios'

function* getTodoList() {
    try {
        
        const { data: { todoList } } = yield call(axios.get, 'http://localhost:4000/todo_list')

        yield put(RECEIVE_TODO(todoList))
        
    } catch (error) {
        yield put(RECEIVE_TODO(error))
    }
}

function* addTodo(action) { 
    const { data, name } = action

    let id = 0
    data.map(item => { 
        id = item.id > id ? item.id : id
    })
    
    id = id + 1
    data.unshift({ id, name, finish: false })
    
    yield put(RECEIVE_TODO(Object.assign([],data)))

}

function* delTodo(action) { 
    let { data, id } = action

    data = data.filter(item => item.id != id)

    yield put(RECEIVE_TODO(Object.assign([],data)))
}

function* finish_todo(action) { 
    let { data, id } = action

    data.map(item => {
        if (item.id === id) {
            item.finish = !item.finish 
        }
    })
    
    yield put(RECEIVE_TODO(Object.assign([],data)))
}

export default function* () { 
    yield takeEvery('/finish_todo', finish_todo)
    yield takeEvery('/get_todo', getTodoList)
    yield takeEvery('/del_todo', delTodo)
    yield takeEvery('/add_todo', addTodo)
}