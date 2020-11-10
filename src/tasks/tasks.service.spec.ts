import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CreateTaskDto } from './dto/create-task.dto';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { TaskStatus } from './task-status.enum';
import { TaskRepository } from './task.repository';
import { TasksService } from './tasks.service';

const mockTaskRepository = () => ({
  getTasks: jest.fn(),
  findOne: jest.fn(),
  createTask: jest.fn(),
  delete: jest.fn(),
});

const mockUser = { username: 'Test user', id: 1 };

describe('Tasks service', () => {
  let tasksService;
  let taskRepository;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: TaskRepository, useFactory: mockTaskRepository },
      ],
    }).compile();

    tasksService = await module.get(TasksService);
    taskRepository = await module.get(TaskRepository);
  });

  describe('getTask', () => {
    it('Gets all tasks from the repository', async () => {
      taskRepository.getTasks.mockResolvedValue('somevalue');
      expect(taskRepository.getTasks).not.toHaveBeenCalled();

      const filters: GetTasksFilterDto = {
        status: TaskStatus.IN_PROGRESS,
        search: 'some query',
      };
      const result = await tasksService.getTasks(filters, mockUser);

      expect(taskRepository.getTasks).toHaveBeenCalled();
      expect(taskRepository.getTasks).toHaveBeenCalledWith(filters, mockUser);
      expect(result).toBe('somevalue');
    });
  });

  describe('getTaskById', () => {
    it('calls taskRepository.findOne() and successfully retrieve and return the task', async () => {
      const mockTask = {
        title: 'Test task',
        description: 'Test desc',
      };
      taskRepository.findOne.mockResolvedValue(mockTask);

      const result = await tasksService.getTaskById(1, mockUser);

      expect(result).toBe(mockTask);
      expect(taskRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, userId: mockUser.id },
      });
    });
    it('throws an error as task is not found', () => {
      taskRepository.findOne.mockResolvedValue(null);

      expect(tasksService.getTaskById(1, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createTask()', () => {
    it('returns what taskRepository.createTask() returns', async () => {
      const task = { id: 1 };
      const createTaskDto: CreateTaskDto = {
        title: 'title',
        description: 'desc',
      };
      taskRepository.createTask.mockResolvedValue(task);
      const result = await tasksService.createTask(createTaskDto, mockUser);

      expect(result).toBe(task);
      expect(taskRepository.createTask).toHaveBeenCalledWith(
        createTaskDto,
        mockUser,
      );
    });
  });

  describe('deleteTask()', () => {
    it('deleteTask calls taskRepository.delete', async () => {
      taskRepository.delete.mockResolvedValue({ affected: 1 });
      await tasksService.deleteTask(1, mockUser);

      expect(taskRepository.delete).toHaveBeenCalledWith({
        userId: mockUser.id,
        id: 1,
      });
    });

    it('throws an error when affected is 0', async () => {
      taskRepository.delete.mockResolvedValue({ affected: 0 });

      expect(tasksService.deleteTask(1, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateTaskStatus', () => {
    it('calls getTaskById and runs save() method', async () => {
      const task = { save: jest.fn() };
      const id = 10;
      const status = TaskStatus.IN_PROGRESS;
      tasksService.getTaskById = jest.fn().mockResolvedValue(task);
      const result = await tasksService.updateTaskStatus(id, status, mockUser);

      expect(tasksService.getTaskById).toHaveBeenCalledWith(id, mockUser);
      expect(task.save).toHaveBeenCalled();
      expect(result.status).toBe(status);
    });
  });
});
