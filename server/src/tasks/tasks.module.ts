import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TeamsModule } from '../teams/teams.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [TeamsModule, NotificationModule],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}