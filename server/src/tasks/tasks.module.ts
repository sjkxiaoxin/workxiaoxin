import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TeamsModule } from '../teams/teams.module';

@Module({
  imports: [TeamsModule],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}