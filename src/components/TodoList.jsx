import { useEffect, useMemo, useRef, useState } from 'react'
import { useAutoAnimate } from '@formkit/auto-animate/react'

const TODOS_KEY = 'focus_dashboard_todos'
const MAX_TODOS = 5

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
      stroke="currentColor"
      className="h-3 w-3 text-white/95"
    >
      <polyline
        points="4 10.5 8 14.5 16 6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.6"
        strokeDasharray="16"
        strokeDashoffset={active ? 0 : 16}
        opacity={active ? 1 : 0}
        style={{
          transition:
            'stroke-dashoffset 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 180ms ease-out',
        }}
      />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="h-3.5 w-3.5"
    >
      <path d="M7 4h6" strokeLinecap="round" />
      <path d="M8 4l.45-1.3A1 1 0 019.37 2h1.26a1 1 0 01.92.7L12 4" strokeLinecap="round" />
      <path d="M5 6h10" strokeLinecap="round" />
      <rect x="6" y="6" width="8" height="11" rx="1.6" />
      <path d="M8.5 9.5v5" strokeLinecap="round" />
      <path d="M11.5 9.5v5" strokeLinecap="round" />
    </svg>
  )
}

const CARD_CLASSES =
  'flex h-90 w-48 flex-col overflow-hidden rounded-3xl border border-white/15 bg-white/[0.08] p-4 text-white shadow-[0_30px_60px_-40px_rgba(15,23,42,0.85)] backdrop-blur-md transition duration-300 hover:border-white/25'

export function TodoList() {
  const [todos, setTodos] = useState(() => readStoredTodos())
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef(null)
  const [listParent] = useAutoAnimate({
    duration: 280,
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    respectReducedMotion: true,
  })

  useEffect(() => {
    if (!todos.length) {
      window.localStorage.removeItem(TODOS_KEY)
      return
    }
    window.localStorage.setItem(TODOS_KEY, JSON.stringify(todos))
  }, [todos])

  useEffect(() => {
    const id = window.setTimeout(() => inputRef.current?.focus(), 80)
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

  const orderedTodos = useMemo(
    () => [...pendingTodos, ...completedTodos],
    [pendingTodos, completedTodos],
  )
  const maxTodosReached = orderedTodos.length >= MAX_TODOS

  const handleInputKeyDown = (event) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    const trimmed = inputValue.trim()
    if (!trimmed || maxTodosReached) return

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

  return (
    <section className={CARD_CLASSES}>
      <div className="flex items-center justify-between">
        <h2 className="text-[0.55rem] font-semibold uppercase tracking-[0.4em] text-white/70">
          Todo List
        </h2>
        <div className="text-[0.55rem] uppercase tracking-[0.28em] text-white/60">
          {pendingTodos.length}{' '}
          <span className="text-white/35">left</span>
        </div>
      </div>

      <div className="mt-3 flex flex-1 flex-col overflow-hidden rounded-2xl border border-white/15 bg-white/5">
        <div className="custom-scroll flex-1 overflow-y-scroll px-1 py-2">
          <ul
            ref={listParent}
            className="flex min-h-full flex-col gap-2 list-none"
          >
            {orderedTodos.length ? (
              orderedTodos.map((todo) => {
                const completed = todo.completed
                return (
                  <li
                    key={todo.id}
                    data-completed={completed ? 'true' : 'false'}
                    className="todo-item group flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.08] px-3 py-2 text-sm text-white/90 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-white/25 hover:bg-white/[0.12]"
                  >
                    <button
                      type="button"
                      onClick={() => toggleTodo(todo.id)}
                      aria-pressed={completed}
                      className={`flex h-6 w-6 items-center justify-center rounded-full border transition-all duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
                        completed
                          ? 'border-sky-200 bg-sky-500/80 shadow-[0_12px_25px_-15px_rgba(56,189,248,0.9)]'
                          : 'border-white/30 bg-transparent hover:border-white/45'
                      }`}
                      aria-label={
                        completed
                          ? 'Mark todo as incomplete'
                          : 'Mark todo as complete'
                      }
                    >
                      <CheckIcon active={completed} />
                    </button>
                    <p
                      className={`flex-1 text-xs font-medium transition-colors duration-300 ease-out ${
                        completed ? 'text-white/55 line-through' : 'text-white/90'
                      }`}
                    >
                      {todo.text}
                    </p>
                    <button
                      type="button"
                      onClick={() => deleteTodo(todo.id)}
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-white/15 text-white/45 opacity-0 transition-all duration-300 ease-out group-hover:opacity-100 hover:border-rose-200/60 hover:text-rose-200/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200/60"
                      aria-label="Delete todo"
                    >
                      <TrashIcon />
                    </button>
                  </li>
                )
              })
            ) : (
              <li
                key="empty-state"
                className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[0.04] px-4 py-6 text-center text-[0.6rem] text-white/55"
              >
                No todos yet. Add a task to keep it top of mind.
              </li>
            )}
          </ul>
        </div>
        <div className="border-t border-white/10 px-2 py-2">
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={
              maxTodosReached ? 'Todo limit reached' : 'Add todo and press Enter'
            }
            disabled={maxTodosReached}
            className={`w-full rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-[0.65rem] text-white placeholder:text-white/45 focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-300/50 ${
              maxTodosReached ? 'cursor-not-allowed opacity-70' : ''
            }`}
          />
          {maxTodosReached ? (
            <p className="mt-2 text-[0.55rem] uppercase tracking-[0.3em] text-white/55">
              Maximum of {MAX_TODOS} todos. Complete or delete one to add more.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export default TodoList
