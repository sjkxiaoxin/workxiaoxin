import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { TasksModule } from './tasks/tasks.module';
import { AsrModule } from './asr/asr.module';
import { UsersModule } from './users/users.module';
import { NotificationModule } from './notification/notification.module';
import { TeamsModule } from './teams/teams.module';
import { SeedController } from './seed/seed.controller';
import { FixDbController } from './fix-db/fix-db.controller';

@Module({
  imports: [TasksModule, AsrModule, UsersModule, NotificationModule, TeamsModule],
  controllers: [AppController, SeedController, FixDbController],
  providers: [AppService],
})
export class AppModule {}
