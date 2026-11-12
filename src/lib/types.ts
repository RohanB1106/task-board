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
  /** Team member ids (from task_assignees) */
  assignee_ids: string[]
  /** Label ids (from task_labels) */
  label_ids: string[]
}

/** Columns on the tasks table the user can set when creating or editing. */
export interface TaskInput {
  title: string
  description: string | null
  status: Status
  priority: Priority
  due_date: string | null
}

/** Many-to-many links stored in join tables. */
export interface TaskLinks {
  assignee_ids: string[]
  label_ids: string[]
}

export interface TeamMember {
  id: string
  name: string
  color: string
  created_at: string
}

export interface Label {
  id: string
  name: string
  color: string
  created_at: string
}

export interface Comment {
  id: string
  task_id: string
  body: string
  created_at: string
}

export type ActivityAction = 'created' | 'status_changed' | 'edited' | 'assigned' | 'unassigned'

export interface Activity {
  id: string
  task_id: string
  action: ActivityAction
  details: {
    status?: Status
    from?: Status
    to?: Status
    fields?: string[]
    member?: string | null
  }
  created_at: string
}
