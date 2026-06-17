export class CreateTaskDto {
  title: string;
  description?: string;
  assigneeId?: string;
  creatorId: string;
  deadline?: string;
  isUrgent?: boolean;
}

export class UpdateTaskDto {
  title?: string;
  description?: string;
  assigneeId?: string;
  deadline?: string;
  isUrgent?: boolean;
  userId?: string;
}

export class UpdateStatusDto {
  status: 'todo' | 'in_progress' | 'done';
  userId: string;
}

export class CreateCommentDto {
  userId: string;
  content: string;
}