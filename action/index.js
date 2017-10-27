import * as constant from '../constant'

export function RECEIVE_TODO(todoList) { 
    return {
        type: constant.RECEIVE_TODO,
        todoList
    }
}

export function RECEIVE_TODO_DETAIL(todoDetail) { 
    return {
        type: constant.RECEIVE_TODO_DETAIL,
        todoDetail
    }
}