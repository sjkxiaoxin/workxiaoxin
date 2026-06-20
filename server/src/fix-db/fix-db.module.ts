import { Module } from '@nestjs/common'
import { FixDbController } from './fix-db.controller'

@Module({
  controllers: [FixDbController],
})
export class FixDbModule {}
