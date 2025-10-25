import { useEffect, useMemo, useRef, useState } from 'react'

const TODOS_KEY = 'focus_dashboard_todos'

function readStoredTodos() {
  if (typeof window === 'undefined') return []
  const raw = window.localStorage.getItem(TODOS_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((item) => ({
        id: item.id,
        text: item.text,
        completed: Boolean(item.completed),
      }))
      .filter((item) => typeof item.text === 'string' && item.text.trim().length)
  } catch (error) {
    console.warn('Unable to parse stored todos', error)
    window.localStorage.removeItem(TODOS_KEY)
    return []
  }
}

function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function CheckIcon({ active }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="none"
      className={`h-3.5 w-3.5 stroke-[3] ${active ? 'stroke-white' : 'stroke-transparent'}`}
    >
      <polyline
        points="4 10.5 8 14.5 16 6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const PANEL_CLASSES =
  'w-full rounded-[28px] border border-white/15 bg-white/[0.13] px-6 py-7 shadow-[0_45px_80px_-45px_rgba(11,20,45,0.85)] backdrop-blur-2xl transition duration-500 hover:border-white/25'

export function TodoList() {
  const [todos, setTodos] = useState(() => readStoredTodos())
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (!todos.length) {
      window.localStorage.removeItem(TODOS_KEY)
      return
    }
    window.localStorage.setItem(TODOS_KEY, JSON.stringify(todos))
  }, [todos])

  useEffect(() => {
    const id = window.setTimeout(() => inputRef.current?.focus(), 50)
    return () => window.clearTimeout(id)
  }, [])

  const pendingTodos = useMemo(
    () => todos.filter((todo) => !todo.completed),
    [todos],
  )

  const completedTodos = useMemo(
    () => todos.filter((todo) => todo.completed),
    [todos],
  )

  const handleInputKeyDown = (event) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    const trimmed = inputValue.trim()
    if (!trimmed) return

    setTodos((current) => [
      ...current,
      {
        id: createId(),
        text: trimmed,
        completed: false,
      },
    ])
    setInputValue('')
  }

  const toggleTodo = (id) => {
    setTodos((current) =>
      current.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      ),
    )
  }

  const deleteTodo = (id) => {
    setTodos((current) => current.filter((todo) => todo.id !== id))
  }

  const renderTodo = (todo) => (
    <li
      key={todo.id}
      className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3 transition hover:border-white/25 hover:bg-white/[0.12]"
    >
      <button
        type="button"
        onClick={() => toggleTodo(todo.id)}
        aria-pressed={todo.completed}
        className={`flex h-6 w-6 items-center justify-center rounded-full border border-white/30 transition ${
          todo.completed
            ? 'bg-sky-400/90 shadow-[0_10px_25px_-12px_rgba(56,189,248,0.7)]'
            : 'bg-transparent hover:border-white/45'
        }`}
        aria-label={
          todo.completed ? 'Mark todo as incomplete' : 'Mark todo as complete'
        }
      >
        <CheckIcon active={todo.completed} />
      </button>
      <p
        className={`flex-1 text-sm text-white/90 transition ${
          todo.completed ? 'text-white/55 line-through' : ''
        }`}
      >
        {todo.text}
      </p>
      <button
        type="button"
        onClick={() => deleteTodo(todo.id)}
        className="ml-2 text-[0.6rem] uppercase tracking-[0.35em] text-white/50 opacity-0 transition group-hover:opacity-100 hover:text-rose-200"
        aria-label="Delete todo"
      >
        Delete
      </button>
    </li>
  )

  return (
    <section className={PANEL_CLASSES}>
      <div className="flex items-center justify-between">
        <h2 className="text-[0.65rem] font-semibold uppercase tracking-[0.45em] text-white/70">
          Todo List
        </h2>
        <div className="flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.3em] text-white/50">
          <span>{pendingTodos.length} Left</span>
          <span className="text-white/35">•</span>
          <span>{completedTodos.length} Done</span>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {[...pendingTodos, ...completedTodos].length ? (
          <ul className="flex flex-col gap-3">
            {pendingTodos.map(renderTodo)}
            {completedTodos.length > 0 && (
              <li className="pt-2 text-[0.6rem] uppercase tracking-[0.4em] text-white/45">
                Completed
              </li>
            )}
            {completedTodos.map(renderTodo)}
          </ul>
        ) : (
          <p className="rounded-2xl border border-dashed border-white/15 bg-white/[0.06] px-5 py-7 text-sm text-white/55">
            No todos yet. Add the tasks you want to keep track of today.
          </p>
        )}
      </div>

      <div className="mt-6">
        <input
          ref={inputRef}
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder="Add a new todo and press Enter"
          className="w-full rounded-2xl border border-white/20 bg-white/[0.08] px-4 py-3 text-sm text-white/90 placeholder:text-white/45 focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-300/60"
        />
      </div>
    </section>
  )
}

export default TodoList
