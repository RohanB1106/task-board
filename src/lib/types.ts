export type Status = 'todo' | 'in_progress' | 'in_review' | 'done'
export type Priority = 'low' | 'normal' | 'high'

export interface Task {
  id: string
  title: string
  description: string | null
  status: Status
  priority: Priority
  due_date: string | null // YYYY-MM-DD
  position: number
  user_id: string
  created_at: string
  updated_at: string
}

/** Fields the user can set when creating or editing a task. */
export interface TaskInput {
  title: string
  description: string | null
  status: Status
  priority: Priority
  due_date: string | null
}
